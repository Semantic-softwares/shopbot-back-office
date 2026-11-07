import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PricingMode, PricingModePreview, Tax, TaxReport, TaxUsage, TaxView } from '../models/tax.model';

/**
 * Tax rules and the store's tax settings (the `taxes` API). Not to be confused with `TaxService`, which is the hotel
 * channel manager's taxes.
 */
@Injectable({ providedIn: 'root' })
export class AccountingTaxService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/taxes`;

  view(storeId: string): Observable<TaxView> {
    return this.http.get<TaxView>(`${this.base}/store/${storeId}`);
  }

  create(storeId: string, tax: Partial<Tax>): Observable<Tax> {
    return this.http.post<Tax>(`${this.base}/store/${storeId}`, tax);
  }

  update(taxId: string, tax: Partial<Tax>): Observable<Tax> {
    return this.http.put<Tax>(`${this.base}/${taxId}`, tax);
  }

  usage(taxId: string): Observable<TaxUsage> {
    return this.http.get<TaxUsage>(`${this.base}/${taxId}/usage`);
  }

  /** The only call that turns tax management on for a store. */
  setup(storeId: string, body: { defaultPricingMode: PricingMode; defaultTaxId?: string; taxRegistrationNumber?: string }): Observable<TaxView> {
    return this.http.post<TaxView>(`${this.base}/store/${storeId}/setup`, body);
  }

  updateSettings(
    storeId: string,
    body: { taxesEnabled?: boolean; defaultPricingMode?: PricingMode; pricingModeChange?: 'pin' | 'convert'; defaultTaxId?: string; taxRegistrationNumber?: string },
  ): Observable<TaxView> {
    return this.http.patch<TaxView>(`${this.base}/store/${storeId}/settings`, body);
  }

  pricingModePreview(storeId: string, to: PricingMode): Observable<PricingModePreview> {
    return this.http.get<PricingModePreview>(`${this.base}/store/${storeId}/pricing-mode-preview`, { params: { to } });
  }

  report(storeId: string, query: { from?: string; to?: string; taxId?: string }): Observable<TaxReport> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value) params = params.set(key, value);
    return this.http.get<TaxReport>(`${this.base}/store/${storeId}/report`, { params });
  }
}
