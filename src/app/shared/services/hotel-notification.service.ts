import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HotelNotification {
  _id: string;
  store: string;
  eventType: string;
  title: string;
  body: string;
  source: 'channex' | 'system' | 'manual';
  referenceId?: string;
  referenceType?: string;
  payload?: any;
  channexPropertyId?: string;
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  emailSent: boolean;
  emailSentAt?: string;
  emailRecipient?: string;
  socketEmitted: boolean;
  socketEmittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelNotificationResponse {
  success: boolean;
  data: HotelNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationQueryParams {
  eventType?: string;
  isRead?: boolean;
  source?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class HotelNotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get notifications for a store with optional filters
   */
  getNotifications(storeId: string, params: NotificationQueryParams = {}): Observable<HotelNotificationResponse> {
    const queryParts: string[] = [];
    if (params.eventType) queryParts.push(`eventType=${params.eventType}`);
    if (params.isRead !== undefined) queryParts.push(`isRead=${params.isRead}`);
    if (params.source) queryParts.push(`source=${params.source}`);
    if (params.startDate) queryParts.push(`startDate=${params.startDate}`);
    if (params.endDate) queryParts.push(`endDate=${params.endDate}`);
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);

    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return this.http.get<HotelNotificationResponse>(
      `${this.apiUrl}/hotel-notifications/${storeId}${query}`,
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(storeId: string, eventType?: string): Observable<UnreadCountResponse> {
    const query = eventType ? `?eventType=${eventType}` : '';
    return this.http.get<UnreadCountResponse>(
      `${this.apiUrl}/hotel-notifications/${storeId}/unread-count${query}`,
    );
  }

  /**
   * Mark a single notification as read
   */
  markAsRead(notificationId: string, userId?: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/hotel-notifications/${notificationId}/read`,
      { userId },
    );
  }

  /**
   * Mark all notifications as read for a store
   */
  markAllAsRead(storeId: string, userId?: string, eventType?: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/hotel-notifications/${storeId}/read-all`,
      { userId, eventType },
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/hotel-notifications/${notificationId}`,
    );
  }
}
