import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import {
  CreateRefundRequest,
  Refund,
  RefundReasonCode,
  Refundable,
  StockAction,
} from '../../../../shared/models/refund.model';
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
  private dialogRef = inject(MatDialogRef<RefundDialogComponent, Refund | undefined>);
  private refundService = inject(RefundService);
  private storeStore = inject(StoreStore);

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
  public pin = signal('');
  /** Set after the server asks for a second approver, so the PIN box appears. */
  public approvalRequested = signal(false);

  public currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');
  public reasons = computed(() => (this.info()?.reasons ?? []).map((code) => ({ code, label: refundReasonLabel(code) })));
  public reasonLabel = refundReasonLabel;

  public showPin = computed(() => this.approvalRequested() || (this.info() ? !this.info()!.mayRefund : false));

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

  public canSubmit = computed(() => {
    if (this.submitting() || !this.info() || !this.reason() || this.total() <= 0) return false;
    if (this.mode() === 'amount' && this.total() > this.info()!.remainingAmount + 0.005) return false;
    return !this.showPin() || this.pin().trim().length > 0;
  });

  ngOnInit(): void {
    this.refundService.refundable(this.data.orderId).subscribe({
      next: (info) => {
        this.info.set(info);
        this.loading.set(false);
        if (!info.paid) this.loadError.set($localize`This order has not been paid. Void it instead.`);
        else if (info.voided) this.loadError.set($localize`This order was cancelled, so there is nothing to refund.`);
        else if (info.remainingAmount <= 0) this.loadError.set($localize`This order has already been fully refunded.`);
        else if (!info.lines.some((l) => l.refundableQuantity > 0)) this.mode.set('amount');
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.message || $localize`Could not load this order.`);
      },
    });
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
    if (!info || !this.canSubmit()) return;

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

    this.submitting.set(true);
    this.error.set(null);
    this.refundService.create(this.data.orderId, body).subscribe({
      next: (res) => this.dialogRef.close(res.refund),
      error: (err) => {
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
