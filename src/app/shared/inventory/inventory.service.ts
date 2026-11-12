import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bom, InventoryItem, InventoryLocation, InventorySettings, InventoryUnit, ItemDetail, Stocktake, StockShortage } from './inventory.models';

/** Calls the universal-inventory API. Every request is for one store; the server checks the person may touch it. */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/inventory`;

  private get<T>(url: string, params?: Record<string, any>) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    return firstValueFrom(this.http.get<T>(url, { params: p }));
  }
  private send<T>(method: 'post' | 'put' | 'patch' | 'delete', url: string, body?: any) {
    return firstValueFrom(this.http.request<T>(method, url, { body }));
  }
  /** A fresh id per tap, so a double-click or a retry after a bad connection cannot apply twice. */
  requestId(): string { return (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

  units(s: string) { return this.get<InventoryUnit[]>(`${this.base(s)}/units`); }
  locations(s: string) { return this.get<InventoryLocation[]>(`${this.base(s)}/locations`); }
  addLocation(s: string, body: { name: string; type?: string }) { return this.send<InventoryLocation>('post', `${this.base(s)}/locations`, body); }
  editLocation(s: string, id: string, body: { name?: string; type?: string; active?: boolean }) { return this.send<InventoryLocation>('patch', `${this.base(s)}/locations/${id}`, body); }
  settings(s: string) { return this.get<InventorySettings>(`${this.base(s)}/settings`); }
  saveSettings(s: string, body: Partial<InventorySettings>) { return this.send<InventorySettings>('put', `${this.base(s)}/settings`, body); }

  items(s: string, q: Record<string, any> = {}) { return this.get<{ items: InventoryItem[]; total: number; page: number; limit: number }>(`${this.base(s)}/items`, q); }
  item(s: string, id: string) { return this.get<ItemDetail>(`${this.base(s)}/items/${id}`); }
  createItem(s: string, body: any) { return this.send<InventoryItem>('post', `${this.base(s)}/items`, body); }
  updateItem(s: string, id: string, body: any) { return this.send<InventoryItem>('patch', `${this.base(s)}/items/${id}`, body); }
  deleteItem(s: string, id: string) { return this.send<{ deleted: boolean; deactivated: boolean }>('delete', `${this.base(s)}/items/${id}`); }
  setAlert(s: string, id: string, body: { location: string; threshold: number; unit: string; enabled: boolean }) { return this.send<any>('put', `${this.base(s)}/items/${id}/alert`, body); }

  stock(s: string, op: 'add' | 'remove' | 'wastage', body: any) { return this.send<any>('post', `${this.base(s)}/stock/${op}`, { ...body, requestId: this.requestId() }); }
  adjust(s: string, body: any) { return this.send<any>('post', `${this.base(s)}/stock/adjust`, { ...body, requestId: this.requestId() }); }
  transfer(s: string, body: any) { return this.send<any>('post', `${this.base(s)}/stock/transfer`, { ...body, requestId: this.requestId() }); }

  stocktakes(s: string) { return this.get<Stocktake[]>(`${this.base(s)}/stocktakes`); }
  stocktake(s: string, id: string) { return this.get<Stocktake>(`${this.base(s)}/stocktakes/${id}`); }
  startStocktake(s: string, location: string, note?: string) { return this.send<Stocktake>('post', `${this.base(s)}/stocktakes`, { location, note }); }
  saveCounts(s: string, id: string, lines: { item: string; counted: number; unit: string }[]) { return this.send<Stocktake>('put', `${this.base(s)}/stocktakes/${id}/counts`, { lines }); }
  approveStocktake(s: string, id: string) { return this.send<any>('post', `${this.base(s)}/stocktakes/${id}/approve`); }
  cancelStocktake(s: string, id: string) { return this.send<Stocktake>('post', `${this.base(s)}/stocktakes/${id}/cancel`); }

  bom(s: string, productId: string) { return this.get<Bom | null>(`${this.base(s)}/products/${productId}/bom`); }
  saveBom(s: string, productId: string, body: { outputQuantity: number; outputUnit?: string; components: { item: string; quantity: number; unit: string }[] }) { return this.send<Bom>('put', `${this.base(s)}/products/${productId}/bom`, body); }
  tracking(s: string, productId: string) { return this.get<{ mode: 'none' | 'direct' | 'bom' }>(`${this.base(s)}/products/${productId}/tracking`); }
  setTracking(s: string, productId: string, mode: 'none' | 'direct' | 'bom') { return this.send<any>('put', `${this.base(s)}/products/${productId}/tracking`, { mode }); }

  report(s: string, id: string, q: Record<string, any> = {}) { return this.get<any>(`${this.base(s)}/reports/${id}`, q); }
  checkSale(s: string, lines: { productId: string; quantity: number }[]) { return this.send<{ policy: 'allow' | 'block'; shortages: StockShortage[]; canOverride: boolean }>('post', `${this.base(s)}/check-sale`, { lines }); }
}
