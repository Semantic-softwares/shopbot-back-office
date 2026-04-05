import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreatePaymentRequest,
  EstatePayment,
  EstatePaymentMethod,
  PaginatedResponse,
  PaymentStatus,
} from '../models/estate.model';

export interface PaymentFilters {
  page?: number;
  limit?: number;
  leaseId?: string;
  tenantId?: string;
  status?: PaymentStatus;
  paymentMethod?: EstatePaymentMethod;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class EstatePaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/estate/payments`;

  createPayment(data: CreatePaymentRequest): Observable<ApiResponse<EstatePayment>> {
    return this.http.post<ApiResponse<EstatePayment>>(this.baseUrl, data);
  }

  listPayments(
    storeId: string,
    filters: PaymentFilters = {},
  ): Observable<PaginatedResponse<EstatePayment>> {
    const params = new URLSearchParams({ storeId });
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.leaseId) params.set('leaseId', filters.leaseId);
    if (filters.tenantId) params.set('tenantId', filters.tenantId);
    if (filters.status) params.set('status', filters.status);
    if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
    if (filters.paymentDateFrom) params.set('paymentDateFrom', filters.paymentDateFrom);
    if (filters.paymentDateTo) params.set('paymentDateTo', filters.paymentDateTo);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<EstatePayment>>(`${this.baseUrl}?${params.toString()}`);
  }

  getPaymentById(id: string): Observable<ApiResponse<EstatePayment>> {
    return this.http.get<ApiResponse<EstatePayment>>(`${this.baseUrl}/${id}`);
  }

  getPaymentsForInvoice(
    invoiceId: string,
    storeId: string,
  ): Observable<{ success: boolean; data: Array<{ payment: EstatePayment; allocatedAmount: number; allocationDate: string }> }> {
    return this.http.get<{ success: boolean; data: Array<{ payment: EstatePayment; allocatedAmount: number; allocationDate: string }> }>(
      `${this.baseUrl}/invoice/${invoiceId}?storeId=${storeId}`,
    );
  }
}
