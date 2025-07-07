import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Timesheet, TimesheetStatus, TimesheetSummary, TimesheetFilters, LocationData } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Clock in/out operations
  clockIn(clockInData: {
    staff: string;
    store: string;
    clockInTime: string;
    clockOutTime?: string;
    date: string;
    status?: string;
    notes?: string;
    breaks?: any[];
  }): Observable<Timesheet> {
    const payload = {
      staff: clockInData.staff,
      store: clockInData.store,
      clockInTime: clockInData.clockInTime,
      clockOutTime: clockInData.clockOutTime || null,
      totalHours: 0,
      date: clockInData.date,
      status: clockInData.status || 'clocked-in',
      notes: clockInData.notes || '',
      breaks: clockInData.breaks || [],
      totalBreakTime: 0,
      workingHours: 0,
      approved: false,
      approvedBy: null,
      approvedAt: null
    };

    return this.http.post<Timesheet>(`${this.baseUrl}/timesheets/clock-in`, payload);
  }

  clockOut(location?: LocationData): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.baseUrl}/timesheets/clock-out`, {
      location
    });
  }

  // Break operations
  startBreak(type: 'lunch' | 'short' | 'other', notes?: string): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.baseUrl}/timesheets/break/start`, {
      type,
      notes
    });
  }

  endBreak(): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.baseUrl}/timesheets/break/end`, {});
  }

  // Get operations
  getTimesheetStatus(merchantId: string, storeId: string): Observable<TimesheetStatus> {
    return this.http.get<TimesheetStatus>(`${this.baseUrl}/timesheets/status/${merchantId}/${storeId}`);
  }

  getMerchantTimesheets(merchantId: string, filters?: TimesheetFilters): Observable<Timesheet[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    return this.http.get<Timesheet[]>(`${this.baseUrl}/timesheets/merchant/${merchantId}`, { params });
  }

  getStoreTimesheets(storeId: string, filters?: TimesheetFilters): Observable<Timesheet[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    return this.http.get<{success: boolean, data: any[]}>(`${this.baseUrl}/timesheets/store/${storeId}`, { params })
      .pipe(
        map((response: {success: boolean, data: any[]}) => {
          // Transform the API response to match our Timesheet interface
          return response.data.map((item: any) => ({
            ...item,
            employee: item.staff // Map staff to employee for consistency
          })) as Timesheet[];
        })
      );
  }

  getTimesheetSummary(storeId: string, startDate?: Date, endDate?: Date): Observable<TimesheetSummary> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    return this.http.get<TimesheetSummary>(`${this.baseUrl}/timesheets/summary/${storeId}`, { params });
  }

  getTimesheetById(id: string): Observable<Timesheet> {
    return this.http.get<Timesheet>(`${this.baseUrl}/timesheets/${id}`);
  }

  // Update operations
  approveTimesheet(id: string): Observable<Timesheet> {
    return this.http.put<Timesheet>(`${this.baseUrl}/timesheets/${id}/approve`, {});
  }

  updateTimesheet(id: string, updates: Partial<Timesheet>): Observable<Timesheet> {
    return this.http.put<Timesheet>(`${this.baseUrl}/timesheets/${id}`, updates);
  }

  deleteTimesheet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/timesheets/${id}`);
  }

  // Export functionality
  exportTimesheets(storeId: string, format: 'csv' | 'excel' = 'csv', filters?: TimesheetFilters): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    return this.http.get(`${this.baseUrl}/timesheets/store/${storeId}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
