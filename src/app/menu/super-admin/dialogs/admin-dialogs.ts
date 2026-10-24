import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BillingPlan } from '../../../shared/models/platform-billing.model';
import { TrPipe } from '../../../shared/i18n/tr.pipe';

/** Asks for a reason before something that locks a store or writes money off. The reason goes into the audit log. */
@Component({
  selector: 'app-reason-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="mt-0 text-sm text-on-surface-variant">{{ data.message }}</p>
      <mat-form-field appearance="outline" class="w-full"><mat-label i18n>Reason</mat-label><textarea matInput rows="3" maxlength="500" [ngModel]="reason()" (ngModelChange)="reason.set($event)" data-testid="reason"></textarea></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close i18n>Cancel</button>
      <button mat-flat-button [color]="data.warn ? 'warn' : 'primary'" [disabled]="data.requireReason && reason().trim().length < 3" (click)="ref.close(reason().trim() || true)" data-testid="reason-confirm">{{ data.confirm }}</button>
    </mat-dialog-actions>
  `,
})
export class ReasonDialogComponent {
  readonly data = inject<{ title: string; message: string; confirm: string; warn?: boolean; requireReason?: boolean }>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ReasonDialogComponent>);
  readonly reason = signal('');
}

/** Records a bank transfer or cash payment against an invoice. Replaces the old browser prompt. */
@Component({
  selector: 'app-record-payment-dialog',
  imports: [CurrencyPipe, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title i18n>Record a payment</h2>
    <mat-dialog-content>
      <p class="mt-0 text-sm text-on-surface-variant"><span i18n>Invoice</span> <b>{{ data.number }}</b> · <span i18n>amount due</span> <b>{{ data.amountDue | currency: data.currency }}</b></p>
      <div class="grid gap-x-3 sm:grid-cols-2">
        <mat-form-field appearance="outline"><mat-label i18n>Method</mat-label>
          <mat-select [ngModel]="method()" (ngModelChange)="method.set($event)" data-testid="pay-method"><mat-option value="bank_transfer" i18n>Bank transfer</mat-option><mat-option value="cash" i18n>Cash</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label i18n>Amount received</mat-label><input matInput type="number" min="0.01" step="0.01" [ngModel]="amount()" (ngModelChange)="amount.set(+$event)" data-testid="pay-amount" /></mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="w-full"><mat-label i18n>Transfer or receipt number</mat-label><input matInput maxlength="120" [ngModel]="reference()" (ngModelChange)="reference.set($event)" data-testid="pay-reference" /></mat-form-field>
      <mat-form-field appearance="outline" class="w-full"><mat-label i18n>Note (optional)</mat-label><textarea matInput rows="2" maxlength="500" [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea></mat-form-field>
      @if (data.canExtend) {
        <mat-form-field appearance="outline" class="w-full"><mat-label i18n>Months of access this buys</mat-label>
          <mat-select [ngModel]="months()" (ngModelChange)="months.set($event)"><mat-option [value]="null" i18n>As the invoice says</mat-option>@for (m of [1, 2, 3, 6, 12]; track m) { <mat-option [value]="m">{{ m }}</mat-option> }</mat-select></mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close i18n>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!(amount() > 0)" (click)="submit()" data-testid="pay-confirm" i18n>Record payment</button>
    </mat-dialog-actions>
  `,
})
export class RecordPaymentDialogComponent {
  readonly data = inject<{ number: string; amountDue: number; currency: string; canExtend: boolean }>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<RecordPaymentDialogComponent>);
  readonly method = signal<'bank_transfer' | 'cash'>('bank_transfer');
  readonly amount = signal(this.data.amountDue);
  readonly reference = signal('');
  readonly notes = signal('');
  readonly months = signal<number | null>(null);
  submit(): void {
    this.ref.close({ providerKey: this.method(), amount: this.amount(), reference: this.reference().trim() || undefined, notes: this.notes().trim() || undefined, extendMonths: this.months() ?? undefined });
  }
}

/** Create or edit a plan. The key is fixed once a plan exists. */
@Component({
  selector: 'app-plan-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, TrPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ data ? ('Edit plan' | tr) : ('New plan' | tr) }}</h2>
    <mat-dialog-content>
      <div class="grid gap-x-3 sm:grid-cols-2">
        <mat-form-field appearance="outline"><mat-label i18n>Key</mat-label><input matInput [disabled]="!!data" [ngModel]="f().key" (ngModelChange)="set('key', $event)" placeholder="growth" data-testid="plan-key" /><mat-hint i18n>Lowercase letters, digits, dashes</mat-hint></mat-form-field>
        <mat-form-field appearance="outline"><mat-label i18n>Name</mat-label><input matInput [ngModel]="f().name" (ngModelChange)="set('name', $event)" data-testid="plan-name" /></mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="w-full"><mat-label i18n>Description</mat-label><input matInput [ngModel]="f().description" (ngModelChange)="set('description', $event)" /></mat-form-field>
      <div class="grid gap-x-3 sm:grid-cols-2">
        <mat-form-field appearance="outline"><mat-label i18n>Fewest seats</mat-label><input matInput type="number" min="1" [ngModel]="f().minSeats" (ngModelChange)="set('minSeats', +$event)" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label i18n>Most seats (empty = unlimited)</mat-label><input matInput type="number" min="1" [ngModel]="f().maxSeats" (ngModelChange)="set('maxSeats', $event === '' || $event === null ? null : +$event)" data-testid="plan-max" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label i18n>Monthly price (USD)</mat-label><input matInput type="number" min="0" step="0.01" [ngModel]="f().monthlyPrice" (ngModelChange)="set('monthlyPrice', $event === '' || $event === null ? null : +$event)" data-testid="plan-monthly" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label i18n>Yearly price (USD)</mat-label><input matInput type="number" min="0" step="0.01" [ngModel]="f().yearlyPrice" (ngModelChange)="set('yearlyPrice', $event === '' || $event === null ? null : +$event)" /></mat-form-field>
      </div>
      <mat-slide-toggle [ngModel]="f().contactUsOnly" (ngModelChange)="set('contactUsOnly', $event)" i18n>Priced per store (customers must ask for it)</mat-slide-toggle>
      <p class="mb-0 mt-3 text-xs text-on-surface-variant" i18n>Changing a plan affects new subscriptions only. Stores already on it keep the price they were given.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close i18n>Cancel</button><button mat-flat-button color="primary" [disabled]="!valid()" (click)="save()" data-testid="plan-save" i18n>Save</button></mat-dialog-actions>
  `,
})
export class PlanDialogComponent {
  readonly data = inject<BillingPlan | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PlanDialogComponent>);
  readonly f = signal<Partial<BillingPlan>>({ key: '', name: '', description: '', minSeats: 1, maxSeats: null, monthlyPrice: null, yearlyPrice: null, contactUsOnly: false, ...(this.data ?? {}) });
  readonly valid = computed(() => !!this.f().name && /^[a-z0-9][a-z0-9-]{1,30}$/.test(this.f().key ?? '') && (this.f().contactUsOnly || this.f().monthlyPrice != null));
  set<K extends keyof BillingPlan>(key: K, value: BillingPlan[K] | undefined): void {
    this.f.update((cur) => ({ ...cur, [key]: value }));
  }
  save(): void {
    const { _id, status, sortOrder, currency, features, ...rest } = this.f() as any;
    void _id; void status; void sortOrder; void currency; void features;
    this.ref.close(rest);
  }
}
