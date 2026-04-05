import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  Receipt,
  ReceiptFilters,
} from '../models/estate.model';

@Injectable({ providedIn: 'root' })
export class ReceiptApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/estate`;

  getReceipts(
    storeId: string,
    filters: ReceiptFilters = {},
  ): Observable<PaginatedResponse<Receipt>> {
    let params = new HttpParams().set('storeId', storeId);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.leaseId) params = params.set('leaseId', filters.leaseId);
    if (filters.tenantId) params = params.set('tenantId', filters.tenantId);
    if (filters.paymentId) params = params.set('paymentId', filters.paymentId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.paymentMethod) {
      params = params.set('paymentMethod', filters.paymentMethod);
    }
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<Receipt>>(`${this.baseUrl}/receipts`, {
      params,
    });
  }

  getReceiptById(id: string): Observable<ApiResponse<Receipt>> {
    return this.http.get<ApiResponse<Receipt>>(`${this.baseUrl}/receipts/${id}`);
  }

  exportReceiptToPDF(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/receipts/${id}/export/pdf`, {
      responseType: 'blob',
    });
  }

  getReceiptByPaymentId(paymentId: string): Observable<ApiResponse<Receipt>> {
    return this.http.get<ApiResponse<Receipt>>(
      `${this.baseUrl}/payments/${paymentId}/receipt`,
    );
  }
}
