import { Refund, Refundable, RefundReasonCode } from '../models/refund.model';
import { RefundOutboxEntry } from './offline.models';

/**
 * The refund screen with no connection: the same figures the server's "what can still be refunded" answer holds, worked out from
 * the copy of the sale this device already has (opened once online, or warmed from the receipts list). It is a preview: the
 * server re-checks every line and amount when the refund arrives, and sets the real figures and the credit note then.
 */

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const REFUND_REASON_CODES: RefundReasonCode[] = ['CUSTOMER_CHANGED_MIND', 'WRONG_ITEM', 'QUALITY_ISSUE', 'ORDER_MISTAKE', 'DUPLICATE_CHARGE', 'LONG_WAIT', 'GOODWILL', 'OTHER'];

/** Same key the server tracks a cart line by: its own id, or the product id on lines saved before they had ids. */
export const lineKey = (line: any): string => String(line?._id ?? line?.productId ?? '');

const unitPriceOf = (line: any): number => {
  const options = (line?.options ?? []).reduce((sum: number, o: any) => sum + (Number(o.price) || 0) * (o.quantity === undefined || o.quantity === null ? 1 : Number(o.quantity)), 0);
  return money((Number(line?.price) || 0) + options);
};

const paidByMethod = (order: any): Record<string, number> => {
  const out: Record<string, number> = {};
  if (Array.isArray(order?.payments) && order.payments.length) {
    for (const p of order.payments) out[String(p.method)] = money((out[String(p.method)] || 0) + (Number(p.amount) || 0));
    return out;
  }
  out[String(order?.payment || 'Cash')] = money(Number(order?.amountPaid ?? order?.total) || 0);
  return out;
};

export interface LocalRefundableInput {
  order: any;
  /** The refund tickets already raised against the sale (the copy this device has, may be empty). */
  refunds: Refund[];
  /** Refunds made on this device that have not reached the server yet. */
  pending: RefundOutboxEntry[];
  mayRefund: boolean;
  approvalLimit: number | null;
  noteRequiredForOther: boolean;
}

export function buildLocalRefundable(input: LocalRefundableInput): Refundable {
  const { order, refunds, pending } = input;
  const serverQty: Record<string, number> = order?.refundedQty instanceof Map ? Object.fromEntries(order.refundedQty) : { ...(order?.refundedQty ?? {}) };
  const pendingQty: Record<string, number> = {};
  let pendingAmount = 0;
  for (const p of pending) {
    pendingAmount += p.estimate;
    for (const l of p.body.lines ?? []) pendingQty[l.lineId] = (pendingQty[l.lineId] || 0) + l.quantity;
  }

  const lines = (order?.cart?.products ?? []).map((l: any) => {
    const key = lineKey(l);
    const refunded = (serverQty[key] || 0) + (pendingQty[key] || 0);
    return {
      lineId: key,
      productId: l.productId,
      name: l.name,
      unitPrice: unitPriceOf(l),
      quantity: l.quantity,
      refundedQuantity: refunded,
      refundableQuantity: Math.max((Number(l.quantity) || 0) - refunded, 0),
    };
  });

  const refundedByMethod: Record<string, number> = {};
  for (const r of refunds) for (const t of r.tenders ?? []) refundedByMethod[t.method] = money((refundedByMethod[t.method] || 0) + t.amount);
  const paid = paidByMethod(order);

  const total = money(Number(order?.total) || 0);
  const refundedAmount = money((Number(order?.refundedAmount) || 0) + pendingAmount);
  return {
    orderId: String(order?._id),
    reference: order?.reference,
    paid: String(order?.paymentStatus).toLowerCase() === 'paid',
    voided: String(order?.category).toLowerCase() === 'cancel',
    total,
    refundedAmount,
    remainingAmount: money(total - refundedAmount),
    lines,
    tenders: Object.keys(paid).map((method) => ({ method, paid: paid[method], refunded: refundedByMethod[method] || 0, remaining: money(paid[method] - (refundedByMethod[method] || 0)) })),
    mayRefund: input.mayRefund,
    mayVoid: false,
    approvalLimit: input.approvalLimit,
    reasons: REFUND_REASON_CODES,
    noteRequiredForOther: input.noteRequiredForOther,
    fiscal: null,
  };
}
