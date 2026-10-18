import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CorrectionStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CorrectionEvent {
  type: string;
  by?: { _id: string; name?: string; firstName?: string; lastName?: string } | string;
  at: string;
  note?: string;
}

export interface HistoricalCorrection {
  _id: string;
  reservation: string;
  confirmationNumber?: string;
  affectedBusinessDates: string[];
  originalAuditIds: string[];
  reason: string;
  status: CorrectionStatus;
  live: boolean;
  financialImpact: { room: number; tax: number; fee: number; total: number; nights: number; byNight?: Array<{ night: string; total: number }> };
  createdBy?: { _id: string; name?: string; firstName?: string; lastName?: string } | string;
  approvedBy?: { _id: string; name?: string; firstName?: string; lastName?: string } | string;
  approvedAt?: string;
  rejectedReason?: string;
  completedAt?: string;
  failure?: string;
  attempts?: number;
  createdAt: string;
  events?: CorrectionEvent[];
}

export interface BackdatingPreview {
  businessDate: string;
  today: string;
  auditEnabled: boolean;
  isBackdated: boolean;
  pastNights: string[];
  closedNights: string[];
  openPastNights: string[];
  approvalLikely: boolean;
  canBackdate: boolean;
}

/** Stays entered on days night audit has closed: what a date range means, the cases raised for it, and their approval. */
@Injectable({ providedIn: 'root' })
export class HistoricalCorrectionService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/historical-corrections`;

  preview(storeId: string, params: { checkIn: string; checkOut: string; status?: string }): Observable<BackdatingPreview> {
    let p = new HttpParams().set('checkIn', params.checkIn).set('checkOut', params.checkOut);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<BackdatingPreview>(`${this.base(storeId)}/preview`, { params: p });
  }

  list(storeId: string, q: { status?: string; page?: number; limit?: number } = {}): Observable<{ rows: HistoricalCorrection[]; total: number; page: number; limit: number }> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '' && v !== 'all') p = p.set(k, String(v));
    return this.http.get<{ rows: HistoricalCorrection[]; total: number; page: number; limit: number }>(this.base(storeId), { params: p });
  }

  get(storeId: string, id: string): Observable<HistoricalCorrection> {
    return this.http.get<HistoricalCorrection>(`${this.base(storeId)}/${id}`);
  }

  approve(storeId: string, id: string): Observable<HistoricalCorrection> {
    return this.http.post<HistoricalCorrection>(`${this.base(storeId)}/${id}/approve`, {});
  }

  reject(storeId: string, id: string, reason: string): Observable<HistoricalCorrection> {
    return this.http.post<HistoricalCorrection>(`${this.base(storeId)}/${id}/reject`, { reason });
  }

  retry(storeId: string, id: string): Observable<HistoricalCorrection> {
    return this.http.post<HistoricalCorrection>(`${this.base(storeId)}/${id}/retry`, {});
  }
}
