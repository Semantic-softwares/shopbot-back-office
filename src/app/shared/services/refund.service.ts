import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRefundRequest, Refund, Refundable } from '../models/refund.model';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class RefundService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /** What can still be refunded on this sale, and whether the signed-in person may do it alone. */
  public refundable(orderId: string): Observable<Refundable> {
    return this.http.get<Refundable>(`${this.base}/orders/${orderId}/refundable`);
  }

  public create(orderId: string, body: CreateRefundRequest): Observable<{ refund: Refund; replayed: boolean }> {
    return this.http.post<{ refund: Refund; replayed: boolean }>(`${this.base}/orders/${orderId}/refunds`, body);
  }

  public listForOrder(orderId: string): Observable<Refund[]> {
    return this.http.get<Refund[]>(`${this.base}/orders/${orderId}/refunds`);
  }

  public listForStore(
    storeId: string,
    opts: { from?: string; to?: string; page?: number; limit?: number } = {},
  ): Observable<{ data: Refund[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(opts)) if (v !== undefined && v !== null) params = params.set(k, String(v));
    return this.http.get<{ data: Refund[]; total: number; page: number; limit: number }>(
      `${this.base}/refunds/store/${storeId}`,
      { params },
    );
  }

  /** Cancels an order that has not been paid. A paid order is refunded instead. */
  public voidOrder(orderId: string, body: { reason: string; approverPin?: string }): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${orderId}/void`, body);
  }
}
