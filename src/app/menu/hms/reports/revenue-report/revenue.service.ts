import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toDateOnly } from '../../../../shared/utils/date-only';

export interface RevenueData {
  date: string;
  totalRevenue: number;
  roomRevenue: number;
  serviceRevenue: number;
  otherRevenue: number;
  transactions: number;
  averageTransaction: number;
  revenueGrowth: number;
}

export interface RevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  averageDailyRevenue: number;
  revenueGrowth: number;
  peakRevenueAmount: number;
  monthlyProjection: number;
  /** Taxes collected in the period (reported beside revenue, not inside it). */
  totalTaxes?: number;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
  averageAmount: number;
}

export interface RevenueFilters {
  startDate: Date | string;
  endDate: Date | string;
  reportType: 'daily' | 'weekly' | 'monthly';
  /** room | service | fees */
  revenueType?: string;
  paymentMethod?: string;
}

/** Loads hotel revenue from the server. A failure is an error for the screen to show, never invented numbers. */
@Injectable({ providedIn: 'root' })
export class RevenueService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/revenue`;

  private query(storeId: string, filters: RevenueFilters, extra: Record<string, string> = {}) {
    return {
      params: {
        storeId,
        startDate: toDateOnly(filters.startDate),
        endDate: toDateOnly(filters.endDate),
        reportType: filters.reportType,
        ...(filters.revenueType && { revenueType: filters.revenueType }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...extra,
      },
      headers: { storeid: storeId },
    };
  }

  getRevenueData(storeId: string, filters: RevenueFilters): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/data`, this.query(storeId, filters));
  }

  getRevenueStats(storeId: string, filters: RevenueFilters): Observable<RevenueStats> {
    return this.http.get<RevenueStats>(`${this.apiUrl}/stats`, this.query(storeId, filters));
  }

  getRevenueBreakdown(storeId: string, filters: RevenueFilters): Observable<RevenueBreakdown[]> {
    return this.http.get<RevenueBreakdown[]>(`${this.apiUrl}/breakdown`, this.query(storeId, filters));
  }

  exportToCSV(storeId: string, filters: RevenueFilters): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { ...this.query(storeId, filters, { format: 'csv' }), responseType: 'blob' });
  }
}
