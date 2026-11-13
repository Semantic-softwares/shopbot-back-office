import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FiscalisationOverview } from '../models/mra-einvoicing.model';
import { FiscalOrderView, FiscalTransactionPage, FiscalTransactionQuery } from '../models/fiscal.model';
import { StoreStore } from '../stores/store.store';
import { OfflineStore } from '../offline/offline-store.service';
import { cachedFetch } from '../offline/cached-fetch';

/**
 * The country-neutral window onto a store's tax authority. Everything fiscal in the app (the order tag and QR, the
 * transaction report, the nav entry) asks `active()` first: a store in a country with no integration, or one that has
 * not finished setting its authority up, sees nothing fiscal at all.
 */
@Injectable({ providedIn: 'root' })
export class FiscalisationService {
  private readonly http = inject(HttpClient);
  private readonly storeStore = inject(StoreStore);
  private readonly offline = inject(OfflineStore);
  private readonly api = environment.apiUrl;

  readonly overview = signal<FiscalisationOverview | null>(null);
  /** The authority is reporting this store's sales right now. */
  readonly active = computed(() => this.overview()?.active === true);
  readonly authorityName = computed(() => this.overview()?.authority?.name ?? '');

  constructor() {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      this.overview.set(null);
      if (!storeId) return;
      // Remembered on the device, so the fiscal screens (and the counters on them) are still there with no connection.
      cachedFetch(this.offline, `fiscal-overview:${storeId}`, this.http.get<FiscalisationOverview>(`${this.api}/revenue-authority/stores/${storeId}`)).pipe(catchError(() => of(null))).subscribe((o) => {
        // A late answer for a store the user already switched away from must not apply.
        if (this.storeStore.selectedStore()?._id === storeId) this.overview.set(o);
      });
    });
  }

  /** The tag and QR for one order, or null when it has no fiscal document (or nothing is switched on). */
  orderView(storeId: string, orderId: string): Observable<FiscalOrderView | null> {
    // Remembered on the device so a receipt opened offline still shows its tag and QR.
    return cachedFetch(this.offline, `fiscal-order:${orderId}`, this.http.get<{ view: FiscalOrderView | null }>(`${this.api}/revenue-authority/stores/${storeId}/orders/${orderId}/fiscal`)).pipe(
      map((r) => r.view ?? null),
      catchError(() => of(null)),
    );
  }

  transactions(storeId: string, query: FiscalTransactionQuery): Observable<FiscalTransactionPage> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') params = params.set(k, String(v));
    // The last report seen for this period stays readable offline.
    return cachedFetch(this.offline, `fiscal-transactions:${storeId}:${params.toString()}`, this.http.get<FiscalTransactionPage>(`${this.api}/revenue-authority/stores/${storeId}/transactions`, { params }));
  }
}
