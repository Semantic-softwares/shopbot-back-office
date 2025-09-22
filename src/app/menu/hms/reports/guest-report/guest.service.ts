import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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
  startDate: string;
  endDate: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  guestType?: string;
  roomType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private apiUrl = `${environment.apiUrl}/guests`;

  constructor(private http: HttpClient) {}

  getGuestData(storeId: string, filters: GuestFilters): Observable<GuestData[]> {
    const params = {
      storeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      reportType: filters.reportType,
      ...(filters.guestType && { guestType: filters.guestType }),
      ...(filters.roomType && { roomType: filters.roomType })
    };

    return this.http.get<GuestData[]>(`${this.apiUrl}/data`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching guest data:', error);
        return of(this.getMockGuestData());
      })
    );
  }

  getGuestBreakdown(storeId: string, filters: GuestFilters): Observable<GuestBreakdown[]> {
    const params = {
      storeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      reportType: filters.reportType,
      ...(filters.guestType && { guestType: filters.guestType }),
      ...(filters.roomType && { roomType: filters.roomType })
    };

    return this.http.get<GuestBreakdown[]>(`${this.apiUrl}/breakdown`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching guest breakdown:', error);
        return of(this.getMockGuestBreakdown());
      })
    );
  }

  getGuestStats(storeId: string, filters: GuestFilters): Observable<GuestStats> {
    const params = {
      storeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      reportType: filters.reportType,
      ...(filters.guestType && { guestType: filters.guestType }),
      ...(filters.roomType && { roomType: filters.roomType })
    };

    return this.http.get<GuestStats>(`${this.apiUrl}/stats`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching guest stats:', error);
        return of(this.getMockGuestStats());
      })
    );
  }

  exportToCSV(storeId: string, filters: GuestFilters): Observable<Blob> {
    const params = {
      storeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      reportType: filters.reportType,
      ...(filters.guestType && { guestType: filters.guestType }),
      ...(filters.roomType && { roomType: filters.roomType })
    };

    return this.http.get(`${this.apiUrl}/export/csv`, { 
      params, 
      responseType: 'blob' 
    });
  }

  exportToPDF(storeId: string, filters: GuestFilters): Observable<Blob> {
    const params = {
      storeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      reportType: filters.reportType,
      ...(filters.guestType && { guestType: filters.guestType }),
      ...(filters.roomType && { roomType: filters.roomType })
    };

    return this.http.get(`${this.apiUrl}/export/pdf`, { 
      params, 
      responseType: 'blob' 
    });
  }

  private getMockGuestData(): GuestData[] {
    const data: GuestData[] = [];
    const currentDate = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      const totalGuests = Math.floor(Math.random() * 100) + 50;
      const newGuests = Math.floor(totalGuests * 0.3);
      const returningGuests = totalGuests - newGuests;
      
      data.push({
        date: date.toISOString(),
        totalGuests,
        newGuests,
        returningGuests,
        checkIns: Math.floor(Math.random() * 30) + 10,
        checkOuts: Math.floor(Math.random() * 25) + 8,
        averageStayDuration: Math.floor(Math.random() * 5) + 2,
        occupancyRate: Math.floor(Math.random() * 40) + 60,
        guestGrowth: (Math.random() - 0.5) * 20
      });
    }
    
    return data;
  }

  private getMockGuestBreakdown(): GuestBreakdown[] {
    return [
      {
        category: 'Business Travelers',
        value: 120,
        percentage: 35,
        averageStay: 2.5
      },
      {
        category: 'Leisure Travelers',
        value: 150,
        percentage: 45,
        averageStay: 4.2
      },
      {
        category: 'Group Bookings',
        value: 45,
        percentage: 15,
        averageStay: 3.8
      },
      {
        category: 'Extended Stay',
        value: 18,
        percentage: 5,
        averageStay: 14.5
      }
    ];
  }

  private getMockGuestStats(): GuestStats {
    return {
      totalGuests: 2156,
      totalCheckIns: 456,
      totalCheckOuts: 442,
      averageStayDuration: 3.8,
      occupancyRate: 78.5,
      guestGrowth: 12.5,
      newGuestsPercentage: 32.4,
      returningGuestsPercentage: 67.6,
      peakOccupancyDate: new Date().toISOString(),
      monthlyProjection: 6800
    };
  }
}