import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/estate.model';
import {
  MaintenanceCategoryItem,
  MaintenanceCategoryFilters,
  CreateMaintenanceCategoryPayload,
  UpdateMaintenanceCategoryPayload,
} from '../models/maintenance-vendor.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceCategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/maintenance/categories`;

  getAll(
    storeId: string,
    filters: MaintenanceCategoryFilters = {},
  ): Observable<PaginatedResponse<MaintenanceCategoryItem>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PaginatedResponse<MaintenanceCategoryItem>>(this.baseUrl, {
      params,
      headers: { storeid: storeId },
    });
  }

  getAllActive(storeId: string): Observable<ApiResponse<MaintenanceCategoryItem[]>> {
    return this.http.get<ApiResponse<MaintenanceCategoryItem[]>>(`${this.baseUrl}/all`, {
      headers: { storeid: storeId },
    });
  }

  getById(storeId: string, id: string): Observable<ApiResponse<MaintenanceCategoryItem>> {
    return this.http.get<ApiResponse<MaintenanceCategoryItem>>(`${this.baseUrl}/${id}`, {
      headers: { storeid: storeId },
    });
  }

  create(
    storeId: string,
    payload: CreateMaintenanceCategoryPayload,
  ): Observable<ApiResponse<MaintenanceCategoryItem>> {
    return this.http.post<ApiResponse<MaintenanceCategoryItem>>(this.baseUrl, payload, {
      headers: { storeid: storeId },
    });
  }

  update(
    storeId: string,
    id: string,
    payload: UpdateMaintenanceCategoryPayload,
  ): Observable<ApiResponse<MaintenanceCategoryItem>> {
    return this.http.patch<ApiResponse<MaintenanceCategoryItem>>(`${this.baseUrl}/${id}`, payload, {
      headers: { storeid: storeId },
    });
  }

  delete(storeId: string, id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`, {
      headers: { storeid: storeId },
    });
  }
}
