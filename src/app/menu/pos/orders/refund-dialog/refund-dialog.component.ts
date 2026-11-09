import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreStore } from '../../../../shared/stores/store.store';
import { RefundService } from '../../../../shared/services/refund.service';
import { OfflineStore } from '../../../../shared/offline/offline-store.service';
import { ConnectivityService } from '../../../../shared/offline/connectivity.service';
import {
  CreateRefundRequest,
  Refund,
  RefundReasonCode,
  Refundable,
  StockAction,
} from '../../../../shared/models/refund.model';
import { ValidationErrorsDialogComponent, ValidationErrorsDialogData } from '../../../../shared/components/validation-errors-dialog/validation-errors-dialog.component';
import { TrPipe } from '../../../../shared/i18n/tr.pipe';

export interface RefundDialogData {
  orderId: string;
}

/** Labels for the reason codes the backend accepts. */
export const refundReasonLabel = (code: RefundReasonCode): string => {
  switch (code) {
    case 'CUSTOMER_CHANGED_MIND': return $localize`Customer changed their mind`;
    case 'WRONG_ITEM': return $localize`Wrong item served`;
    case 'QUALITY_ISSUE': return $localize`Quality problem`;
    case 'ORDER_MISTAKE': return $localize`Order mistake`;
    case 'DUPLICATE_CHARGE': return $localize`Charged twice`;
    case 'LONG_WAIT': return $localize`Waited too long`;
    case 'GOODWILL': return $localize`Goodwill`;
    default: return $localize`Other`;
  }
};

/** Same maths as the backend so the total shown is the total that will be refunded. */
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-refund-dialog',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    TrPipe,
  ],
  templateUrl: './refund-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class RefundDialogComponent implements OnInit {
  private data = inject<RefundDialogData>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<RefundDialogComponent, Refund | undefined>);
  private refundService = inject(RefundService);
  private storeStore = inject(StoreStore);
  private offlineStore = inject(OfflineStore);
  private net = inject(ConnectivityService);

  /** One key per dialog, reused on every retry, so a double click or a timeout retry cannot refund twice. */
  private idempotencyKey = crypto.randomUUID();

  public loading = signal(true);
  public loadError = signal<string | null>(null);
  public info = signal<Refundable | null>(null);
  public submitting = signal(false);
  public error = signal<string | null>(null);

  public mode = signal<'items' | 'amount'>('items');
  /** lineId -> quantity chosen */
  public quantities = signal<Record<string, number>>({});
  /** lineId -> what happens to the stock */
  public stockActions = signal<Record<string, StockAction>>({});
  public amount = signal<number | null>(null);
  public reason = signal<RefundReasonCode | ''>('');
  public note = signal('');
  /** '' = the original payment methods in proportion; otherwise one method */
  public tender = signal('');
  /** Blink has no refund call: the money is returned through Blink by the merchant and its reference is recorded here. */
  public blinkRef = signal('');
  public involvesBlink = computed(() => {
    const isBlink = (m: string) => m.trim().toLowerCase() === 'blink';
    return this.tender() ? isBlink(this.tender()) : (this.info()?.tenders ?? []).some((t) => isBlink(t.method) && t.remaining > 0);
  });
  public pin = signal('');
  /** Set after the server asks for a second approver, so the PIN box appears. */
  public approvalRequested = signal(false);
  /** No connection: the screen is worked out from this device's copy of the sale, and the refund is saved here and sent later. */
  public offline = signal(false);

  public currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');
  public reasons = computed(() => (this.info()?.reasons ?? []).map((code) => ({ code, label: refundReasonLabel(code) })));
  public reasonLabel = refundReasonLabel;

  /** Whether the server would ask for a manager's PIN: no permission, or an amount above the store's limit. */
  private needsApproval = computed(() => {
    const info = this.info();
    if (!info) return false;
    const limit = info.approvalLimit;
    return this.approvalRequested() || !info.mayRefund || (typeof limit === 'number' && limit > 0 && this.total() > limit);
  });

  // A PIN cannot be checked without the server, so offline there is no box for it (see `problems`).
  public showPin = computed(() => !this.offline() && (this.approvalRequested() || (this.info() ? !this.info()!.mayRefund : false)));

  /** What the chosen items are worth as a share of the sale, in the same way the server works it out. */
  public total = computed(() => {
    const info = this.info();
    if (!info) return 0;
    if (this.mode() === 'amount') return money(Number(this.amount()) || 0);
    const basis = info.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const q = this.quantities();
    const picked = info.lines.reduce((s, l) => s + l.unitPrice * (q[l.lineId] || 0), 0);
    if (picked <= 0 || basis <= 0) return 0;
    const completes = info.lines.every((l) => l.refundableQuantity - (q[l.lineId] || 0) <= 0);
    return completes ? info.remainingAmount : Math.min(money((info.total * picked) / basis), info.remainingAmount);
  });

  public pickedCount = computed(() => Object.values(this.quantities()).reduce((s, n) => s + n, 0));

  /** Single methods that can take the whole refund on their own. */
  public singleTenders = computed(() => (this.info()?.tenders ?? []).filter((t) => t.remaining + 0.005 >= this.total() && this.total() > 0));

  /** "Other" says nothing on its own, and the tax authority wants the real reason on the credit note. */
  public noteRequired = computed(() => this.reason() === 'OTHER' && this.info()?.noteRequiredForOther === true);

  /** What still stops the refund, in plain words; shown in a dialog instead of leaving the button dead. */
  public problems = computed<{ path: string; title: string; detail: string }[]>(() => {
    const out: { path: string; title: string; detail: string }[] = [];
    const info = this.info();
    if (!info) return out;
    if (this.total() <= 0) {
      out.push(this.mode() === 'amount'
        ? { path: 'amount', title: $localize`Amount`, detail: $localize`Enter how much to give back.` }
        : { path: 'items', title: $localize`Items`, detail: $localize`Choose at least one item to refund.` });
    } else if (this.mode() === 'amount' && this.total() > info.remainingAmount + 0.005) {
      out.push({ path: 'amount', title: $localize`Amount`, detail: $localize`You can give back at most what is left of this sale.` });
    }
    if (!this.reason()) out.push({ path: 'reason', title: $localize`Reason`, detail: $localize`Say why this sale is being refunded.` });
    if (this.noteRequired() && !this.note().trim()) out.push({ path: 'note', title: $localize`Note`, detail: $localize`Describe the reason, since “Other” does not say what happened.` });
    if (this.offline() && this.needsApproval()) {
      out.push({ path: 'approval', title: $localize`Manager approval`, detail: $localize`This refund needs a manager's PIN, which can only be checked online. Reconnect to approve it.` });
    }
    if (this.involvesBlink() && this.blinkRef().trim().length < 3) out.push({ path: 'blink', title: $localize`Blink refund reference`, detail: $localize`Blink payments are refunded outside Shopbot. Return the money through Blink, then enter its reference.` });
    if (this.showPin() && !this.pin().trim()) out.push({ path: 'pin', title: $localize`Manager PIN`, detail: $localize`A manager must enter their PIN to approve this refund.` });
    return out;
  });

  public canSubmit = computed(() => !this.submitting() && !!this.info() && this.problems().length === 0);

  ngOnInit(): void {
    if (this.net.offline()) {
      void this.loadOffline();
      return;
    }
    this.refundService.refundable(this.data.orderId).subscribe({
      next: (info) => this.show(info),
      error: (err) => {
        // The server cannot be reached (status 0): carry on from this device's copy of the sale.
        if (!err?.status) void this.loadOffline();
        else {
          this.loading.set(false);
          this.loadError.set(err?.error?.message || $localize`Could not load this order.`);
        }
      },
    });
  }

  private show(info: Refundable): void {
    this.info.set(info);
    this.loading.set(false);
    if (!info.paid) this.loadError.set($localize`This order has not been paid. Void it instead.`);
    else if (info.voided) this.loadError.set($localize`This order was cancelled, so there is nothing to refund.`);
    else if (info.remainingAmount <= 0) this.loadError.set($localize`This order has already been fully refunded.`);
    else if (!info.lines.some((l) => l.refundableQuantity > 0)) this.mode.set('amount');
  }

  private async loadOffline(): Promise<void> {
    const info = await this.refundService.refundableOffline(this.data.orderId);
    if (!info) {
      this.loading.set(false);
      this.loadError.set($localize`There is no connection, and this sale is not saved on this device. Open it once while you are online to refund it offline.`);
      return;
    }
    this.offline.set(true);
    this.show(info);
  }

  /** Keeps the refund on this device; the server records it (and issues the credit note) when the connection is back. */
  private async saveOffline(body: CreateRefundRequest, info: Refundable): Promise<void> {
    const storeId = this.storeStore.selectedStore()?._id ?? '';
    const estimate = this.total();
    body.requestedAt = new Date().toISOString();
    const summary = body.lines
      ? body.lines.map((l) => `${l.quantity} × ${info.lines.find((x) => x.lineId === l.lineId)?.name ?? ''}`).join(', ')
      : $localize`Amount refund`;
    try {
      await this.offlineStore.enqueueRefund({ store: storeId, orderId: this.data.orderId, reference: info.reference, body, estimate, summary });
    } catch {
      this.submitting.set(false);
      this.error.set($localize`This device could not save the refund. Please try again.`);
      return;
    }
    const saved: Refund = {
      _id: String(body.idempotencyKey),
      refundNumber: $localize`pending`,
      order: this.data.orderId,
      store: storeId,
      orderReference: info.reference,
      kind: body.lines ? 'items' : 'amount',
      lines: [],
      total: estimate,
      tenders: [],
      reasonCode: body.reasonCode,
      note: body.note,
      status: 'completed',
      createdAt: new Date().toISOString(),
      pendingSync: true,
    };
    this.dialogRef.close(saved);
  }

  public setQty(lineId: string, qty: number, max: number): void {
    const next = Math.min(Math.max(qty, 0), max);
    this.quantities.update((q) => ({ ...q, [lineId]: next }));
    this.tender.set('');
  }

  public stockFor(lineId: string): StockAction {
    return this.stockActions()[lineId] ?? 'RETURN';
  }

  public setStock(lineId: string, action: StockAction): void {
    this.stockActions.update((s) => ({ ...s, [lineId]: action }));
  }

  public selectAll(): void {
    const q: Record<string, number> = {};
    for (const l of this.info()?.lines ?? []) if (l.refundableQuantity > 0) q[l.lineId] = l.refundableQuantity;
    this.quantities.set(q);
    this.tender.set('');
  }

  public clearAll(): void {
    this.quantities.set({});
  }

  public submit(): void {
    const info = this.info();
    if (!info || this.submitting()) return;
    if (this.problems().length) {
      const labels: Record<string, { title: string; detail: string }> = {};
      for (const p of this.problems()) labels[p.path] = { title: p.title, detail: p.detail };
      this.dialog.open(ValidationErrorsDialogComponent, {
        data: { invalidControls: this.problems().map((p) => p.path), labels, title: $localize`Form Validation Errors`, message: $localize`Please fix the following errors before submitting:` } as ValidationErrorsDialogData,
        width: '500px',
        maxWidth: '90vw',
      });
      return;
    }

    const body: CreateRefundRequest = {
      reasonCode: this.reason() as RefundReasonCode,
      note: this.note().trim() || undefined,
      idempotencyKey: this.idempotencyKey,
      approverPin: this.showPin() ? this.pin().trim() : undefined,
    };
    if (this.mode() === 'items') {
      body.lines = info.lines
        .filter((l) => (this.quantities()[l.lineId] || 0) > 0)
        .map((l) => ({ lineId: l.lineId, quantity: this.quantities()[l.lineId], stockAction: this.stockFor(l.lineId) }));
    } else {
      body.amount = this.total();
    }
    if (this.tender()) body.tenders = [{ method: this.tender(), amount: this.total() }];
    if (this.involvesBlink()) body.externalReference = this.blinkRef().trim();

    this.submitting.set(true);
    this.error.set(null);
    if (this.offline()) {
      void this.saveOffline(body, info);
      return;
    }
    this.refundService.create(this.data.orderId, body).subscribe({
      next: (res) => this.dialogRef.close(res.refund),
      error: (err) => {
        // The connection dropped while sending. The request may or may not have arrived: saving it with the same key is safe either way.
        if (!err?.status && !this.needsApproval()) {
          void this.saveOffline(body, info);
          return;
        }
        this.submitting.set(false);
        if (err?.status === 403 && err?.error?.code === 'APPROVAL_REQUIRED') {
          this.approvalRequested.set(true);
          this.error.set(err.error.message);
          return;
        }
        this.error.set(err?.error?.message || $localize`The refund could not be completed. Please try again.`);
      },
    });
  }

  public close(): void {
    this.dialogRef.close(undefined);
  }
}
