import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkPrinterService {
  private http = inject(HttpClient);
  private networkPrinterUrl = 'http://localhost:4001/api';

  /**
   * Send receipt data to network printer
   * @param receiptData - ESC/POS formatted receipt data (string)
   * @param printerId - Optional printer ID to send to specific printer
   * @param orderId - Order ID for logging
   * @param orderRef - Order reference for logging
   * @returns Observable with job ID
   */
  sendToPrinter(
    receiptData: string,
    printerId?: string,
    orderId?: string,
    orderRef?: string
  ): Observable<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Convert receipt data to base64 for transmission
      const base64Data = btoa(receiptData);

      const payload = {
        data: base64Data,
        printerId: printerId || null,
        orderId: orderId || 'unknown',
        orderRef: orderRef || 'N/A',
      };

      return this.http.post<{ success: boolean; jobId?: string; error?: string }>(
        `${this.networkPrinterUrl}/print`,
        payload
      );
    } catch (error: any) {
      console.error('❌ [NETWORK PRINTER] Error preparing data:', error);
      throw error;
    }
  }

  /**
   * Get all available network printers
   */
  getPrinters(): Observable<any[]> {
    return this.http.get<any[]>(`${this.networkPrinterUrl}/printers`);
  }

  /**
   * Test connection to a specific printer
   */
  testPrinter(ip: string, port: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.networkPrinterUrl}/printers/test`,
      { ip, port }
    );
  }

  /**
   * Add a new network printer
   */
  addPrinter(
    name: string,
    ip: string,
    port: number
  ): Observable<{ success: boolean; printerId?: string }> {
    return this.http.post<{ success: boolean; printerId?: string }>(
      `${this.networkPrinterUrl}/printers/add`,
      { name, ip, port }
    );
  }

  /**
   * Remove a network printer
   */
  removePrinter(printerId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.networkPrinterUrl}/printers/${printerId}`
    );
  }

  /**
   * Get print job logs
   */
  getPrintLogs(limit: number = 100): Observable<any[]> {
    return this.http.get<any[]>(`${this.networkPrinterUrl}/logs?limit=${limit}`);
  }

  /**
   * Clear print logs
   */
  clearLogs(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.networkPrinterUrl}/logs`);
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): Observable<{
    total: number;
    pending: number;
    success: number;
    failed: number;
    successRate: number;
  }> {
    return this.http.get<{
      total: number;
      pending: number;
      success: number;
      failed: number;
      successRate: number;
    }>(`${this.networkPrinterUrl}/queue/stats`);
  }

  /**
   * Discover USB printers connected to the system
   */
  discoverUSBPrinters(): Observable<{ success: boolean; discovered: number; printers: any[] }> {
    return this.http.post<{ success: boolean; discovered: number; printers: any[] }>(
      `${this.networkPrinterUrl}/printers/usb/discover`,
      {}
    );
  }
}
