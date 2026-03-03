import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MessageThread {
  id: string;
  title: string;
  is_closed: boolean;
  provider: string;
  message_count: number;
  last_message: {
    message?: string;
    attachments: any[];
    inserted_at: string;
    sender: 'guest' | 'property';
  };
  last_message_received_at: string;
  inserted_at: string;
  updated_at: string;
  ota_message_thread_id?: string;
  type?: string;
  relationships?: any;
}

export interface Message {
  id?: string;
  message?: string;
  attachments: any[];
  sender: 'guest' | 'property';
  inserted_at: string;
  updated_at?: string;
  type?: string;
  attachment_urls?: string[];
  /** Local-only status for optimistic UI updates */
  _status?: 'sending' | 'sent' | 'failed';
  /** Temporary local ID used to match optimistic messages with API responses */
  _tempId?: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  order_by?: string;
  order_direction?: string;
}

export interface MessageThreadResponse {
  success: boolean;
  data: any;
  meta?: PaginationMeta;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get all message threads for a store
   */
  getMessageThreads(storeId: string): Observable<MessageThreadResponse> {
    return this.http.get<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}`,
    );
  }

  /**
   * Get specific message thread
   */
  getMessageThread(storeId: string, threadId: string): Observable<MessageThreadResponse> {
    return this.http.get<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}/${threadId}`,
    );
  }

  /**
   * Get messages within a thread with pagination support
   */
  getThreadMessages(
    storeId: string,
    threadId: string,
    page: number = 1,
    limit: number = 50,
  ): Observable<MessageThreadResponse> {
    return this.http.get<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}/${threadId}/messages?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Send message to thread
   */
  sendMessageToThread(
    storeId: string,
    threadId: string,
    message: string,
  ): Observable<MessageThreadResponse> {
    return this.http.post<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}/${threadId}/messages`,
      { message },
    );
  }

  /**
   * Close message thread
   */
  closeThread(storeId: string, threadId: string): Observable<MessageThreadResponse> {
    return this.http.post<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}/${threadId}/close`,
      {},
    );
  }

  /**
   * Mark thread as no reply needed (Booking.com only)
   */
  markNoReplyNeeded(
    storeId: string,
    threadId: string,
  ): Observable<MessageThreadResponse> {
    return this.http.post<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}/${threadId}/no-reply-needed`,
      {},
    );
  }

  /**
   * Upload attachment
   */
  uploadAttachment(
    file: string,
    fileName: string,
    fileType: string,
  ): Observable<MessageThreadResponse> {
    return this.http.post<MessageThreadResponse>(
      `${this.apiUrl}/messaging/attachments`,
      { file, fileName, fileType },
    );
  }

  /**
   * Send attachment to thread
   */
  sendAttachmentToThread(
    storeId: string,
    threadId: string,
    attachmentId: string,
    message?: string,
  ): Observable<MessageThreadResponse> {
    return this.http.post<MessageThreadResponse>(
      `${this.apiUrl}/messaging/threads/${storeId}/${threadId}/attachments`,
      { attachmentId, message },
    );
  }
}
