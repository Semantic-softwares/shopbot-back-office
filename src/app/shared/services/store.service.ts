import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeliveryZone, Store } from '../models';
import { SessionStorageService } from './session-storage.service';



@Injectable({providedIn: 'root'})

export class StoreService {
  private hostServer: string = environment.apiUrl;
  private _httpClient = inject(HttpClient);
  private sessionStorageService = inject(SessionStorageService);

  createStore(admin: any): Observable<Store> {
    return this._httpClient.post<Store>(`${this.hostServer}/stores/web`, admin);
  }

  getStoreCategories(): Observable<any[]> {
    return this._httpClient.get<any[]>(`${this.hostServer}/categories`);
  }

  deliveryZones(): Observable<any[]> {
    return this._httpClient.get<any[]>(`${this.hostServer}/delivery-zones`);
  }

  

  getMerchantStore(merchantId: string): Observable<Store> {
    return this._httpClient.get<Store>(
      `${this.hostServer}/stores/merchant/${merchantId}`
    );
  }

  getMerchantStores(merchantId: string): Observable<Store[]> {
    return this._httpClient.get<Store[]>(
      `${this.hostServer}/stores/${merchantId}/vendors`
    );
  }

  updateStore(id: string, params: any): Observable<Store> {
    return this._httpClient.put<Store>(
      `${this.hostServer}/stores/${id}`,
      params
    )
  }


  get getStoreLocally() {
   return this.sessionStorageService.getStore();
  }

  get getStoresLocally() {
   return this.sessionStorageService.getStores();
  }

   public saveStoresLocally(stores: Store[]): void {
    this.sessionStorageService.setStores(stores);
  }

  public saveStoreLocally(store: Store) {
    this.sessionStorageService.setStore(store);
  }

  public deleteStoreLocally() {
    this.sessionStorageService.removeStore();
  }

  public getStore(storeId:string): Observable<Store> {
    return this._httpClient.get<Store>(`${this.hostServer}/stores/${storeId}`)
  }

  addStore(store: Store): Observable<any> {
    return this._httpClient.post(`${this.hostServer}/stores/web`, store);
  }

  getStoreOrders(storeId: string) {
    return this._httpClient.get<any[]>(
      `${this.hostServer}/orders/store/${storeId}/orders`
    );
  }

  deleteStoreOrders(orderId: string) {
    return this._httpClient.delete(`${this.hostServer}/orders/${orderId}`);
  }

  updateOrderStatus(orderId: string, userId: string, status: any) {
    return this._httpClient.put(
      `${this.hostServer}/orders/${orderId}/status/${userId}`,
      status
    );
  }

   /**
   * upload store
   *
   * @param formData
   * @returns {Promise<any>}
   */
   uploadLogo(formData: any, storeId?: string): Observable<any> {
    return this._httpClient.post(`${this.hostServer}/stores/upload/${storeId}/logo`, formData)
  }

  uploadBanner(formData: any, storeId?: string): Observable<any> {
    return this._httpClient.post(`${this.hostServer}/stores/upload/${storeId}/banner`, formData)
  }

  getOrderStat(date:any) {
    let httpParams = new HttpParams({ fromObject: date });
    return this._httpClient.get(`${this.hostServer}/dashboard/total-store-sales?${httpParams.toString()}`);
  }

  getIncompleteData(storeId:string) {
    return this._httpClient.get(`${this.hostServer}/stores/in-complete-data/${storeId}`);
  }

   getDeliveryZonesFromServer():Observable<DeliveryZone[]> {
    return this._httpClient.get<DeliveryZone[]>(`${this.hostServer}/delivery-zones`);
  }

  /**
   * Validate store owner PIN for authorization
   */
  validateStoreOwnerPin(storeId: string, pin: string): Observable<boolean> {
    return this._httpClient.post<boolean>(
      `${this.hostServer}/stores/${storeId}/validate-pin`,
      { pin }
    );
  }

  /**
   * Find a store by its unique store number
   */
  getStoreByNumber(storeNumber: string): Observable<{ success: boolean; data: Store; message?: string }> {
    return this._httpClient.get<{ success: boolean; data: Store; message?: string }>(
      `${this.hostServer}/stores/by-number/${storeNumber}`
    );
  }

  /**
   * Validate if a merchant has access to a store by store number
   */
  validateMerchantStoreAccess(storeNumber: string, merchantId: string): Observable<{ success: boolean; data: Store; message?: string }> {
    return this._httpClient.get<{ success: boolean; data: Store; message?: string }>(
      `${this.hostServer}/stores/validate-access/${storeNumber}/${merchantId}`
    );
  }
}
