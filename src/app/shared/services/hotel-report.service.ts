import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ReportColumnType = 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'status' | 'boolean';

export interface ReportColumn {
  key: string;
  type: ReportColumnType;
}

export interface ReportKpi {
  key: string;
  value: number;
  type: 'number' | 'currency';
}

export type ReportRow = Record<string, string | number | boolean | null> & { id?: string };

export interface ReportResult {
  report: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  total: number;
  page: number;
  limit: number;
  kpis: ReportKpi[];
  from?: string;
  to?: string;
  generatedAt: string;
  drill?: 'reservation' | 'order' | 'room';
}

export interface ReportParams {
  from?: string;
  to?: string;
  status?: string;
  q?: string;
  roomType?: string;
  page?: number;
  limit?: number;
  /** Everything that matches, for export. */
  all?: boolean;
}

/** Hotel list reports (arrivals, in-house, departures, ...), all in one shape. */
@Injectable({ providedIn: 'root' })
export class HotelReportService {
  private http = inject(HttpClient);

  run(storeId: string, reportId: string, params: ReportParams): Observable<ReportResult> {
    let p = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '' || value === 'all') continue;
      p = p.set(key, key === 'all' ? '1' : String(value));
    }
    // The partner reports live behind the commissions right, on their own endpoint, in the same shape.
    const area = reportId.startsWith('partner-') ? 'partner-reports' : 'hotel-reports';
    return this.http.get<ReportResult>(`${environment.apiUrl}/stores/${storeId}/${area}/${reportId}`, { params: p });
  }
}
