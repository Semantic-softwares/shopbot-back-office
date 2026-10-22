/**
 * Country-neutral fiscalisation shapes. Whatever the tax authority is (MRA today), a screen only ever sees these:
 * the tag a document wears, its QR, and a row in the transaction report.
 */

/** What a document shows, separate from the authority's own detailed state. */
export type FiscalTag = 'FISCALIZED' | 'NOT_YET_FISCALIZED' | 'NEEDS_ATTENTION';

/** The exact words printed and shown for a document the authority has not confirmed yet. */
export const NOT_YET_FISCALIZED_TEXT = 'Not Yet Fiscalized';

export interface FiscalOrderView {
  orderId: string;
  documentType: 'INVOICE' | 'CREDIT_NOTE';
  tag: FiscalTag;
  /** The authority's own state in plain words, e.g. "Waiting to be sent". */
  detail: string;
  invoiceNumber?: string;
  counter?: number;
  /** Base64 PNG exactly as issued by the authority. */
  qrCodePng?: string;
  message?: string;
}

export interface FiscalTransactionQuery {
  from?: string;
  to?: string;
  type?: 'INVOICE' | 'CREDIT_NOTE';
  tag?: FiscalTag;
  page?: number;
  limit?: number;
}

export interface FiscalTransaction {
  counter: number | null;
  invoiceNumber: string;
  documentType: 'INVOICE' | 'CREDIT_NOTE';
  irn: string | null;
  previousInvoiceHash: string | null;
  tag: FiscalTag;
  detail: string;
  issuedAt: string | null;
  fiscalizedAt: string | null;
  total: number | null;
  currency: string | null;
  orderReference: string | null;
}

export interface FiscalTransactionPage {
  rows: FiscalTransaction[];
  total: number;
  page: number;
  limit: number;
}

/** What the sale's refund screen shows about the document a credit note will refer to. */
export interface RefundFiscalInfo {
  originalInvoiceNumber: string | null;
  fiscalState: FiscalTag;
  detail: string;
}
