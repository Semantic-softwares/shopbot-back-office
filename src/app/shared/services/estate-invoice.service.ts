import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EstateInvoice,
  InvoiceFilters,
  InvoiceSummary,
  PaginatedResponse,
  ApiResponse,
  CreateManualInvoiceRequest,
} from '../models/estate.model';

@Injectable({ providedIn: 'root' })
export class EstateInvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate`;

  getInvoices(
    storeId: string,
    filters: InvoiceFilters = {},
  ): Observable<PaginatedResponse<EstateInvoice>> {
    let params = new HttpParams().set('storeId', storeId);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.leaseId) params = params.set('leaseId', filters.leaseId);
    if (filters.propertyId) params = params.set('propertyId', filters.propertyId);
    if (filters.unitId) params = params.set('unitId', filters.unitId);
    if (filters.tenantId) params = params.set('tenantId', filters.tenantId);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dueDateFrom) params = params.set('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params = params.set('dueDateTo', filters.dueDateTo);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<EstateInvoice>>(
      `${this.baseUrl}/invoices`,
      { params },
    );
  }

  getInvoiceById(id: string): Observable<ApiResponse<EstateInvoice>> {
    return this.http.get<ApiResponse<EstateInvoice>>(
      `${this.baseUrl}/invoices/${id}`,
    );
  }

  createManualInvoice(
    data: CreateManualInvoiceRequest,
  ): Observable<ApiResponse<EstateInvoice>> {
    return this.http.post<ApiResponse<EstateInvoice>>(
      `${this.baseUrl}/invoices`,
      data,
    );
  }

  exportInvoiceToPDF(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${id}/export/pdf`, {
      responseType: 'blob',
    });
  }

  getLeaseInvoices(
    leaseId: string,
    filters: InvoiceFilters = {},
  ): Observable<PaginatedResponse<EstateInvoice>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<EstateInvoice>>(
      `${this.baseUrl}/leases/${leaseId}/invoices`,
      { params },
    );
  }

  getSummary(
    storeId: string,
  ): Observable<{ success: boolean; data: InvoiceSummary }> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<{ success: boolean; data: InvoiceSummary }>(
      `${this.baseUrl}/invoices/summary`,
      { params },
    );
  }

  generateMissingInvoices(
    leaseId: string,
    storeId: string,
  ): Observable<{ success: boolean; message: string }> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/leases/${leaseId}/generate-missing-invoices`,
      {},
      { params },
    );
  }

  voidInvoice(id: string): Observable<ApiResponse<EstateInvoice>> {
    return this.http.patch<ApiResponse<EstateInvoice>>(
      `${this.baseUrl}/invoices/${id}/void`,
      {},
    );
  }

  unvoidInvoice(id: string): Observable<ApiResponse<EstateInvoice>> {
    return this.http.patch<ApiResponse<EstateInvoice>>(
      `${this.baseUrl}/invoices/${id}/unvoid`,
      {},
    );
  }

  deleteInvoice(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/invoices/${id}`,
    );
  }
}
