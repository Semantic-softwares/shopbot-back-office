import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import {
  OrderPayment,
  addPayment,
  amountPaidOf,
  changeDueOf,
  formatAmount,
  isCash,
  isSettled,
  maxEntryFor,
  money,
  parseAmountInput,
  paymentSummary,
  removePayment,
  remainingOf,
  sanitizeAmountInput,
  suggestedAmount,
} from './payment-split';

export interface PaymentDialogData {
  totalAmount: number;
  currency: string;
  /** When true (quick sales), payment can't be skipped — "Skip Payment" is hidden. */
  requirePayment?: boolean;
}

export interface PaymentDialogResult {
  action: 'confirm' | 'skip';
  /**
   * The primary method, kept for callers that still deal in a single string.
   * For a split this is 'Split'; `payments` carries the detail.
   */
  paymentMethod?: {
    name: string;
    id: string;
  };
  /** One row per tender taken. Empty on skip. */
  payments?: OrderPayment[];
  /** Sum of payments[].amount — what settles the bill, excluding change. */
  amountPaid?: number;
  /** Sum of payments[].change — what was handed back. */
  changeDue?: number;
  note?: string;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './payment-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './payment-dialog.component.scss',
})
export class PaymentDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  readonly data = inject<PaymentDialogData>(MAT_DIALOG_DATA);

  paymentMethods = [
    { id: 'POS', name: 'POS Terminal', icon: 'credit_card' },
    { id: 'Transfer', name: 'Transfer', icon: 'swap_horizontal_circle' },
    { id: 'Cash', name: 'Cash', icon: 'payments' }
  ];

  /** Tenders taken so far. A single-method sale is just a list of one. */
  readonly payments = signal<OrderPayment[]>([]);
  readonly selectedPaymentMethod = signal<string>('');
  /**
   * The amount field's raw text.
   *
   * Deliberately a string on a `type="text"` input, not a number on
   * `type="number"`. Angular's ngModel writes a *number* into the signal from
   * a number input, so anything doing string work on it — this used to call
   * .trim() — threw as soon as the cashier typed, while the pre-filled value
   * (a string) worked. That looked like "Add only works for the full amount".
   */
  readonly enteredAmount = signal<string>('');
  /** True while the field has focus, so it shows raw digits instead of a mask. */
  readonly amountFocused = signal(false);
  readonly note = signal<string>('');

  readonly total = computed(() => money(this.data.totalAmount || 0));
  readonly amountPaid = computed(() => amountPaidOf(this.payments()));
  readonly remaining = computed(() => remainingOf(this.total(), this.payments()));
  readonly changeDue = computed(() => changeDueOf(this.payments()));
  readonly settled = computed(() => isSettled(this.total(), this.payments()));

  /** True once more than one tender has been taken — drives the summary copy. */
  readonly isSplit = computed(() => this.payments().length > 1);

  private readonly selectedMethodName = computed(
    () => this.paymentMethods.find((m) => m.id === this.selectedPaymentMethod())?.name ?? '',
  );

  readonly selectedIsCash = computed(() => isCash(this.selectedMethodName()));

  /**
   * Cash is unbounded — the surplus is change. Every other method stops at the
   * balance, so a card payment can never exceed what is owed.
   */
  readonly maxForSelected = computed(() =>
    maxEntryFor(this.selectedMethodName(), this.total(), this.payments()),
  );

  /** The figure the Add button would record, or null if it isn't valid yet. */
  private readonly parsedAmount = computed(() => parseAmountInput(this.enteredAmount()));

  /**
   * What the amount field displays: raw digits while being typed into, and a
   * thousands-separated amount once it loses focus. Formatting only on blur
   * keeps the caret from jumping mid-entry, which is what makes live-masked
   * currency inputs unpleasant to type into.
   */
  readonly amountDisplay = computed(() => {
    const raw = String(this.enteredAmount() ?? '');
    if (this.amountFocused() || !raw.trim()) return raw;
    const value = this.parsedAmount();
    return value === null ? raw : formatAmount(value);
  });

  /** Strips anything that isn't part of a decimal amount as the cashier types. */
  onAmountInput(value: unknown): void {
    this.enteredAmount.set(sanitizeAmountInput(value));
  }

  onAmountFocus(): void {
    this.amountFocused.set(true);
  }

  onAmountBlur(): void {
    this.amountFocused.set(false);
  }

  readonly canAddPayment = computed(
    () => !!this.selectedMethodName() && this.parsedAmount() !== null && !this.settled(),
  );

  /** Live preview of the change this entry would produce, before it's added. */
  readonly pendingChange = computed(() => {
    const entered = this.parsedAmount();
    if (entered === null || !this.selectedIsCash()) return 0;
    return money(Math.max(0, entered - this.remaining()));
  });

  onPaymentMethodChange(methodId: string): void {
    this.selectedPaymentMethod.set(methodId);
    // Seed with what's still owed, so the ordinary single-payment sale stays
    // one tap and only an over-tender needs typing.
    this.enteredAmount.set(String(suggestedAmount(this.total(), this.payments())));
  }

  addSelectedPayment(): void {
    const entered = this.parsedAmount();
    const method = this.selectedMethodName();
    if (entered === null || !method) return;

    this.payments.set(addPayment(this.payments(), method, entered, this.total()));
    this.selectedPaymentMethod.set('');
    this.enteredAmount.set('');
  }

  removePaymentAt(index: number): void {
    this.payments.set(removePayment(this.payments(), index));
    this.selectedPaymentMethod.set('');
    this.enteredAmount.set('');
  }

  onConfirmPayment(): void {
    const payments = this.payments();
    const summary = paymentSummary(payments);
    // 'Split' is not one of the three methods, so fall back to its own name as
    // the id rather than looking one up that cannot exist.
    const match = this.paymentMethods.find((m) => m.name === summary);

    const result: PaymentDialogResult = {
      action: 'confirm',
      paymentMethod: summary ? { name: summary, id: match?.id ?? summary } : undefined,
      payments,
      amountPaid: this.amountPaid(),
      changeDue: this.changeDue(),
      note: this.note().trim()
    };
    this.dialogRef.close(result);
  }

  onSkipPayment(): void {
    const result: PaymentDialogResult = {
      action: 'skip',
      payments: [],
      amountPaid: 0,
      changeDue: 0,
      note: this.note().trim()
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
