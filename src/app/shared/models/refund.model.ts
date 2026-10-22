export type RefundReasonCode =
  | 'CUSTOMER_CHANGED_MIND'
  | 'WRONG_ITEM'
  | 'QUALITY_ISSUE'
  | 'ORDER_MISTAKE'
  | 'DUPLICATE_CHARGE'
  | 'LONG_WAIT'
  | 'GOODWILL'
  | 'OTHER';

export type StockAction = 'RETURN' | 'WASTE' | 'NONE';

export interface RefundLine {
  lineId: string;
  productId?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  value: number;
  amount: number;
  stockAction: StockAction;
  stockRestored?: boolean;
}

export interface RefundTender {
  method: string;
  amount: number;
}

/** A refund ticket: its own document, linked to the original sale, which is never rewritten. */
export interface Refund {
  _id: string;
  refundNumber: string;
  order: string;
  store: string;
  orderReference?: string;
  kind: 'items' | 'amount';
  lines: RefundLine[];
  total: number;
  tenders: RefundTender[];
  reasonCode: RefundReasonCode;
  note?: string;
  createdBy?: string;
  approvedBy?: string;
  status: 'completed';
  createdAt: string;
}

export interface RefundableLine {
  lineId: string;
  productId?: string;
  name?: string;
  unitPrice: number;
  quantity: number;
  refundedQuantity: number;
  refundableQuantity: number;
}

export interface RefundableTender {
  method: string;
  paid: number;
  refunded: number;
  remaining: number;
}

/** What is still refundable on a sale, and whether the caller may refund without a second approver. */
export interface Refundable {
  orderId: string;
  reference?: string;
  paid: boolean;
  voided: boolean;
  total: number;
  refundedAmount: number;
  remainingAmount: number;
  lines: RefundableLine[];
  tenders: RefundableTender[];
  mayRefund: boolean;
  mayVoid: boolean;
  approvalLimit: number | null;
  reasons: RefundReasonCode[];
  /** The sale's tax-authority document, when the store reports sales. Null otherwise. */
  fiscal?: { originalInvoiceNumber: string | null; fiscalState: 'FISCALIZED' | 'NOT_YET_FISCALIZED' | 'NEEDS_ATTENTION'; detail: string } | null;
}

export interface CreateRefundRequest {
  lines?: { lineId: string; quantity: number; stockAction?: StockAction }[];
  amount?: number;
  reasonCode: RefundReasonCode;
  note?: string;
  tenders?: RefundTender[];
  approverPin?: string;
  idempotencyKey?: string;
}
