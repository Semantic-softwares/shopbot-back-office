import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  LedgerEntryView,
  LedgerQueryFilters,
  LedgerResponse,
} from '../models/estate.model';

@Injectable({ providedIn: 'root' })
export class LedgerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/estate`;

  getGlobalLedger(
    storeId: string,
    filters: LedgerQueryFilters = {},
  ): Observable<ApiResponse<LedgerResponse<LedgerEntryView>>> {
    let params = new HttpParams().set('storeId', storeId);
    if (filters.tenantId) params = params.set('tenantId', filters.tenantId);
    if (filters.propertyId) params = params.set('propertyId', filters.propertyId);
    if (filters.leaseId) params = params.set('leaseId', filters.leaseId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.includeVoids !== undefined) {
      params = params.set('includeVoids', String(filters.includeVoids));
    }
    if (filters.includeReversals !== undefined) {
      params = params.set('includeReversals', String(filters.includeReversals));
    }

    return this.http.get<ApiResponse<LedgerResponse<LedgerEntryView>>>(
      `${this.baseUrl}/ledger`,
      { params },
    );
  }

  getLeaseLedger(
    leaseId: string,
    storeId: string,
    filters: LedgerQueryFilters = {},
  ): Observable<ApiResponse<LedgerResponse<LedgerEntryView>>> {
    let params = new HttpParams().set('storeId', storeId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.includeVoids !== undefined) {
      params = params.set('includeVoids', String(filters.includeVoids));
    }
    if (filters.includeReversals !== undefined) {
      params = params.set('includeReversals', String(filters.includeReversals));
    }

    return this.http.get<ApiResponse<LedgerResponse<LedgerEntryView>>>(
      `${this.baseUrl}/leases/${leaseId}/ledger`,
      { params },
    );
  }

  getTenantLedger(
    tenantId: string,
    storeId: string,
    filters: LedgerQueryFilters = {},
  ): Observable<ApiResponse<LedgerResponse<LedgerEntryView>>> {
    let params = new HttpParams().set('storeId', storeId);
    if (filters.leaseId) params = params.set('leaseId', filters.leaseId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.includeVoids !== undefined) {
      params = params.set('includeVoids', String(filters.includeVoids));
    }
    if (filters.includeReversals !== undefined) {
      params = params.set('includeReversals', String(filters.includeReversals));
    }

    return this.http.get<ApiResponse<LedgerResponse<LedgerEntryView>>>(
      `${this.baseUrl}/tenants/${tenantId}/ledger`,
      { params },
    );
  }
}
