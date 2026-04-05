import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  EndLeasePayload,
  Lease,
  LeaseCloseoutSummary,
  PaginatedResponse,
} from '../models/estate.model';

export interface LeaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class LeaseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/leases`;

  getLeases(storeId: string, filters: LeaseFilters = {}): Observable<PaginatedResponse<Lease>> {
    let params = new HttpParams().set('storeId', storeId);

    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.propertyId) params = params.set('propertyId', filters.propertyId);
    if (filters.unitId) params = params.set('unitId', filters.unitId);
    if (filters.tenantId) params = params.set('tenantId', filters.tenantId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<Lease>>(this.baseUrl, { params });
  }

  getLeaseById(id: string): Observable<ApiResponse<Lease>> {
    return this.http.get<ApiResponse<Lease>>(`${this.baseUrl}/${id}`);
  }

  createLease(data: Partial<Lease>): Observable<ApiResponse<Lease>> {
    return this.http.post<ApiResponse<Lease>>(this.baseUrl, data);
  }

  updateLease(id: string, data: Partial<Lease>): Observable<ApiResponse<Lease>> {
    return this.http.patch<ApiResponse<Lease>>(`${this.baseUrl}/${id}`, data);
  }

  deleteLease(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`);
  }

  activateLease(id: string): Observable<ApiResponse<Lease>> {
    return this.http.post<ApiResponse<Lease>>(`${this.baseUrl}/${id}/activate`, {});
  }

  getLeaseCloseoutSummary(id: string): Observable<ApiResponse<LeaseCloseoutSummary>> {
    return this.http.get<ApiResponse<LeaseCloseoutSummary>>(
      `${this.baseUrl}/${id}/closeout-summary`,
    );
  }

  endLease(id: string, data: EndLeasePayload): Observable<ApiResponse<Lease>> {
    return this.http.post<ApiResponse<Lease>>(`${this.baseUrl}/${id}/end`, data);
  }
}
