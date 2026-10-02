import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KitchenOrder, KitchenOrderAdvanceResult } from '../models/kitchen-display.model';
import { KdsStatusCatalog } from '../models/station.model';

/**
 * Talks to the backend's /kitchen-display API — the exact same frozen
 * contract the standalone shopbot-kds kiosk app calls. Back-office's
 * "Kitchen Orders" page (src/app/menu/kitchen-display) uses this so staff can
 * advance an item's status from their own phone/tablet while still logged
 * into back-office, without needing the big board.
 */
@Injectable({ providedIn: 'root' })
export class KitchenDisplayService {
  private http = inject(HttpClient);
  private hostServer: string = environment.apiUrl;

  /**
   * Active (non-terminal) orders for a store, optionally scoped to one
   * station. Omit stationId or pass 'all' for every station's items.
   */
  getActiveOrders(storeId: string, stationId?: string): Observable<KitchenOrder[]> {
    let params = new HttpParams();
    if (stationId && stationId !== 'all') {
      params = params.set('stationId', stationId);
    }
    return this.http.get<KitchenOrder[]>(
      `${this.hostServer}/kitchen-display/stores/${storeId}/orders`,
      { params },
    );
  }

  /** Move every item of the order (for `stationId`, or all) one step forward. */
  advanceOrder(orderId: string, stationId?: string): Observable<KitchenOrderAdvanceResult> {
    return this.http.patch<KitchenOrderAdvanceResult>(
      `${this.hostServer}/kitchen-display/orders/${orderId}/advance`,
      { stationId: stationId && stationId !== 'all' ? stationId : undefined, direction: 'next' },
    );
  }

  /**
   * The fixed, backend-defined status list, allowed shortcut keys (F1–F12)
   * and default flow. Single source of truth for the station status editor.
   */
  getStatusCatalog(): Observable<KdsStatusCatalog> {
    return this.http.get<KdsStatusCatalog>(`${this.hostServer}/kitchen-display/statuses`);
  }
}
