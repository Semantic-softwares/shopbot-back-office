/**
 * Split-payment arithmetic, kept free of Angular and the DOM so it can be
 * reasoned about (and tested) on its own.
 *
 * Every figure here is a money amount in the store's currency. The three per
 * row are deliberately distinct and must not be conflated:
 *
 *   amount   what this tender settles against the bill
 *   tendered what the customer actually handed over
 *   change   tendered - amount, handed back
 *
 * Only cash can be over-tendered. You cannot hand back cash on a card swipe,
 * so every other method is capped at the outstanding balance.
 */

// Type-only, so this module still bundles on its own for testing — esbuild
// erases the import rather than pulling the whole model graph in.
import type { OrderPayment } from '../../models/order.model';
export type { OrderPayment };

/** The method that may be over-tendered. Matched case-insensitively. */
export const CASH_METHOD = 'Cash';

/**
 * Money arrives here as IEEE 754 doubles, where 1000 + 900.1 is 1900.0999...
 * Every comparison and total therefore rounds to whole cents; comparing with
 * === would leave the Confirm button stuck disabled on ordinary amounts.
 */
export function toCents(value: number): number {
  return Math.round((Number(value) || 0) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Rounds a money amount to whole cents. */
export function money(value: number): number {
  return fromCents(toCents(value));
}

/**
 * Parses whatever the amount field hands back into a money figure, or null if
 * it isn't a usable amount yet.
 *
 * Accepts a string *or* a number on purpose. Angular's ngModel payload type
 * follows the control: a `type="number"` input yields a number, a text input a
 * string. Assuming a string here previously threw `.trim is not a function`
 * the moment a cashier typed, which killed the computed driving the Add
 * button — so the field appeared to work only for the pre-filled amount.
 */
export function parseAmountInput(raw: unknown): number | null {
  const text = String(raw ?? '').replace(/,/g, '').trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? money(value) : null;
}

/** Strips anything that isn't part of a decimal amount, as the cashier types. */
export function sanitizeAmountInput(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1');
}

/** Thousands-separated display form, used while the field is not focused. */
export function formatAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isCash(method: string): boolean {
  return (method || '').trim().toLowerCase() === CASH_METHOD.toLowerCase();
}

/** What the payments settle against the bill — the sum of `amount`, never `tendered`. */
export function amountPaidOf(payments: readonly OrderPayment[]): number {
  return fromCents(payments.reduce((sum, p) => sum + toCents(p.amount), 0));
}

/** Total handed back across all rows. */
export function changeDueOf(payments: readonly OrderPayment[]): number {
  return fromCents(payments.reduce((sum, p) => sum + toCents(p.change), 0));
}

/** Still owed on the bill. Never negative — a surplus is change, not a balance. */
export function remainingOf(total: number, payments: readonly OrderPayment[]): number {
  const owed = toCents(total) - toCents(amountPaidOf(payments));
  return fromCents(Math.max(0, owed));
}

/** True once the payments cover the bill. Cent-exact, so floats can't jam it. */
export function isSettled(total: number, payments: readonly OrderPayment[]): boolean {
  return toCents(amountPaidOf(payments)) >= toCents(total) && toCents(total) > 0;
}

/**
 * The most a given method may be entered for.
 *
 * Cash is unbounded — the surplus becomes change. Everything else stops at the
 * outstanding balance, so a cashier can't record a 2000 card payment on a 1900
 * bill and take the difference out of the drawer.
 */
export function maxEntryFor(
  method: string,
  total: number,
  payments: readonly OrderPayment[],
): number | null {
  return isCash(method) ? null : remainingOf(total, payments);
}

/**
 * Builds one payment row, splitting the entered figure into what it settles
 * and what comes back as change.
 *
 * `entered` is what the customer handed over. For cash that may exceed the
 * balance; the excess is change. For other methods it is clamped to the
 * balance, which is also what the UI enforces — this is the backstop.
 *
 * Returns null when there is nothing left to pay or the figure is not a
 * positive amount, so callers can treat it as "not a valid row".
 */
export function buildPayment(
  method: string,
  entered: number,
  total: number,
  payments: readonly OrderPayment[],
): OrderPayment | null {
  const remaining = remainingOf(total, payments);
  const enteredCents = toCents(entered);
  if (!method || enteredCents <= 0 || toCents(remaining) <= 0) return null;

  const remainingCents = toCents(remaining);

  if (isCash(method)) {
    // Cash settles at most the balance; anything beyond it is change.
    const applied = Math.min(enteredCents, remainingCents);
    return {
      method,
      amount: fromCents(applied),
      tendered: fromCents(enteredCents),
      change: fromCents(enteredCents - applied),
    };
  }

  const applied = Math.min(enteredCents, remainingCents);
  return {
    method,
    amount: fromCents(applied),
    tendered: fromCents(applied),
    change: 0,
  };
}

/** Appends a row if it is valid, otherwise returns the list unchanged. */
export function addPayment(
  payments: readonly OrderPayment[],
  method: string,
  entered: number,
  total: number,
): OrderPayment[] {
  const row = buildPayment(method, entered, total, payments);
  return row ? [...payments, row] : [...payments];
}

export function removePayment(payments: readonly OrderPayment[], index: number): OrderPayment[] {
  return payments.filter((_, i) => i !== index);
}

/**
 * The value to seed the amount field with: whatever is still owed, so the
 * common single-payment case stays one tap.
 */
export function suggestedAmount(total: number, payments: readonly OrderPayment[]): number {
  return remainingOf(total, payments);
}

/**
 * The summary written to `order.payment`, which many display and filter paths
 * still read as a single string.
 */
export function paymentSummary(payments: readonly OrderPayment[]): string {
  if (!payments.length) return '';
  if (payments.length === 1) return payments[0].method;
  const distinct = new Set(payments.map((p) => p.method));
  return distinct.size === 1 ? payments[0].method : 'Split';
}
