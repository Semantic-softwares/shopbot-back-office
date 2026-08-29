import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PublicOrderStatus,
  StorefrontMenuSection,
  StorefrontStoreInfo,
  StorefrontTable,
  SubmitOrderResult,
} from './storefront.models';

export interface ResolveBySlugResponse {
  store: StorefrontStoreInfo;
}

export interface ResolveByQrTokenResponse {
  store: StorefrontStoreInfo;
  table: StorefrontTable;
}

export interface SubmitOrderItemOption {
  groupId: string;
  optionItemId: string;
  quantity: number;
}

export interface SubmitOrderItem {
  productId: string;
  quantity: number;
  notes?: string;
  options?: SubmitOrderItemOption[];
}

// Thin wrapper over the public self-order API — no auth header is ever
// attached to these calls (the app's authInterceptor passes requests through
// unmodified when there's no stored token, so this works unattended).
@Injectable({ providedIn: 'root' })
export class StorefrontApiService {
  private readonly baseUrl = `${environment.apiUrl}/self-order`;

  constructor(private readonly http: HttpClient) {}

  resolveBySlug(storeSlug: string): Observable<ResolveBySlugResponse> {
    return this.http.get<ResolveBySlugResponse>(`${this.baseUrl}/stores/slug/${storeSlug}`);
  }

  resolveByQrToken(qrToken: string): Observable<ResolveByQrTokenResponse> {
    return this.http.get<ResolveByQrTokenResponse>(`${this.baseUrl}/resolve/${qrToken}`);
  }

  getMenu(storeId: string): Observable<StorefrontMenuSection[]> {
    return this.http.get<StorefrontMenuSection[]>(`${this.baseUrl}/stores/${storeId}/menu`);
  }

  submitOrder(qrToken: string, items: SubmitOrderItem[], customerName?: string): Observable<SubmitOrderResult> {
    return this.http.post<SubmitOrderResult>(`${this.baseUrl}/tables/${qrToken}/items`, {
      items,
      customerName: customerName || undefined,
    });
  }

  // Initial snapshot for page load/reload — StorefrontSocketService carries
  // live updates from here on.
  getOrderStatus(qrToken: string): Observable<PublicOrderStatus> {
    return this.http.get<PublicOrderStatus>(`${this.baseUrl}/tables/${qrToken}/status`);
  }
}
