import { inject, Injectable } from '@angular/core';
import { OfflineStore } from '../offline/offline-store.service';
import { cachedFetch } from '../offline/cached-fetch';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, StatusParams } from '../models';

export interface SyncResult { syncedOrders: Order[]; failed: { id: string; error: string }[] }

@Injectable({providedIn: 'root'})
export class OrdersService {
  orders!: any[];
  private hostServer: string = environment.apiUrl;

  private orders$ = new BehaviorSubject<any>(null);
  selectedOrders = this.orders$.asObservable();
  
  private offline = inject(OfflineStore);

  constructor(private _httpClient: HttpClient) {}

  getOrders(query: any): Observable<any[]> {
    const obj: any = query;
    const queryParams = JSON.stringify(obj);
    return this._httpClient.get<any[]>(
      `${this.hostServer}/orders?query=${queryParams}`
    );
  }

  getUserOrders(id:any): Observable<Order[]> {
    return this._httpClient.get<Order[]>(`${this.hostServer}/orders/user/${id}`);
  }

  getUserStoreOrders(userId:string, storeId:string): Observable<Order[]> {
    return this._httpClient.get<Order[]>(`${this.hostServer}/orders/user/${userId}/store/${storeId}`);
  }

  getOrder(id:any): Observable<Order> {
    return this._httpClient.get<Order>(`${this.hostServer}/orders/${id}`);
  }

  updateOrderStatus(statusParams: StatusParams) {
    return this._httpClient.put(`${this.hostServer}/orders/status/update`, statusParams);
  }


  updateOrder(orderId: string, status: any) {
    return this._httpClient.put(`${this.hostServer}/orders/${orderId}`, status);
  }

  updateOrderComprehensive(orderId: string, orderData: any) {
    return this._httpClient.put(`${this.hostServer}/orders/${orderId}/comprehensive`, orderData);
  }

  deleteOrder(orderId: string) {
    return this._httpClient.delete(`${this.hostServer}/orders/${orderId}`);
  }

  getStoreOrder(storeId: string, query:any, type:string): Observable<Order[]> {
    return this._httpClient.get<Order[]>(`${this.hostServer}/orders/store/${storeId}/merchants/orders?status=${query.status}&type=${type}&limit=${query.limit}&offset=${query.offset}`);
  }

  getStoreOrderCount(storeId: string): Observable<any> {
    return this._httpClient.get<any>(`${this.hostServer}/orders/store/${storeId}/merchants/orders/count`);
  }

  getStoreOrders(storeId: string, params: any = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.skip) queryParams.append('skip', params.skip.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.payment) queryParams.append('payment', params.payment);
    if (params.staff) queryParams.append('staff', params.staff);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.salesChannel) queryParams.append('salesChannel', params.salesChannel);
    
    // The last list seen stays readable with no connection.
    return cachedFetch(this.offline, `store-orders:${storeId}:${queryParams.toString()}`, this._httpClient.get<Order[]>(`${this.hostServer}/orders/store/${storeId}/orders?${queryParams.toString()}`));
  }

  /**
   * Sends orders to the server. The server answers `{ syncedOrders, failed }`: the orders it saved and the ones it could not.
   * (An older server answered with the saved orders only, so that shape is understood too.)
   */
  public syncOrdersDetailed(orders: Order[]): Observable<SyncResult> {
    return this._httpClient.post<any>(`${this.hostServer}/orders/sync`, { orders }).pipe(
      map((res) => ({
        syncedOrders: (Array.isArray(res) ? res : res?.syncedOrders ?? []) as Order[],
        failed: (Array.isArray(res?.failed) ? res.failed : []) as { id: string; error: string }[],
      })),
    );
  }

  public syncOrders(orders: Order[]): Observable<Order[]> {
    return this.syncOrdersDetailed(orders).pipe(map((r) => r.syncedOrders));
  }

  public createOrder(order: Partial<Order>): Observable<Order> {
    console.log(order, 'order');
    return this._httpClient.post<Order>(`${this.hostServer}/orders`, order);
  }

  broadcast(order:Order) {
    this.orders$.next(order); 
  }

  
}
