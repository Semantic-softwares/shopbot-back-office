import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Property,
  PaginatedResponse,
  ApiResponse,
  PropertySummary,
} from '../models/estate.model';

export interface PropertyFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  ownerId?: string;
}

@Injectable({ providedIn: 'root' })
export class EstatePropertyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/properties`;

  getProperties(
    storeId: string,
    filters: PropertyFilters = {},
  ): Observable<PaginatedResponse<Property>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.ownerId) params = params.set('ownerId', filters.ownerId);
    params = params.set('storeId', storeId);

    return this.http.get<PaginatedResponse<Property>>(this.baseUrl, { params });
  }

  getPropertyById(id: string): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.baseUrl}/${id}`);
  }

  createProperty(data: Partial<Property> & { units?: any[] }): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(this.baseUrl, data);
  }

  updateProperty(
    id: string,
    data: Partial<Property>,
  ): Observable<ApiResponse<Property>> {
    return this.http.patch<ApiResponse<Property>>(
      `${this.baseUrl}/${id}`,
      data,
    );
  }

  deleteProperty(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/${id}`,
    );
  }

  getPropertySummary(
    storeId: string,
  ): Observable<{ success: boolean; data: PropertySummary }> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<{ success: boolean; data: PropertySummary }>(
      `${this.baseUrl}/summary`,
      { params },
    );
  }

  uploadCoverPhoto(propertyId: string, file: File): Observable<{ success: boolean; photo: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; photo: string }>(
      `${this.baseUrl}/upload/${propertyId}/cover`,
      formData,
    );
  }

  uploadGalleryPhotos(propertyId: string, files: File[]): Observable<{ success: boolean; photos: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http.post<{ success: boolean; photos: string[] }>(
      `${this.baseUrl}/upload/${propertyId}/gallery`,
      formData,
    );
  }

  uploadAttachments(propertyId: string, files: File[]): Observable<{ success: boolean; attachments: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http.post<{ success: boolean; attachments: string[] }>(
      `${this.baseUrl}/upload/${propertyId}/attachments`,
      formData,
    );
  }
}
