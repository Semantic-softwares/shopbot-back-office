import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OrderService {
  public http = inject(HttpClient);
  
  public getTopSellingProducts(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/top-products/selling?${params}`);
  }

  public getSalesSummary(storeId:string, queryParams: any): Observable<any> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any>(`${environment.apiUrl}/orders/store/${storeId}/sales/selling?${params}`);
  }

   public getSalesSummaryByDate(storeId:string, queryParams: any): Observable<any> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any>(`${environment.apiUrl}/orders/store/${storeId}/sales-summary-by-date/selling?${params}`);
  }

  public getTopSellingCategories(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/category/selling?${params}`);
  }

  public getSalesByEmployees(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/employee/selling?${params}`);
  }

  public getSalesByPaymentType(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/payment-type/selling?${params}`);
  }

   public getSalesReceipts(storeId:string, queryParams: any): Observable<any> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any>(`${environment.apiUrl}/orders/store/${storeId}/receipts/selling?${params}`);
  }

  public deleteOrder(orderId: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/orders/${orderId}`);
  }

  public getOrder(orderId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/orders/${orderId}`);
  }

  /** Claim a table's self-order as this staff member's — "open request, first to claim wins." */
  public claimOrder(orderId: string): Observable<{ success: boolean; order?: any; reason?: string; assignedTo?: string }> {
    return this.http.put<{ success: boolean; order?: any; reason?: string; assignedTo?: string }>(
      `${environment.apiUrl}/orders/${orderId}/claim`,
      {},
    );
  }

  /**
   * Move a table order to another table. Omit `items` to move the whole order;
   * pass them to move only those lines (partial quantities allowed).
   */
  public transferOrder(
    orderId: string,
    payload: TransferOrderPayload,
  ): Observable<TransferOrderResult> {
    return this.http.put<TransferOrderResult>(
      `${environment.apiUrl}/orders/${orderId}/transfer`,
      payload,
    );
  }

}

export interface TransferOrderPayload {
  toTableId: string;
  items?: { productId: string; quantity: number }[];
}

export interface TransferOrderResult {
  success: boolean;
  type?: 'full' | 'partial';
  order?: any;
  newOrder?: any;
  reason?: TransferFailureReason;
}

export type TransferFailureReason =
  | 'order_not_found'
  | 'table_not_found'
  | 'cross_store'
  | 'same_table'
  | 'already_paid'
  | 'order_closed'
  | 'empty_order'
  | 'not_your_table'
  | 'destination_occupied'
  | 'destination_locked'
  | 'invalid_items';

/**
 * Plain-language explanations for every refusal the backend can return, each
 * naming the way out where there is one. `{table}` is filled with the chosen
 * destination table's name.
 */
export const TRANSFER_FAILURE_MESSAGES: Record<TransferFailureReason, string> = {
  order_not_found: 'That order no longer exists — refresh the table list and try again.',
  table_not_found: 'That table is no longer available.',
  cross_store: 'You can only move an order between tables in the same store.',
  same_table: 'The order is already on that table.',
  already_paid: 'This order has been paid and can no longer be moved.',
  order_closed: 'This order is closed and can no longer be moved.',
  empty_order: 'There are no items on this order to move.',
  not_your_table: 'This table is being served by someone else — only they can move it.',
  destination_occupied: '{table} already has an open order. Move selected items instead, or complete that order first.',
  destination_locked: "{table}'s order is paid or closed, so items can't be added to it.",
  invalid_items: 'Some of the selected items are no longer on this order — reopen the transfer and try again.',
};

/** Resolves a failure reason to a display message, or a sane fallback. */
export function transferFailureMessage(reason: string | undefined, tableName: string): string {
  const template = TRANSFER_FAILURE_MESSAGES[reason as TransferFailureReason];
  return template
    ? template.replace('{table}', tableName)
    : 'Could not move this order — please try again.';
}
