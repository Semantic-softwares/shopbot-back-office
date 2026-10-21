import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'CLOSED';
export const PO_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED'];

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, () => string> = {
  DRAFT: () => $localize`Draft`,
  SENT: () => $localize`Sent`,
  CONFIRMED: () => $localize`Confirmed`,
  PARTIALLY_RECEIVED: () => $localize`Partly received`,
  RECEIVED: () => $localize`Received`,
  CANCELLED: () => $localize`Cancelled`,
  CLOSED: () => $localize`Closed`,
};
export const PO_STATUS_TONES: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-900',
  CONFIRMED: 'bg-indigo-100 text-indigo-900',
  PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-900',
  RECEIVED: 'bg-green-100 text-green-900',
  CANCELLED: 'bg-red-100 text-red-900',
  CLOSED: 'bg-gray-200 text-gray-800',
};

export interface PoLine {
  lineId: string;
  product: string;
  name: string;
  sku?: string;
  supplierSku?: string;
  purchaseUnit?: string;
  packSize: number;
  inventoryUnit?: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}
export interface PoEvent { type: string; at: string; actor?: string; note?: string }
export interface PoSend { to: string; at: string; version: number; ok: boolean; error?: string; resend?: boolean }
export interface PoInvoice { number: string; date?: string; amount?: number; note?: string; at: string }
export interface ReceiptLine { lineId: string; name: string; purchaseUnit?: string; packSize: number; delivered: number; accepted: number; rejected: number; reason?: string; stockQuantity: number }
export interface GoodsReceipt { _id: string; number: string; state: 'posting' | 'posted'; deliveryRef?: string; notes?: string; receivedAt: string; overReceive?: boolean; lines: ReceiptLine[] }

export interface PurchaseOrder {
  _id: string;
  number: string;
  supplier: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  currency?: string;
  expectedDate?: string;
  deliveryInstructions?: string;
  notes?: string;
  lines: PoLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  version: number;
  needsResend?: boolean;
  createdAt: string;
  sends: PoSend[];
  confirmation?: { reference?: string; expectedDate?: string; notes?: string; at: string };
  cancelReason?: string;
  invoices: PoInvoice[];
  events: PoEvent[];
  lineCount?: number;
  orderedQty?: number;
  acceptedQty?: number;
  outstandingQty?: number;
  receipts?: GoodsReceipt[];
}

export interface Suggestion {
  product: string;
  name: string;
  sku?: string;
  inventoryUnit?: string;
  qty: number;
  criticalStockLevel: number;
  reorderTarget: number;
  incoming: number;
  suggestedQty: number;
  supplier: string | null;
  supplierName: string | null;
  supplierOptions: { supplier: string; name: string; preferred: boolean }[];
  purchaseUnit?: string;
  packSize: number;
  unitCost: number;
  needsSupplier: boolean;
}

export interface ProductSupplierLink {
  _id: string;
  product: any;
  supplier: any;
  supplierSku?: string;
  defaultCost?: number;
  purchaseUnit?: string;
  packSize?: number;
  minOrderQty?: number;
  leadTimeDays?: number;
  notes?: string;
  preferred?: boolean;
}

export interface OutstandingSummary {
  draft: { count: number; total: number };
  sent: { count: number; total: number };
  confirmed: { count: number; total: number };
  partiallyReceived: { count: number; total: number };
  lines: { supplier: string; supplierName: string; product: string; name: string; unit?: string; sentQty: number; confirmedQty: number; partialQty: number; orders: string[] }[];
}

export interface PoDraftBody {
  supplier?: string;
  lines?: { product: string; quantity: number; unitCost?: number }[];
  expectedDate?: string | null;
  deliveryInstructions?: string;
  notes?: string;
  discount?: number;
  shipping?: number;
  tax?: number;
  reason?: string;
}
export interface ReceiveBody {
  idempotencyKey: string;
  deliveryRef?: string;
  notes?: string;
  overReceiveReason?: string;
  lines: { lineId: string; delivered: number; accepted: number; rejected: number; reason?: string }[];
}

/** Purchasing: purchase orders, supplier emails, goods receiving. The server owns every total and quantity; this only asks. */
@Injectable({ providedIn: 'root' })
export class PurchasingService {
  private readonly http = inject(HttpClient);
  private readonly base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/purchasing`;

  private params(q: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '' && v !== 'all') p = p.set(k, String(v));
    return p;
  }

  list(storeId: string, q: Record<string, unknown> = {}): Observable<{ rows: PurchaseOrder[]; total: number; page: number; limit: number }> {
    return this.http.get<{ rows: PurchaseOrder[]; total: number; page: number; limit: number }>(`${this.base(storeId)}/purchase-orders`, { params: this.params(q) });
  }
  get(storeId: string, id: string) { return this.http.get<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}`); }
  create(storeId: string, body: PoDraftBody) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders`, body); }
  fromSuggestions(storeId: string, items: { product: string; quantity: number; supplier?: string; unitCost?: number }[]) {
    return this.http.post<{ orders: PurchaseOrder[] }>(`${this.base(storeId)}/purchase-orders/from-suggestions`, { items });
  }
  update(storeId: string, id: string, body: PoDraftBody) { return this.http.put<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}`, body); }
  amend(storeId: string, id: string, body: PoDraftBody) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}/amend`, body); }
  cancel(storeId: string, id: string, reason: string) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}/cancel`, { reason }); }
  close(storeId: string, id: string, reason: string) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}/close`, { reason }); }
  send(storeId: string, id: string, body: { recipient?: string; resend?: boolean }) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}/send`, body); }
  confirm(storeId: string, id: string, body: { reference?: string; expectedDate?: string; notes?: string }) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}/confirm`, body); }
  addInvoice(storeId: string, id: string, body: { number: string; date?: string; amount?: number; note?: string }) { return this.http.post<PurchaseOrder>(`${this.base(storeId)}/purchase-orders/${id}/invoices`, body); }
  receive(storeId: string, id: string, body: ReceiveBody) { return this.http.post<GoodsReceipt>(`${this.base(storeId)}/purchase-orders/${id}/receipts`, body); }
  resume(storeId: string, receiptId: string) { return this.http.post<GoodsReceipt>(`${this.base(storeId)}/receipts/${receiptId}/resume`, {}); }
  pdf(storeId: string, id: string) { return this.http.get(`${this.base(storeId)}/purchase-orders/${id}/pdf`, { responseType: 'blob' }); }

  suggestions(storeId: string) { return this.http.get<{ rows: Suggestion[] }>(`${this.base(storeId)}/suggestions`); }
  outstanding(storeId: string) { return this.http.get<OutstandingSummary>(`${this.base(storeId)}/outstanding`); }

  links(storeId: string, q: { product?: string; supplier?: string } = {}) { return this.http.get<ProductSupplierLink[]>(`${this.base(storeId)}/product-suppliers`, { params: this.params(q) }); }
  saveLink(storeId: string, body: Record<string, unknown>) { return this.http.put<ProductSupplierLink>(`${this.base(storeId)}/product-suppliers`, body); }
  removeLink(storeId: string, id: string) { return this.http.delete(`${this.base(storeId)}/product-suppliers/${id}`); }
}
