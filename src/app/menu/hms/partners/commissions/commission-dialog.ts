import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Commission, PartnerCommissionService, COMMISSION_STATUS_TONES, commissionStatusLabel, ruleSummary } from '../../../../shared/services/partner-commission.service';
import { rxResource } from '@angular/core/rxjs-interop';

export interface CommissionDialogData {
  storeId: string;
  id: string;
  currency: string;
  canApprove: boolean;
  canPay: boolean;
}

const EVENT_LABELS: Record<string, () => string> = {
  estimated: () => $localize`Estimated when the booking was made`,
  pending_review: () => $localize`Stay completed, ready for review`,
  approved: () => $localize`Approved`,
  void: () => $localize`Voided`,
  payment_recorded: () => $localize`Payment recorded`,
  review_needed: () => $localize`The stay changed after approval`,
  review_cleared: () => $localize`The stay is back to what was approved`,
  review_accepted: () => $localize`Change accepted`,
  review_dismissed: () => $localize`Change dismissed, approved amount kept`,
};
const REVIEW_TEXT: Record<string, () => string> = {
  cancelled: () => $localize`The stay was cancelled or became a no-show after this commission was approved.`,
  stay_changed: () => $localize`The stay was changed after this commission was approved, so the amount would now be different.`,
  terms_removed: () => $localize`The agreement was taken off this reservation after the commission was approved.`,
};
const METHODS = [
  { value: 'bank_transfer', label: () => $localize`Bank transfer` },
  { value: 'cash', label: () => $localize`Cash` },
  { value: 'cheque', label: () => $localize`Cheque` },
  { value: 'card', label: () => $localize`Card` },
  { value: 'mobile_money', label: () => $localize`Mobile money` },
  { value: 'other', label: () => $localize`Other` },
];

/**
 * One commission: the stay it comes from, the rule, what is owed and paid, and what can be done about it. Every action asks the
 * server, which moves the record by compare-and-set, then shows what is true now. Recording a payment says that a settlement
 * happened; it does not send money anywhere.
 */
@Component({
  selector: 'app-commission-dialog',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!flex !items-center !gap-2">
      <ng-container i18n>Commission</ng-container>
      @if (c(); as c) { <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(c.status)">{{ statusText(c.status) }}</span> }
    </h2>
    <mat-dialog-content class="!pt-1">
      @if (!c()) { <mat-progress-bar mode="indeterminate" /> }
      @if (c(); as c) {
        <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div><div class="text-xs uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Partner</ng-container></div><div class="font-medium">{{ c.partner.name }}</div></div>
          <div><div class="text-xs uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Reservation</ng-container></div><div class="font-medium">{{ c.reservation.confirmationNumber }}</div></div>
          <div><div class="text-xs uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Guest</ng-container></div><div class="font-medium">{{ c.reservation.guest || '—' }}</div></div>
          <div><div class="text-xs uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Stay</ng-container></div><div class="font-medium">{{ c.reservation.checkInDate | date: 'd MMM' }} – {{ c.reservation.checkOutDate | date: 'd MMM y' }}</div></div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-surface-container p-4 sm:grid-cols-4">
          <div><div class="text-xs text-on-surface-variant"><ng-container i18n>Room revenue</ng-container></div><div class="text-sm tabular-nums">{{ c.basis?.revenue | currency: cur(c) : 'symbol' : '1.0-2' }}</div><div class="text-xs text-on-surface-variant">{{ rule(c) }}</div></div>
          <div><div class="text-xs text-on-surface-variant"><ng-container i18n>Commission</ng-container></div><div class="text-lg font-semibold tabular-nums">{{ c.amount | currency: cur(c) : 'symbol' : '1.0-2' }}</div></div>
          <div><div class="text-xs text-on-surface-variant"><ng-container i18n>Paid</ng-container></div><div class="text-sm tabular-nums">{{ c.paidAmount | currency: cur(c) : 'symbol' : '1.0-2' }}</div></div>
          <div><div class="text-xs text-on-surface-variant"><ng-container i18n>Still owed</ng-container></div><div class="text-sm font-semibold tabular-nums">{{ c.outstanding | currency: cur(c) : 'symbol' : '1.0-2' }}</div></div>
        </div>
        <p class="m-0 mt-2 text-xs text-on-surface-variant"><ng-container i18n>Worked out on room revenue after discounts and before taxes and fees, from the terms the booking was made under.</ng-container>@if (c.basis?.source === 'quote') { <ng-container i18n> The stay is not complete yet, so this is an estimate.</ng-container> }</p>

        @if (c.status === 'estimated') {
          <p class="m-0 mt-3 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900" i18n>This commission is an estimate. It can be approved once the guest has checked out; then you can record what you pay the partner.</p>
        }
        @if (c.review; as r) {
          <div class="mt-3 flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900" role="alert">
            <p class="m-0 flex items-start gap-2 text-sm"><mat-icon class="!h-5 !w-5 !text-xl !leading-none">rule</mat-icon><span>{{ reviewText(r.reason) }} <strong><ng-container i18n>It would now be</ng-container> {{ r.newAmount | currency: cur(c) : 'symbol' : '1.0-2' }}</strong> ({{ r.delta | currency: cur(c) : 'symbol' : '1.0-2' }}). <ng-container i18n>Nothing has been changed on its own.</ng-container></span></p>
            @if (data.canApprove) {
              <div class="flex flex-wrap gap-2">
                <button matButton="filled" type="button" [disabled]="busy()" (click)="decide('accept')"><ng-container i18n>Accept the new amount</ng-container></button>
                <button matButton="outlined" type="button" [disabled]="busy()" (click)="decide('dismiss')"><ng-container i18n>Keep the approved amount</ng-container></button>
              </div>
            }
          </div>
        }

        @if ((c.payments?.length ?? 0) > 0) {
          <h3 class="m-0 mb-1 mt-4 text-sm font-semibold"><ng-container i18n>Payments</ng-container></h3>
          <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            @for (p of c.payments; track p.idempotencyKey) {
              <li class="flex flex-wrap justify-between gap-2 rounded-xl bg-surface-container px-3 py-2"><span>{{ p.date | date: 'd MMM y' }} · {{ methodLabel(p.method) }}@if (p.reference) { · {{ p.reference }} }</span><span class="font-medium tabular-nums">{{ p.amount | currency: cur(c) : 'symbol' : '1.0-2' }}</span></li>
            }
          </ul>
        }

        @if (paying() && data.canPay) {
          <form [formGroup]="payForm" class="mt-4 grid grid-cols-1 gap-x-3 sm:grid-cols-2" (ngSubmit)="submitPayment()" id="pay-form">
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>Amount settled</ng-container></mat-label>
              <input matInput type="number" min="0" step="0.01" formControlName="amount" inputmode="decimal" />
              <mat-hint><ng-container i18n>Up to what is still owed</ng-container></mat-hint>
              @if (payForm.controls.amount.touched && payForm.controls.amount.invalid) { <mat-error><ng-container i18n>Enter an amount above 0.</ng-container></mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>How</ng-container></mat-label>
              <mat-select formControlName="method">@for (m of methods; track m.value) { <mat-option [value]="m.value">{{ m.label() }}</mat-option> }</mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>Reference</ng-container></mat-label>
              <input matInput formControlName="reference" autocomplete="off" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>Date</ng-container></mat-label>
              <input matInput type="date" formControlName="date" />
            </mat-form-field>
          </form>
        }

        <h3 class="m-0 mb-1 mt-4 text-sm font-semibold"><ng-container i18n>History</ng-container></h3>
        <ol class="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
          @for (e of events(); track $index) {
            <li class="flex flex-col"><span class="font-medium">{{ eventLabel(e.type) }}@if (e.byType === 'system') { <span class="font-normal text-on-surface-variant"> · <ng-container i18n>automatic</ng-container></span> }</span><span class="text-xs text-on-surface-variant">{{ e.at | date: 'd MMM y, HH:mm' }}@if (e.note) { · {{ e.note }} }</span></li>
          }
        </ol>

        @if (voiding()) {
          <mat-form-field appearance="outline" class="mt-4 w-full">
            <mat-label><ng-container i18n>Why is this being voided?</ng-container></mat-label>
            <input matInput [value]="voidReason()" (input)="voidReason.set($any($event.target).value)" autocomplete="off" />
          </mat-form-field>
        }
        @if (error()) { <p class="m-0 mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 !text-xl !leading-none text-red-600">error</mat-icon>{{ error() }}</p> }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!flex-wrap !gap-1 !px-6 !pb-4">
      <button matButton mat-dialog-close>@if (changed()) { <ng-container i18n>Done</ng-container> } @else { <ng-container i18n>Close</ng-container> }</button>
      @if (c(); as c) {
        @if (data.canApprove && (c.status === 'estimated' || c.status === 'pending_review' || (c.status === 'approved' && c.paidAmount === 0))) {
          @if (voiding()) { <button matButton type="button" [disabled]="busy()" (click)="confirmVoid()"><ng-container i18n>Confirm void</ng-container></button> }
          @else { <button matButton type="button" [disabled]="busy()" (click)="voiding.set(true)"><ng-container i18n>Void</ng-container></button> }
        }
        @if (data.canApprove) { <button matButton type="button" [disabled]="busy()" (click)="recalc()"><mat-icon>refresh</mat-icon><ng-container i18n>Recalculate</ng-container></button> }
        @if (data.canApprove && c.status === 'pending_review') { <button matButton="filled" type="button" [disabled]="busy()" (click)="approve()"><ng-container i18n>Approve</ng-container></button> }
        @if (data.canPay && c.status === 'approved') {
          @if (paying()) { <button matButton="filled" type="submit" form="pay-form" [disabled]="busy()"><ng-container i18n>Record payment</ng-container></button> }
          @else { <button matButton="filled" type="button" (click)="startPayment(c)"><ng-container i18n>Record a payment</ng-container></button> }
        }
      }
    </mat-dialog-actions>
  `,
})
export class CommissionDialogComponent {
  private readonly api = inject(PartnerCommissionService);
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject<MatDialogRef<CommissionDialogComponent, boolean>>(MatDialogRef);
  private readonly currencyPipe = new CurrencyPipe(inject(LOCALE_ID));
  readonly data = inject<CommissionDialogData>(MAT_DIALOG_DATA);

  private readonly reload = signal(0);
  private readonly res = rxResource({ params: () => ({ n: this.reload() }), stream: () => this.api.get(this.data.storeId, this.data.id) });
  readonly c = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly events = computed(() => [...(this.c()?.events ?? [])].reverse());
  readonly busy = signal(false);
  readonly error = signal('');
  readonly changed = signal(false);
  readonly paying = signal(false);
  readonly voiding = signal(false);
  readonly voidReason = signal('');
  readonly methods = METHODS;
  /** One key per recording attempt, so a double click or a retry records one settlement. */
  private paymentKey = '';

  readonly payForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: ['bank_transfer'],
    reference: [''],
    date: [new Date().toISOString().slice(0, 10)],
  });

  tone = (s: string) => COMMISSION_STATUS_TONES[s] ?? 'bg-gray-100 text-gray-700';
  statusText = commissionStatusLabel;
  eventLabel = (t: string) => EVENT_LABELS[t]?.() ?? t;
  reviewText = (r?: string) => (r ? REVIEW_TEXT[r]?.() ?? '' : '');
  methodLabel = (m?: string) => METHODS.find((x) => x.value === m)?.label() ?? m ?? '';
  cur = (c: Commission) => c.currency || this.data.currency;
  rule = (c: Commission) => ruleSummary(c.rule, (n) => this.currencyPipe.transform(n, this.cur(c), 'symbol', '1.0-2') ?? String(n));

  private run(call: ReturnType<typeof this.api.approve>, done?: () => void) {
    this.busy.set(true);
    this.error.set('');
    call.subscribe({
      next: () => { this.busy.set(false); this.changed.set(true); this.reload.update((n) => n + 1); done?.(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? $localize`That did not go through. Try again.`); this.reload.update((n) => n + 1); },
    });
  }

  approve() { this.run(this.api.approve(this.data.storeId, this.data.id)); }
  recalc() { this.run(this.api.recalculate(this.data.storeId, this.data.id)); }
  decide(action: 'accept' | 'dismiss') { this.run(this.api.resolveReview(this.data.storeId, this.data.id, action)); }
  confirmVoid() {
    if (this.voidReason().trim().length < 5) { this.error.set($localize`Say why this commission is being voided (at least a few words).`); return; }
    this.run(this.api.voidIt(this.data.storeId, this.data.id, this.voidReason().trim()), () => { this.voiding.set(false); this.voidReason.set(''); });
  }
  startPayment(c: Commission) {
    this.paymentKey = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
    this.payForm.patchValue({ amount: c.outstanding });
    this.paying.set(true);
  }
  submitPayment() {
    this.payForm.markAllAsTouched();
    if (this.payForm.invalid || this.busy()) return;
    const v = this.payForm.getRawValue();
    this.run(this.api.pay(this.data.storeId, this.data.id, { amount: Number(v.amount), method: v.method, reference: v.reference.trim() || undefined, date: v.date, idempotencyKey: this.paymentKey }), () => this.paying.set(false));
  }
}
