import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PurchaseOrder, PurchasingService, PoLine } from '../../../../shared/services/purchasing.service';

const message = (e: any): string => {
  const m = e?.error?.message;
  return (Array.isArray(m) ? m.join(' ') : m) || $localize`Something went wrong. Please try again.`;
};
const ymd = (d: Date | null): string | undefined => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : undefined);
const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export interface PoDialogData { storeId: string; order: PurchaseOrder; supplierEmail?: string; mode?: string }

/** Asks for a reason before something that cannot be undone (cancel an order, close what is left, amend a sent order). */
@Component({
  selector: 'app-po-reason-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="!pt-2">
      <p class="mb-4 text-sm text-on-surface-variant">{{ data.message }}</p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label><ng-container i18n>Reason</ng-container></mat-label>
        <textarea matInput rows="3" [ngModel]="reason()" (ngModelChange)="reason.set($event)"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Back</ng-container></button>
      <button matButton="filled" [disabled]="!reason().trim()" (click)="ref.close(reason().trim())">{{ data.confirm }}</button>
    </mat-dialog-actions>`,
})
export class PoReasonDialogComponent {
  readonly data = inject<{ title: string; message: string; confirm: string }>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<PoReasonDialogComponent>);
  readonly reason = signal('');
}

/** Shows what is about to be emailed to the supplier and sends it only when the person says so. */
@Component({
  selector: 'app-po-send-dialog',
  imports: [CurrencyPipe, FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>@if (resend()) {<ng-container i18n>Send this order again</ng-container>} @else {<ng-container i18n>Send purchase order</ng-container>}</h2>
    <mat-dialog-content class="!pt-2">
      <div class="mb-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
        <div class="flex items-center justify-between gap-3">
          <div><div class="text-xs text-on-surface-variant"><ng-container i18n>Supplier</ng-container></div><div class="font-semibold">{{ order.supplierName }}</div></div>
          <div class="text-right"><div class="text-xs text-on-surface-variant">{{ order.number }}</div><div class="font-semibold tabular-nums">{{ order.total | currency: (order.currency || '') : 'symbol' : '1.2-2' }}</div></div>
        </div>
        <ul class="mt-3 flex flex-col gap-1 text-sm">
          @for (l of order.lines; track l.lineId) { <li class="flex justify-between gap-3"><span class="truncate">{{ l.name }}</span><span class="shrink-0 tabular-nums text-on-surface-variant">{{ l.quantity }} {{ l.purchaseUnit }}</span></li> }
        </ul>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label><ng-container i18n>Send to (email)</ng-container></mat-label>
        <input matInput type="email" [ngModel]="to()" (ngModelChange)="to.set($event)" autocomplete="off" />
        @if (!data.supplierEmail) { <mat-hint><ng-container i18n>This supplier has no email saved. Enter one, or download the PDF and send it yourself.</ng-container></mat-hint> }
      </mat-form-field>
      @if (resend()) { <p class="mt-3 text-sm text-on-surface-variant"><ng-container i18n>The supplier already received this order. Sending it again is recorded in its history.</ng-container></p> }
      @if (error()) { <p class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close [disabled]="busy()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="busy() || !to().trim()" (click)="send()"><mat-icon>send</mat-icon> @if (busy()) {<ng-container i18n>Sending…</ng-container>} @else {<ng-container i18n>Send email</ng-container>}</button>
    </mat-dialog-actions>`,
})
export class PoSendDialogComponent {
  readonly data = inject<PoDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PoSendDialogComponent>);
  private readonly api = inject(PurchasingService);
  readonly order = this.data.order;
  readonly resend = computed(() => this.order.status !== 'DRAFT' && !this.order.needsResend);
  readonly to = signal(this.data.supplierEmail ?? '');
  readonly busy = signal(false);
  readonly error = signal('');

  send() {
    this.busy.set(true);
    this.error.set('');
    this.api.send(this.data.storeId, this.order._id, { recipient: this.to().trim(), resend: this.order.status !== 'DRAFT' }).subscribe({
      next: (o) => this.ref.close(o),
      error: (e) => { this.error.set(message(e)); this.busy.set(false); },
    });
  }
}

/** The supplier replied: record their reference and the delivery date they promised. */
@Component({
  selector: 'app-po-confirm-dialog',
  imports: [FormsModule, MatButtonModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Supplier confirmed this order</ng-container></h2>
    <mat-dialog-content class="!pt-2">
      <p class="mb-4 text-sm text-on-surface-variant"><ng-container i18n>Record what the supplier told you. Sending the email is not confirmation; this is.</ng-container></p>
      <div class="flex flex-col gap-1">
        <mat-form-field appearance="outline"><mat-label><ng-container i18n>Their reference</ng-container></mat-label><input matInput [ngModel]="reference()" (ngModelChange)="reference.set($event)" /></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Confirmed delivery date</ng-container></mat-label>
          <input matInput [matDatepicker]="dp" [ngModel]="date()" (ngModelChange)="date.set($event)" />
          <mat-datepicker-toggle matIconSuffix [for]="dp" /><mat-datepicker #dp />
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label><ng-container i18n>Notes</ng-container></mat-label><textarea matInput rows="2" [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea></mat-form-field>
      </div>
      @if (error()) { <p class="rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close [disabled]="busy()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="busy()" (click)="save()"><ng-container i18n>Record confirmation</ng-container></button>
    </mat-dialog-actions>`,
})
export class PoConfirmDialogComponent {
  readonly data = inject<PoDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PoConfirmDialogComponent>);
  private readonly api = inject(PurchasingService);
  readonly reference = signal('');
  readonly date = signal<Date | null>(null);
  readonly notes = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  save() {
    this.busy.set(true);
    this.api.confirm(this.data.storeId, this.data.order._id, { reference: this.reference().trim() || undefined, expectedDate: ymd(this.date()), notes: this.notes().trim() || undefined }).subscribe({
      next: (o) => this.ref.close(o),
      error: (e) => { this.error.set(message(e)); this.busy.set(false); },
    });
  }
}

/** A supplier's invoice number, date and amount kept against the order. Reference only: nothing here marks anything as paid. */
@Component({
  selector: 'app-po-invoice-dialog',
  imports: [FormsModule, MatButtonModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Supplier invoice reference</ng-container></h2>
    <mat-dialog-content class="!pt-2">
      <p class="mb-4 text-sm text-on-surface-variant"><ng-container i18n>Keep the supplier's invoice details with this order. This does not record a payment.</ng-container></p>
      <div class="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
        <mat-form-field appearance="outline"><mat-label><ng-container i18n>Invoice number</ng-container></mat-label><input matInput [ngModel]="number()" (ngModelChange)="number.set($event)" /></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Invoice date</ng-container></mat-label>
          <input matInput [matDatepicker]="dp" [ngModel]="date()" (ngModelChange)="date.set($event)" />
          <mat-datepicker-toggle matIconSuffix [for]="dp" /><mat-datepicker #dp />
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label><ng-container i18n>Invoice amount</ng-container></mat-label><input matInput type="number" min="0" step="0.01" [ngModel]="amount()" (ngModelChange)="amount.set($event)" /></mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="w-full"><mat-label><ng-container i18n>Discrepancy notes</ng-container></mat-label><textarea matInput rows="2" [ngModel]="note()" (ngModelChange)="note.set($event)"></textarea></mat-form-field>
      @if (error()) { <p class="rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close [disabled]="busy()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="busy() || !number().trim()" (click)="save()"><ng-container i18n>Save reference</ng-container></button>
    </mat-dialog-actions>`,
})
export class PoInvoiceDialogComponent {
  readonly data = inject<PoDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PoInvoiceDialogComponent>);
  private readonly api = inject(PurchasingService);
  readonly number = signal('');
  readonly date = signal<Date | null>(null);
  readonly amount = signal<number | null>(null);
  readonly note = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  save() {
    this.busy.set(true);
    const amount = this.amount();
    this.api.addInvoice(this.data.storeId, this.data.order._id, { number: this.number().trim(), date: ymd(this.date()), amount: amount === null || amount === ('' as any) ? undefined : num(amount), note: this.note().trim() || undefined }).subscribe({
      next: (o) => this.ref.close(o),
      error: (e) => { this.error.set(message(e)); this.busy.set(false); },
    });
  }
}

interface Row { line: PoLine; outstanding: number; delivered: number; accepted: number; rejected: number; reason: string }

/**
 * Record a delivery against an order. Shows ordered, already received, outstanding, and what arrived now (delivered, accepted,
 * rejected) per item. Only accepted goods add to stock; the request carries a key made when the dialog opened, so pressing the
 * button twice or retrying after a failure cannot post the delivery twice.
 */
@Component({
  selector: 'app-po-receive-dialog',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './po-receive-dialog.html',
})
export class PoReceiveDialogComponent {
  readonly data = inject<PoDialogData & { canResolve: boolean }>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PoReceiveDialogComponent>);
  private readonly api = inject(PurchasingService);
  private readonly key = crypto.randomUUID();
  readonly order = this.data.order;
  readonly rows = signal<Row[]>(this.order.lines.map((line) => ({ line, outstanding: Math.max(0, Math.round((line.quantity - line.accepted - line.rejected - line.cancelled) * 1000) / 1000), delivered: 0, accepted: 0, rejected: 0, reason: '' })).filter((r) => r.outstanding > 0 || true));
  readonly columns = ['item', 'ordered', 'received', 'outstanding', 'delivered', 'accepted', 'rejected'];
  readonly deliveryRef = signal('');
  readonly notes = signal('');
  readonly overReason = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  readonly entered = computed(() => this.rows().filter((r) => num(r.delivered) > 0));
  readonly over = computed(() => this.entered().some((r) => num(r.accepted) + num(r.rejected) > r.outstanding + 1e-9));
  readonly problems = computed(() => {
    const p: string[] = [];
    for (const r of this.rows()) {
      const [d, a, x] = [num(r.delivered), num(r.accepted), num(r.rejected)];
      if (d < 0 || a < 0 || x < 0) p.push($localize`For ${r.line.name}, quantities cannot be negative.`);
      else if (a + x > d + 1e-9) p.push($localize`For ${r.line.name}, accepted plus rejected is more than delivered.`);
      else if (x > 0 && !r.reason.trim()) p.push($localize`For ${r.line.name}, say why some were rejected.`);
    }
    if (this.over() && !this.data.canResolve) p.push($localize`You are not allowed to receive more than is outstanding.`);
    if (this.over() && this.data.canResolve && !this.overReason().trim()) p.push($localize`Say why more than the outstanding quantity is being received.`);
    return p;
  });
  readonly canSave = computed(() => this.entered().length > 0 && this.problems().length === 0 && !this.busy());
  readonly stockPreview = computed(() => this.entered().reduce((s, r) => s + num(r.accepted) * (r.line.packSize || 1), 0));

  set(i: number, patch: Partial<Row>) { this.rows.update((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r))); }
  setNum(i: number, field: 'delivered' | 'accepted' | 'rejected', value: unknown) {
    const n = value === '' || value === null ? 0 : Number(value);
    const patch: Partial<Row> = { [field]: Number.isFinite(n) ? n : 0 };
    // Typing what arrived is usually all there is to say, so accepted follows it until the person says otherwise.
    if (field === 'delivered') Object.assign(patch, { accepted: Math.max(0, (Number.isFinite(n) ? n : 0) - num(this.rows()[i].rejected)) });
    if (field === 'rejected') Object.assign(patch, { accepted: Math.max(0, num(this.rows()[i].delivered) - (Number.isFinite(n) ? n : 0)) });
    this.set(i, patch);
  }
  arrivedInFull() { this.rows.update((rs) => rs.map((r) => ({ ...r, delivered: r.outstanding, accepted: r.outstanding, rejected: 0, reason: '' }))); }

  save() {
    this.busy.set(true);
    this.error.set('');
    this.api.receive(this.data.storeId, this.order._id, {
      idempotencyKey: this.key,
      deliveryRef: this.deliveryRef().trim() || undefined,
      notes: this.notes().trim() || undefined,
      overReceiveReason: this.over() ? this.overReason().trim() : undefined,
      lines: this.entered().map((r) => ({ lineId: r.line.lineId, delivered: num(r.delivered), accepted: num(r.accepted), rejected: num(r.rejected), reason: r.reason.trim() || undefined })),
    }).subscribe({
      next: (receipt) => this.ref.close(receipt),
      error: (e) => { this.error.set(message(e)); this.busy.set(false); },
    });
  }
}
