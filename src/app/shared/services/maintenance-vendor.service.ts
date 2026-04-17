import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/estate.model';
import {
  MaintenanceVendor,
  MaintenanceVendorFilters,
  CreateMaintenanceVendorPayload,
  UpdateMaintenanceVendorPayload,
} from '../models/maintenance-vendor.model';
import { MaintenanceCategoryItem } from '../models/maintenance-vendor.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceVendorService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/maintenance/vendors`;
  private uploadUrl = `${environment.apiUrl}/estate/maintenance/upload/photos`;

  getAll(
    storeId: string,
    filters: MaintenanceVendorFilters = {},
  ): Observable<PaginatedResponse<MaintenanceVendor>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PaginatedResponse<MaintenanceVendor>>(this.baseUrl, {
      params,
      headers: { storeid: storeId },
    });
  }

  getById(storeId: string, id: string): Observable<ApiResponse<MaintenanceVendor>> {
    return this.http.get<ApiResponse<MaintenanceVendor>>(`${this.baseUrl}/${id}`, {
      headers: { storeid: storeId },
    });
  }

  create(
    storeId: string,
    payload: CreateMaintenanceVendorPayload,
  ): Observable<ApiResponse<MaintenanceVendor>> {
    return this.http.post<ApiResponse<MaintenanceVendor>>(this.baseUrl, payload, {
      headers: { storeid: storeId },
    });
  }

  update(
    storeId: string,
    id: string,
    payload: UpdateMaintenanceVendorPayload,
  ): Observable<ApiResponse<MaintenanceVendor>> {
    return this.http.patch<ApiResponse<MaintenanceVendor>>(`${this.baseUrl}/${id}`, payload, {
      headers: { storeid: storeId },
    });
  }

  delete(storeId: string, id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`, {
      headers: { storeid: storeId },
    });
  }

  uploadProfileImage(storeId: string, file: File): Observable<ApiResponse<{ photos: string[] }>> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<ApiResponse<{ photos: string[] }>>(this.uploadUrl, formData, {
      headers: { storeid: storeId },
    });
  }
}
