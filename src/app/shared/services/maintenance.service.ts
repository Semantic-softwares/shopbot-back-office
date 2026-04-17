import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/estate.model';
import {
  AddMaintenanceCommentPayload,
  AssignMaintenanceRequestPayload,
  CreateMaintenanceRequestPayload,
  MaintenanceActivity,
  MaintenanceFilters,
  MaintenanceRequest,
  MaintenanceRequestDetail,
  MaintenanceSummary,
  UpdateMaintenanceCostPayload,
  UpdateMaintenanceRequestPayload,
  UpdateMaintenanceStatusPayload,
} from '../models/maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/maintenance`;

  uploadPhotos(
    storeId: string,
    files: File[],
  ): Observable<ApiResponse<{ photos: string[] }>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http.post<ApiResponse<{ photos: string[] }>>(
      `${this.baseUrl}/upload/photos`,
      formData,
      { headers: { storeid: storeId } },
    );
  }

  create(
    storeId: string,
    payload: CreateMaintenanceRequestPayload,
  ): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.post<ApiResponse<MaintenanceRequest>>(this.baseUrl, payload, {
      headers: { storeid: storeId },
    });
  }

  getAll(
    storeId: string,
    filters: MaintenanceFilters = {},
  ): Observable<PaginatedResponse<MaintenanceRequest>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PaginatedResponse<MaintenanceRequest>>(this.baseUrl, {
      params,
      headers: { storeid: storeId },
    });
  }

  getSummary(storeId: string): Observable<ApiResponse<MaintenanceSummary>> {
    return this.http.get<ApiResponse<MaintenanceSummary>>(`${this.baseUrl}/summary`, {
      headers: { storeid: storeId },
    });
  }

  getById(storeId: string, id: string): Observable<ApiResponse<MaintenanceRequestDetail>> {
    return this.http.get<ApiResponse<MaintenanceRequestDetail>>(`${this.baseUrl}/${id}`, {
      headers: { storeid: storeId },
    });
  }

  update(
    storeId: string,
    id: string,
    payload: UpdateMaintenanceRequestPayload,
  ): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.patch<ApiResponse<MaintenanceRequest>>(`${this.baseUrl}/${id}`, payload, {
      headers: { storeid: storeId },
    });
  }

  delete(storeId: string, id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`, {
      headers: { storeid: storeId },
    });
  }

  assign(
    storeId: string,
    id: string,
    payload: AssignMaintenanceRequestPayload,
  ): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.post<ApiResponse<MaintenanceRequest>>(
      `${this.baseUrl}/${id}/assign`,
      payload,
      { headers: { storeid: storeId } },
    );
  }

  updateStatus(
    storeId: string,
    id: string,
    payload: UpdateMaintenanceStatusPayload,
  ): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.post<ApiResponse<MaintenanceRequest>>(
      `${this.baseUrl}/${id}/status`,
      payload,
      { headers: { storeid: storeId } },
    );
  }

  addComment(
    storeId: string,
    id: string,
    payload: AddMaintenanceCommentPayload,
  ): Observable<ApiResponse<MaintenanceActivity>> {
    return this.http.post<ApiResponse<MaintenanceActivity>>(
      `${this.baseUrl}/${id}/comments`,
      payload,
      { headers: { storeid: storeId } },
    );
  }

  updateCost(
    storeId: string,
    id: string,
    payload: UpdateMaintenanceCostPayload,
  ): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.post<ApiResponse<MaintenanceRequest>>(
      `${this.baseUrl}/${id}/cost`,
      payload,
      { headers: { storeid: storeId } },
    );
  }

  getByProperty(
    storeId: string,
    propertyId: string,
    filters: MaintenanceFilters = {},
  ): Observable<PaginatedResponse<MaintenanceRequest>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<MaintenanceRequest>>(
      `${environment.apiUrl}/estate/properties/${propertyId}/maintenance`,
      { params, headers: { storeid: storeId } },
    );
  }

  getByUnit(
    storeId: string,
    unitId: string,
    filters: MaintenanceFilters = {},
  ): Observable<PaginatedResponse<MaintenanceRequest>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<MaintenanceRequest>>(
      `${environment.apiUrl}/estate/units/${unitId}/maintenance`,
      { params, headers: { storeid: storeId } },
    );
  }
}
