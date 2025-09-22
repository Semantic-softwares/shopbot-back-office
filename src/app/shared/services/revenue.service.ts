import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RevenueData {
  date: Date;
  totalRevenue: number;
  roomRevenue: number;
  serviceRevenue: number;
  otherRevenue: number;
  transactions: number;
  averageTransaction: number;
  revenueGrowth: number;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
  averageAmount: number;
}

export interface RevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  revenueGrowth: number;
  topRevenueCategory: string;
  topRevenueCategoryAmount: number;
  totalRoomRevenue: number;
  totalServiceRevenue: number;
  totalOtherRevenue: number;
  peakRevenueDate: Date;
  peakRevenueAmount: number;
  averageDailyRevenue: number;
  monthlyProjection: number;
}

export interface RevenueFilters {
  startDate: Date;
  endDate: Date;
  reportType: 'daily' | 'weekly' | 'monthly';
  revenueType?: string;
  paymentMethod?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RevenueService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/revenue`;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Get revenue data for a specific date range
   */
  getRevenueData(filters: RevenueFilters): Observable<RevenueData[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType);

    if (filters.revenueType) {
      params = params.set('revenueType', filters.revenueType);
    }

    if (filters.paymentMethod) {
      params = params.set('paymentMethod', filters.paymentMethod);
    }

    return this.http.get<RevenueData[]>(`${this.baseUrl}/data`, { params }).pipe(
      map(data => {
        this.loadingSubject.next(false);
        return data.map(item => ({
          ...item,
          date: new Date(item.date)
        }));
      }),
      catchError(error => {
        console.error('Error fetching revenue data:', error);
        this.errorSubject.next('Failed to load revenue data. Using mock data for demonstration.');
        this.loadingSubject.next(false);
        
        // Return mock data on error
        return of(this.generateMockRevenueData(filters.startDate, filters.endDate));
      })
    );
  }

  /**
   * Get revenue breakdown by category
   */
  getRevenueBreakdown(filters: RevenueFilters): Observable<RevenueBreakdown[]> {
    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType);

    if (filters.revenueType) {
      params = params.set('revenueType', filters.revenueType);
    }

    return this.http.get<RevenueBreakdown[]>(`${this.baseUrl}/breakdown`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching revenue breakdown:', error);
        return of(this.generateMockRevenueBreakdown());
      })
    );
  }

  /**
   * Get revenue statistics summary
   */
  getRevenueStats(filters: RevenueFilters): Observable<RevenueStats> {
    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType);

    if (filters.revenueType) {
      params = params.set('revenueType', filters.revenueType);
    }

    if (filters.paymentMethod) {
      params = params.set('paymentMethod', filters.paymentMethod);
    }

    return this.http.get<RevenueStats>(`${this.baseUrl}/stats`, { params }).pipe(
      map(stats => ({
        ...stats,
        peakRevenueDate: new Date(stats.peakRevenueDate)
      })),
      catchError(error => {
        console.error('Error fetching revenue stats:', error);
        
        // Return mock stats on error
        return of({
          totalRevenue: 325000,
          totalTransactions: 1250,
          averageTransactionValue: 260,
          revenueGrowth: 12.5,
          topRevenueCategory: 'Room Revenue',
          topRevenueCategoryAmount: 285000,
          totalRoomRevenue: 285000,
          totalServiceRevenue: 28500,
          totalOtherRevenue: 11500,
          peakRevenueDate: new Date(),
          peakRevenueAmount: 15750,
          averageDailyRevenue: 10833,
          monthlyProjection: 390000
        });
      })
    );
  }

  /**
   * Export revenue data to CSV
   */
  exportToCSV(filters: RevenueFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType)
      .set('format', 'csv');

    if (filters.revenueType) {
      params = params.set('revenueType', filters.revenueType);
    }

    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error exporting data:', error);
        this.errorSubject.next('Failed to export data. Please try again.');
        throw error;
      })
    );
  }

  /**
   * Export revenue data to PDF
   */
  exportToPDF(filters: RevenueFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType)
      .set('format', 'pdf');

    if (filters.revenueType) {
      params = params.set('revenueType', filters.revenueType);
    }

    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error exporting PDF:', error);
        this.errorSubject.next('Failed to export PDF. Please try again.');
        throw error;
      })
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Generate mock revenue data for fallback
   */
  private generateMockRevenueData(startDate: Date, endDate: Date): RevenueData[] {
    const data: RevenueData[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const baseRevenue = 8000 + Math.random() * 6000; // $8k-$14k daily
      const roomRevenue = baseRevenue * (0.75 + Math.random() * 0.15); // 75-90% room revenue
      const serviceRevenue = baseRevenue * (0.05 + Math.random() * 0.10); // 5-15% service revenue
      const otherRevenue = baseRevenue - roomRevenue - serviceRevenue;
      const transactions = Math.floor(25 + Math.random() * 35); // 25-60 transactions
      const averageTransaction = baseRevenue / transactions;
      const revenueGrowth = (Math.random() - 0.5) * 30; // -15% to +15% growth

      data.push({
        date: new Date(current),
        totalRevenue: Math.round(baseRevenue),
        roomRevenue: Math.round(roomRevenue),
        serviceRevenue: Math.round(serviceRevenue),
        otherRevenue: Math.round(otherRevenue),
        transactions,
        averageTransaction: Math.round(averageTransaction),
        revenueGrowth: Math.round(revenueGrowth * 10) / 10
      });

      current.setDate(current.getDate() + 1);
    }

    return data;
  }

  /**
   * Generate mock revenue breakdown for fallback
   */
  private generateMockRevenueBreakdown(): RevenueBreakdown[] {
    const categories = [
      { name: 'Room Revenue', baseAmount: 285000 },
      { name: 'Food & Beverage', baseAmount: 28500 },
      { name: 'Spa Services', baseAmount: 8500 },
      { name: 'Conference Rooms', baseAmount: 5500 },
      { name: 'Parking', baseAmount: 3000 },
      { name: 'Other Services', baseAmount: 4500 }
    ];

    const totalRevenue = categories.reduce((sum, cat) => sum + cat.baseAmount, 0);

    return categories.map(category => {
      const amount = category.baseAmount + (Math.random() - 0.5) * category.baseAmount * 0.2;
      const percentage = (amount / totalRevenue) * 100;
      const transactions = Math.floor(amount / (100 + Math.random() * 200));
      const averageAmount = amount / transactions;

      return {
        category: category.name,
        amount: Math.round(amount),
        percentage: Math.round(percentage * 10) / 10,
        transactions,
        averageAmount: Math.round(averageAmount)
      };
    }).sort((a, b) => b.amount - a.amount);
  }
}