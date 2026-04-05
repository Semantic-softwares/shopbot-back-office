import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InvoiceCategory,
  InvoiceCategoryListResponse,
  CreateInvoiceCategoryParams,
  UpdateInvoiceCategoryParams,
  ListInvoiceCategoriesParams,
} from '../models/invoice-category.model';

@Injectable({
  providedIn: 'root',
})
export class InvoiceCategoryApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/estate/invoice-categories`;

  list(params?: ListInvoiceCategoriesParams): Observable<{ success: boolean; data: InvoiceCategoryListResponse }> {
    let url = this.baseUrl;
    const queryParams = new URLSearchParams();

    if (params?.side) queryParams.append('side', params.side);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.isSystem !== undefined) queryParams.append('isSystem', String(params.isSystem));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    return this.http.get<{ success: boolean; data: InvoiceCategoryListResponse }>(url);
  }

  getActive(): Observable<{ success: boolean; data: InvoiceCategory[] }> {
    return this.http.get<{ success: boolean; data: InvoiceCategory[] }>(
      `${this.baseUrl}/active`,
    );
  }

  getById(id: string): Observable<{ success: boolean; data: InvoiceCategory }> {
    return this.http.get<{ success: boolean; data: InvoiceCategory }>(
      `${this.baseUrl}/${id}`,
    );
  }

  create(
    params: CreateInvoiceCategoryParams,
  ): Observable<{ success: boolean; message: string; data: InvoiceCategory }> {
    return this.http.post<{ success: boolean; message: string; data: InvoiceCategory }>(
      this.baseUrl,
      params,
    );
  }

  update(
    id: string,
    params: UpdateInvoiceCategoryParams,
  ): Observable<{ success: boolean; message: string; data: InvoiceCategory }> {
    return this.http.patch<{ success: boolean; message: string; data: InvoiceCategory }>(
      `${this.baseUrl}/${id}`,
      params,
    );
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`,
    );
  }

  /**
   * Get active categories for use in dropdowns/selects
   */
  getActiveForSelection(): Observable<InvoiceCategory[]> {
    return this.http.get<any>(`${this.baseUrl}/active`).pipe(
      // Extract the data array from response
    ) as Observable<InvoiceCategory[]>;
  }
}
