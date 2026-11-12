import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRefundRequest, Refund, Refundable } from '../models/refund.model';
import { Order } from '../models/order.model';
import { OfflineStore } from '../offline/offline-store.service';
import { cachedFetch } from '../offline/cached-fetch';
import { buildLocalRefundable } from '../offline/refund-offline';
import { RolesService } from './roles.service';
import { StoreStore } from '../stores/store.store';
import { FiscalisationService } from './fiscalisation.service';

@Injectable({ providedIn: 'root' })
export class RefundService {
  private http = inject(HttpClient);
  private offline = inject(OfflineStore);
  private roles = inject(RolesService);
  private storeStore = inject(StoreStore);
  private fiscalisation = inject(FiscalisationService);
  private base = environment.apiUrl;

  /** What can still be refunded on this sale, and whether the signed-in person may do it alone. */
  public refundable(orderId: string): Observable<Refundable> {
    return this.http.get<Refundable>(`${this.base}/orders/${orderId}/refundable`);
  }

  /**
   * The refund screen's data with no connection, from the copy of the sale kept on this device. Null when this device has never
   * seen the sale (it must be opened once while online).
   */
  public async refundableOffline(orderId: string): Promise<Refundable | null> {
    const order = (await this.offline.getReference<any>(`order:${orderId}`))?.value;
    if (!order?._id) return null;
    const refunds = (await this.offline.getReference<Refund[]>(`order-refunds:${orderId}`))?.value ?? [];
    return buildLocalRefundable({
      order,
      refunds,
      pending: this.offline.refundsFor(orderId),
      // Same people the server lets refund alone: the owner/admin, or a role that carries a refund permission.
      mayRefund: this.roles.isAdmin() || this.roles.hasAny(['pos.sales.refund', 'erp.orders.refund']),
      approvalLimit: this.storeStore.selectedStore()?.posSettings?.refundApprovalLimit ?? null,
      noteRequiredForOther: this.fiscalisation.active(),
    });
  }

  public create(orderId: string, body: CreateRefundRequest): Observable<{ refund: Refund; replayed: boolean }> {
    return this.http.post<{ refund: Refund; replayed: boolean }>(`${this.base}/orders/${orderId}/refunds`, body);
  }

  public listForOrder(orderId: string): Observable<Refund[]> {
    return cachedFetch(this.offline, `order-refunds:${orderId}`, this.http.get<Refund[]>(`${this.base}/orders/${orderId}/refunds`));
  }

  public listForStore(
    storeId: string,
    opts: { from?: string; to?: string; page?: number; limit?: number; employee?: string } = {},
  ): Observable<{ data: Refund[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(opts)) if (v !== undefined && v !== null) params = params.set(k, String(v));
    return cachedFetch(
      this.offline,
      `store-refunds:${storeId}:${params.toString()}`,
      this.http.get<{ data: Refund[]; total: number; page: number; limit: number }>(`${this.base}/refunds/store/${storeId}`, { params }),
    );
  }

  /** Cancels an order that has not been paid. A paid order is refunded instead. */
  public voidOrder(orderId: string, body: { reason: string; approverPin?: string }): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${orderId}/void`, body);
  }
}
