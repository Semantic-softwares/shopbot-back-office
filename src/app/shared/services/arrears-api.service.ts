import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  ArrearsAgingSummary,
  ArrearsSummary,
  ArrearsRowsResponse,
  TopArrearsProperty,
  TopArrearsTenant,
  ArrearsQueryParams,
} from '../models/arrears.model';

@Injectable({
  providedIn: 'root',
})
export class ArrearsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/estate/arrears`;

  /**
   * Get high-level arrears KPI summary
   */
  getArrearsSummary(filters?: Partial<ArrearsQueryParams>): Observable<ArrearsSummary> {
    let params = new HttpParams();
    if (filters) {
      params = this.buildHttpParams(filters, params);
    }

    return this.http
      .get<ApiResponse<ArrearsSummary>>(`${this.baseUrl}/summary`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * Get paginated grouped arrears rows
   */
  getArrearsRows(query: ArrearsQueryParams): Observable<ArrearsRowsResponse> {
    let params = new HttpParams();
    params = this.buildHttpParams(query, params);

    return this.http
      .get<ApiResponse<ArrearsRowsResponse>>(`${this.baseUrl}`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * Get arrears totals by aging bucket
   */
  getArrearsAging(filters?: Partial<ArrearsQueryParams>): Observable<ArrearsAgingSummary> {
    let params = new HttpParams();
    if (filters) {
      params = this.buildHttpParams(filters, params);
    }

    return this.http
      .get<ApiResponse<ArrearsAgingSummary>>(`${this.baseUrl}/aging`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * Get top properties by arrears amount
   */
  getTopArrearsProperties(
    limit?: number,
    filters?: Partial<ArrearsQueryParams>,
  ): Observable<TopArrearsProperty[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (filters) {
      params = this.buildHttpParams(filters, params);
    }

    return this.http
      .get<ApiResponse<TopArrearsProperty[]>>(`${this.baseUrl}/properties/top`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * Get top tenants by arrears amount
   */
  getTopArrearsTenants(
    limit?: number,
    filters?: Partial<ArrearsQueryParams>,
  ): Observable<TopArrearsTenant[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (filters) {
      params = this.buildHttpParams(filters, params);
    }

    return this.http
      .get<ApiResponse<TopArrearsTenant[]>>(`${this.baseUrl}/tenants/top`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * Helper method to build HTTP params from query object
   */
  private buildHttpParams(
    query: Partial<ArrearsQueryParams>,
    params: HttpParams = new HttpParams(),
  ): HttpParams {
    if (query.propertyId) params = params.set('propertyId', query.propertyId);
    if (query.unitId) params = params.set('unitId', query.unitId);
    if (query.tenantId) params = params.set('tenantId', query.tenantId);
    if (query.leaseId) params = params.set('leaseId', query.leaseId);
    if (query.minAmount !== undefined) params = params.set('minAmount', query.minAmount.toString());
    if (query.maxAmount !== undefined) params = params.set('maxAmount', query.maxAmount.toString());
    if (query.agingBucket) params = params.set('agingBucket', query.agingBucket);
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom.toISOString());
    if (query.dateTo) params = params.set('dateTo', query.dateTo.toISOString());
    if (query.search) params = params.set('search', query.search);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);

    return params;
  }
}
