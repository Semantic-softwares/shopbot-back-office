import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Unit,
  PaginatedResponse,
  ApiResponse,
  UnitSummary,
} from '../models/estate.model';

export interface UnitFilters {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  type?: string;
  status?: string;
  minRent?: number;
  maxRent?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class EstateUnitService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/units`;
  private propertiesUrl = `${environment.apiUrl}/estate/properties`;

  getUnits(
    storeId: string,
    filters: UnitFilters = {},
  ): Observable<PaginatedResponse<Unit>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.propertyId) params = params.set('propertyId', filters.propertyId);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.minRent != null) params = params.set('minRent', String(filters.minRent));
    if (filters.maxRent != null) params = params.set('maxRent', String(filters.maxRent));
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    params = params.set('storeId', storeId);

    return this.http.get<PaginatedResponse<Unit>>(this.baseUrl, { params });
  }

  getUnitsByProperty(
    propertyId: string,
    page: number = 1,
    limit: number = 20,
  ): Observable<PaginatedResponse<Unit>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<PaginatedResponse<Unit>>(
      `${this.propertiesUrl}/${propertyId}/units`,
      { params },
    );
  }

  getUnitById(id: string): Observable<ApiResponse<Unit>> {
    return this.http.get<ApiResponse<Unit>>(`${this.baseUrl}/${id}`);
  }

  createUnit(data: Partial<Unit>): Observable<ApiResponse<Unit>> {
    return this.http.post<ApiResponse<Unit>>(this.baseUrl, data);
  }

  updateUnit(id: string, data: Partial<Unit>): Observable<ApiResponse<Unit>> {
    return this.http.put<ApiResponse<Unit>>(`${this.baseUrl}/${id}`, data);
  }

  deleteUnit(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/${id}`,
    );
  }

  getUnitSummary(
    storeId: string,
    propertyId?: string,
  ): Observable<{ success: boolean; data: UnitSummary }> {
    let params = new HttpParams().set('storeId', storeId);
    if (propertyId) params = params.set('propertyId', propertyId);
    return this.http.get<{ success: boolean; data: UnitSummary }>(
      `${this.baseUrl}/summary`,
      { params },
    );
  }

  uploadCoverPhoto(unitId: string, file: File): Observable<{ success: boolean; photo: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; photo: string }>(
      `${this.baseUrl}/upload/${unitId}/cover`,
      formData,
    );
  }

  uploadGalleryPhotos(unitId: string, files: File[]): Observable<{ success: boolean; photos: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http.post<{ success: boolean; photos: string[] }>(
      `${this.baseUrl}/upload/${unitId}/gallery`,
      formData,
    );
  }

  uploadAttachments(unitId: string, files: File[]): Observable<{ success: boolean; attachments: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http.post<{ success: boolean; attachments: string[] }>(
      `${this.baseUrl}/upload/${unitId}/attachments`,
      formData,
    );
  }
}
