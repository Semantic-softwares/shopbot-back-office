import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RentalOwner,
  PaginatedResponse,
  ApiResponse,
  RentalOwnerSummary,
} from '../models/estate.model';

export interface RentalOwnerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class RentalOwnerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/rental-owners`;

  getRentalOwners(
    storeId: string,
    filters: RentalOwnerFilters = {},
  ): Observable<PaginatedResponse<RentalOwner>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    params = params.set('storeId', storeId);

    return this.http.get<PaginatedResponse<RentalOwner>>(this.baseUrl, { params });
  }

  getRentalOwnerById(id: string): Observable<ApiResponse<RentalOwner>> {
    return this.http.get<ApiResponse<RentalOwner>>(`${this.baseUrl}/${id}`);
  }

  createRentalOwner(data: Partial<RentalOwner>): Observable<ApiResponse<RentalOwner>> {
    return this.http.post<ApiResponse<RentalOwner>>(this.baseUrl, data);
  }

  updateRentalOwner(
    id: string,
    data: Partial<RentalOwner>,
  ): Observable<ApiResponse<RentalOwner>> {
    return this.http.patch<ApiResponse<RentalOwner>>(
      `${this.baseUrl}/${id}`,
      data,
    );
  }

  deleteRentalOwner(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/${id}`,
    );
  }

  getRentalOwnerSummary(
    storeId: string,
  ): Observable<{ success: boolean; data: RentalOwnerSummary }> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<{ success: boolean; data: RentalOwnerSummary }>(
      `${this.baseUrl}/summary`,
      { params },
    );
  }

  uploadCoverPhoto(ownerId: string, file: File): Observable<{ success: boolean; photo: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; photo: string }>(
      `${this.baseUrl}/upload/${ownerId}/cover`,
      formData,
    );
  }

  uploadAttachments(ownerId: string, files: File[]): Observable<{ success: boolean; attachments: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http.post<{ success: boolean; attachments: string[] }>(
      `${this.baseUrl}/upload/${ownerId}/attachments`,
      formData,
    );
  }
}
