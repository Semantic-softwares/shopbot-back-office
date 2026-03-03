import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PrinterConnection {
  ip?: string;
  port?: number;
  deviceName?: string;
  vendorId?: number;
  productId?: number;
  macAddress?: string;
  channel?: number;
}

export interface PrinterCapabilities {
  paperWidth: 58 | 80;
  supportsQr: boolean;
  supportsLogo: boolean;
  supportsCut: boolean;
}

export interface Printer {
  _id?: string;
  name: string;
  store: string;
  connectionType: 'network' | 'usb-os' | 'usb-raw' | 'bluetooth';
  connection: PrinterConnection;
  role: 'station' | 'master' | 'backup';
  capabilities: PrinterCapabilities;
  status: 'online' | 'offline' | 'unknown';
  lastSeenAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  private apiUrl = environment.apiUrl + '/printers';

  constructor(private http: HttpClient) {}

  create(printer: Printer): Observable<Printer> {
    return this.http.post<Printer>(this.apiUrl, printer);
  }

  findAll(storeId?: string): Observable<Printer[]> {
    const params = storeId ? `?storeId=${storeId}` : '';
    return this.http.get<Printer[]>(`${this.apiUrl}${params}`);
  }

  findByStore(storeId: string): Observable<Printer[]> {
    return this.http.get<Printer[]>(`${this.apiUrl}/store/${storeId}`);
  }

  getAvailablePrinters(storeId: string): Observable<Printer[]> {
    return this.http.get<Printer[]>(`${this.apiUrl}/available/${storeId}`);
  }

  findOne(id: string): Observable<Printer> {
    return this.http.get<Printer>(`${this.apiUrl}/${id}`);
  }

  update(id: string, printer: Partial<Printer>): Observable<Printer> {
    return this.http.patch<Printer>(`${this.apiUrl}/${id}`, printer);
  }

  updateStatus(id: string, status: 'online' | 'offline' | 'unknown'): Observable<Printer> {
    return this.http.patch<Printer>(`${this.apiUrl}/${id}/status`, { status });
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
