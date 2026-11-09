import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BlinkPayment, BlinkPaymentRow, BlinkSettings, BlinkStatus, SaveBlinkSettings } from './blink.models';

/** Thin wrapper over the Blink routes. */
@Injectable({ providedIn: 'root' })
export class BlinkApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/blink`;

  status(storeId: string): Observable<BlinkStatus> {
    return this.http.get<BlinkStatus>(`${this.base}/store/${storeId}/status`);
  }
  settings(storeId: string): Observable<BlinkSettings> {
    return this.http.get<BlinkSettings>(`${this.base}/store/${storeId}/settings`);
  }
  saveSettings(storeId: string, body: SaveBlinkSettings): Observable<BlinkSettings> {
    return this.http.put<BlinkSettings>(`${this.base}/store/${storeId}/settings`, body);
  }
  test(storeId: string): Observable<BlinkSettings> {
    return this.http.post<BlinkSettings>(`${this.base}/store/${storeId}/settings/test`, {});
  }
  create(storeId: string, body: { mode: 'qr' | 'push'; amount: number; customerMobileNo?: string; deviceId?: string }): Observable<BlinkPayment> {
    return this.http.post<BlinkPayment>(`${this.base}/store/${storeId}/payments`, body);
  }
  payment(storeId: string, id: string): Observable<BlinkPayment> {
    return this.http.get<BlinkPayment>(`${this.base}/store/${storeId}/payments/${id}`);
  }
  cancel(storeId: string, id: string): Observable<BlinkPayment> {
    return this.http.post<BlinkPayment>(`${this.base}/store/${storeId}/payments/${id}/cancel`, {});
  }
  list(storeId: string, query: { from?: string; to?: string; status?: string } = {}): Observable<{ data: BlinkPaymentRow[] }> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) if (v) params = params.set(k, v);
    return this.http.get<{ data: BlinkPaymentRow[] }>(`${this.base}/store/${storeId}/payments`, { params });
  }
}
