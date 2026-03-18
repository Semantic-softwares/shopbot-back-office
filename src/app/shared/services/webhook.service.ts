import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface WebhookEvent {
  id: string;
  title?: string;
}

export interface Webhook {
  id?: string;
  type?: string;
  url?: string;
  events?: WebhookEvent[];
  property_id?: string;
  is_active?: boolean;
  send_data?: boolean;
  headers?: any;
  request_params?: any;
  created_at?: string;
  updated_at?: string;
  // Channex API response structure
  attributes?: {
    id: string;
    callback_url: string;
    event_mask: string;
    is_active: boolean;
    protected: boolean;
    send_data: boolean;
    headers: any;
    request_params: any;
  };
  relationships?: {
    property?: { data: { id: string; type: string } };
    billing_account?: { data: { id: string; type: string } };
    organization?: { data: { id: string; type: string } };
  };
}

export interface WebhookResponse {
  data: Webhook[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebhookService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get all webhooks for a property with pagination
   * Calls backend endpoint: GET /admin/channex/webhooks?propertyId={id}&page={page}&limit={limit}&search={search}
   */
  getWebhooks(propertyId: string, page: number = 1, limit: number = 10, search?: string): Observable<WebhookResponse> {
    let url = `${this.apiUrl}/admin/channex/webhooks?propertyId=${propertyId}&page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<WebhookResponse>(url);
  }

  /**
   * Get webhook by ID
   * Calls backend endpoint: GET /admin/channex/webhooks/:webhookId?propertyId={id}
   */
  getWebhook(webhookId: string, propertyId: string): Observable<{ data: Webhook }> {
    return this.http.get<{ data: Webhook }>(
      `${this.apiUrl}/admin/channex/webhooks/${webhookId}?propertyId=${propertyId}`
    );
  }

  /**
   * Create new webhook
   * Calls backend endpoint: POST /admin/channex/webhooks
   */
  createWebhook(webhook: Webhook): Observable<{ data: Webhook }> {
    // Transform property_id to propertyId for backend
    const payload = this.transformWebhookPayload(webhook);
    return this.http.post<{ data: Webhook }>(
      `${this.apiUrl}/admin/channex/webhooks`,
      payload
    );
  }

  /**
   * Update webhook
   * Calls backend endpoint: PATCH /admin/channex/webhooks/:webhookId
   */
  updateWebhook(webhookId: string, webhook: Partial<Webhook>): Observable<{ data: Webhook }> {
    // Transform property_id to propertyId for backend
    const payload = this.transformWebhookPayload(webhook);
    return this.http.patch<{ data: Webhook }>(
      `${this.apiUrl}/admin/channex/webhooks/${webhookId}`,
      payload
    );
  }

  /**
   * Delete webhook
   * Calls backend endpoint: DELETE /admin/channex/webhooks/:webhookId
   */
  deleteWebhook(webhookId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/admin/channex/webhooks/${webhookId}`
    );
  }

  /**
   * Get available webhook events from Channex
   * Calls backend endpoint: GET /admin/channex/webhook-events
   * Response format: { success: true, data: { events: ["event_name", ...] } }
   */
  getAvailableEvents(): Observable<{ data: WebhookEvent[] }> {
    return this.http.get<any>(
      `${this.apiUrl}/admin/channex/webhook-events`
    ).pipe(
      // Transform the response to match WebhookEvent[] format
      map((response: any) => {
        const events = response.data?.events || [];
        const webhookEvents: WebhookEvent[] = events.map((eventId: string) => ({
          id: eventId,
          title: this.formatEventTitle(eventId),
        }));
        return { data: webhookEvents };
      })
    );
  }

  /**
   * Format event ID to readable title
   * Converts snake_case to Title Case
   */
  private formatEventTitle(eventId: string): string {
    return eventId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Transform webhook payload for backend
   * Converts frontend format to backend format expected by Channex API:
   * - property_id -> propertyId (camelCase for backend processing)
   * - url -> passed as-is (backend converts to callback_url)
   * - events -> passed as-is (backend converts to event_mask)
   * - headers -> passed as-is (backend includes in webhook payload)
   * - request_params -> passed as-is (backend includes in webhook payload)
   */
  private transformWebhookPayload(webhook: Webhook | Partial<Webhook>): any {
    const { property_id, url, events, is_active, headers, request_params, ...rest } = webhook as any;
    return {
      propertyId: property_id,
      url,
      events,
      is_active,
      headers: headers,
      request_params: request_params,
    };
  }
}
