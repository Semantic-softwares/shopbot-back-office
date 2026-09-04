import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Table } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getStoreTables(storeId: string): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.baseUrl}/tables/store/${storeId}`);
  }

  createTable(table: Partial<Table>): Observable<Table> {
    return this.http.post<Table>(`${this.baseUrl}/tables`, table);
  }

  updateTable(tableId: string, table: Partial<Table>): Observable<Table> {
    return this.http.put<Table>(`${this.baseUrl}/tables/${tableId}`, table);
  }

  deleteTable(tableId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tables/${tableId}`);
  }

  getTableById(tableId: string): Observable<Table> {
    return this.http.get<Table>(`${this.baseUrl}/tables/${tableId}`);
  }

  getTableQrCode(tableId: string): Observable<{ qrDataUrl: string; url: string }> {
    return this.http.get<{ qrDataUrl: string; url: string }>(`${this.baseUrl}/tables/${tableId}/qr-code`);
  }

  /**
   * Issues a new link for a table and invalidates the old one — every card
   * already printed for it stops working. Deliberately separate from the
   * print calls, which never change the link. Confirm with the user first.
   */
  resetTableQrToken(tableId: string): Observable<{ qrDataUrl: string; url: string }> {
    return this.http.post<{ qrDataUrl: string; url: string }>(
      `${this.baseUrl}/tables/${tableId}/qr-token/reset`,
      {},
    );
  }

  /**
   * Streams a freshly rendered PDF. POST (not GET) because the render takes a
   * template/size/language body, and a blob (not a Cloudinary URL) because the
   * server no longer caches these — see TableQrService on the backend for why.
   * Omitted options fall back to the store's saved QR card defaults.
   */
  getTableQrPdf(tableId: string, options: QrRenderOptions = {}): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/tables/${tableId}/qr-pdf`, options, {
      responseType: 'blob',
    });
  }

  getStoreTablesQrPdf(storeId: string, options: QrRenderOptions = {}): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/tables/store/${storeId}/qr-pdf`, options, {
      responseType: 'blob',
    });
  }
}

export interface QrRenderOptions {
  templateSlug?: string;
  size?: string;
  language?: string;
}

/**
 * Triggers a browser download for a rendered PDF blob. Shared by the single
 * and bulk QR exports so both behave identically, and so the object URL is
 * always revoked (a leaked one pins the whole PDF in memory).
 */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
