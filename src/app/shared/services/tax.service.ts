import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Tax {
  id: string;
  title: string;
  position?: number;
  rate?: number | string;
  is_inclusive?: boolean;
  logic?: string;
  type?: string;
  currency?: string;
  max_nights?: number;
  skip_nights?: number;
  applicable_date_ranges?: Array<{ after: string; before: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class TaxService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTaxes(propertyId: string, page = 1, limit = 100): Observable<Tax[]> {
    return this.http
      .get<any>(
        `${this.apiUrl}/admin/channex/taxes?propertyId=${propertyId}&page=${page}&limit=${limit}`
      )
      .pipe(
        map((response) => {
          // Handle response structure
          const dataArray = Array.isArray(response?.data) ? response.data : [];
          return dataArray.map((item: any) => ({
            id: item.id || item.attributes?.id,
            title: item.attributes?.title,
            position: item.attributes?.position,
            rate: item.attributes?.rate,
            is_inclusive: item.attributes?.is_inclusive,
            logic: item.attributes?.logic,
            type: item.attributes?.type,
            currency: item.attributes?.currency,
            max_nights: item.attributes?.max_nights,
            skip_nights: item.attributes?.skip_nights,
            applicable_date_ranges: item.attributes?.applicable_date_ranges,
          }));
        })
      );
  }

  getTax(propertyId: string, taxId: string): Observable<Tax> {
    return this.http
      .get<any>(
        `${this.apiUrl}/admin/channex/taxes/${taxId}?propertyId=${propertyId}`
      )
      .pipe(
        map((response) => {
          const item = response?.data;
          return {
            id: item.id || item.attributes?.id,
            title: item.attributes?.title,
            position: item.attributes?.position,
            rate: item.attributes?.rate,
            is_inclusive: item.attributes?.is_inclusive,
            logic: item.attributes?.logic,
            type: item.attributes?.type,
            currency: item.attributes?.currency,
            max_nights: item.attributes?.max_nights,
            skip_nights: item.attributes?.skip_nights,
            applicable_date_ranges: item.attributes?.applicable_date_ranges,
          };
        })
      );
  }

  createTax(propertyId: string, taxData: any): Observable<Tax> {
    return this.http
      .post<any>(
        `${this.apiUrl}/admin/channex/taxes?propertyId=${propertyId}`,
        taxData
      )
      .pipe(
        map((response) => {
          const item = response?.data;
          return {
            id: item.id || item.attributes?.id,
            title: item.attributes?.title,
            position: item.attributes?.position,
            rate: item.attributes?.rate,
            is_inclusive: item.attributes?.is_inclusive,
            logic: item.attributes?.logic,
            type: item.attributes?.type,
            currency: item.attributes?.currency,
            max_nights: item.attributes?.max_nights,
            skip_nights: item.attributes?.skip_nights,
            applicable_date_ranges: item.attributes?.applicable_date_ranges,
          };
        })
      );
  }

  updateTax(propertyId: string, taxId: string, taxData: any): Observable<Tax> {
    return this.http
      .put<any>(
        `${this.apiUrl}/admin/channex/taxes/${taxId}?propertyId=${propertyId}`,
        taxData
      )
      .pipe(
        map((response) => {
          const item = response?.data;
          return {
            id: item.id || item.attributes?.id,
            title: item.attributes?.title,
            position: item.attributes?.position,
            rate: item.attributes?.rate,
            is_inclusive: item.attributes?.is_inclusive,
            logic: item.attributes?.logic,
            type: item.attributes?.type,
            currency: item.attributes?.currency,
            max_nights: item.attributes?.max_nights,
            skip_nights: item.attributes?.skip_nights,
            applicable_date_ranges: item.attributes?.applicable_date_ranges,
          };
        })
      );
  }

  deleteTax(propertyId: string, taxId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/admin/channex/taxes/${taxId}?propertyId=${propertyId}`
    );
  }
}
