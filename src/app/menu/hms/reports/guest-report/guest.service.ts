import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toDateOnly } from '../../../../shared/utils/date-only';

export interface GuestData {
  date: string;
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  checkIns: number;
  checkOuts: number;
  averageStayDuration: number;
  occupancyRate: number;
  guestGrowth: number;
}

export interface GuestStats {
  totalGuests: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  averageStayDuration: number;
  occupancyRate: number;
  guestGrowth: number;
  newGuestsPercentage: number;
  returningGuestsPercentage: number;
  peakOccupancyDate: string;
  monthlyProjection: number;
}

export interface GuestBreakdown {
  category: string;
  value: number;
  percentage: number;
  totalSpent?: number;
  averageStayDuration?: number;
  averageStay?: number;
  averageDuration?: number;
  averageSpent?: number;
}

export interface GuestFilters {
  startDate: Date | string;
  endDate: Date | string;
  reportType: 'daily' | 'weekly' | 'monthly';
  guestType?: string;
  /** Room type id. */
  roomType?: string;
}

/** Loads the guest-movement report. A failure is an error for the screen to show, never invented numbers. */
@Injectable({ providedIn: 'root' })
export class GuestService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/guests`;

  private params(storeId: string, filters: GuestFilters) {
    return {
      storeId,
      startDate: toDateOnly(filters.startDate),
      endDate: toDateOnly(filters.endDate),
      reportType: filters.reportType,
      ...(filters.guestType && { guestType: filters.guestType }),
      ...(filters.roomType && { roomType: filters.roomType }),
    };
  }

  getGuestData(storeId: string, filters: GuestFilters): Observable<GuestData[]> {
    return this.http.get<GuestData[]>(`${this.apiUrl}/data`, { params: this.params(storeId, filters) });
  }

  getGuestBreakdown(storeId: string, filters: GuestFilters): Observable<GuestBreakdown[]> {
    return this.http.get<GuestBreakdown[]>(`${this.apiUrl}/breakdown`, { params: this.params(storeId, filters) });
  }

  getGuestStats(storeId: string, filters: GuestFilters): Observable<GuestStats> {
    return this.http.get<GuestStats>(`${this.apiUrl}/stats`, { params: this.params(storeId, filters) });
  }

  exportToCSV(storeId: string, filters: GuestFilters): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, { params: this.params(storeId, filters), responseType: 'blob' });
  }
}
