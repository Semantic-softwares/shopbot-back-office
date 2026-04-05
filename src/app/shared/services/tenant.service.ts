import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  Tenant,
  TenantSummary,
} from '../models/estate.model';

export interface TenantFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/tenants`;

  getTenants(
    storeId: string,
    filters: TenantFilters = {},
  ): Observable<PaginatedResponse<Tenant>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    params = params.set('storeId', storeId);

    return this.http.get<PaginatedResponse<Tenant>>(this.baseUrl, { params });
  }

  getTenantById(id: string): Observable<ApiResponse<Tenant>> {
    return this.http.get<ApiResponse<Tenant>>(`${this.baseUrl}/${id}`);
  }

  createTenant(data: Partial<Tenant>): Observable<ApiResponse<Tenant>> {
    return this.http.post<ApiResponse<Tenant>>(this.baseUrl, data);
  }

  updateTenant(id: string, data: Partial<Tenant>): Observable<ApiResponse<Tenant>> {
    return this.http.patch<ApiResponse<Tenant>>(`${this.baseUrl}/${id}`, data);
  }

  deleteTenant(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`);
  }

  uploadCoverPhoto(tenantId: string, file: File): Observable<{ success: boolean; photo: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; photo: string }>(
      `${this.baseUrl}/upload/${tenantId}/cover`,
      formData,
    );
  }

  getTenantSummary(
    storeId: string,
  ): Observable<{ success: boolean; data: TenantSummary }> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<{ success: boolean; data: TenantSummary }>(
      `${this.baseUrl}/summary`,
      { params },
    );
  }
}
