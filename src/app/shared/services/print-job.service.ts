import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrintJob, PrintJobStats } from '../models/print-job.model';

@Injectable({
  providedIn: 'root',
})
export class PrintJobService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/print-jobs`;

  getPrintJobs(storeId: string, filters?: {
    status?: string;
    stationId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<PrintJob[]> {
    const params: any = { 
      store: storeId, 
      populate: 'order,station',  // Request populated order and station data
      ...filters 
    };
    return this.http.get<PrintJob[]>(this.apiUrl, { params });
  }

  getPrintJobById(id: string): Observable<PrintJob> {
    return this.http.get<PrintJob>(`${this.apiUrl}/${id}`);
  }

  getPrintJobStats(storeId: string): Observable<PrintJobStats> {
    return this.http.get<PrintJobStats>(`${this.apiUrl}/stats`, { params: { store: storeId } });
  }

  retryPrintJob(id: string): Observable<PrintJob> {
    return this.http.post<PrintJob>(`${this.apiUrl}/${id}/retry`, {});
  }

  cancelPrintJob(id: string): Observable<PrintJob> {
    return this.http.post<PrintJob>(`${this.apiUrl}/${id}/cancel`, {});
  }

  createPrintJobsForOrder(orderId: string, orderData: any): Observable<{ success: boolean; jobs: PrintJob[] }> {
    return this.http.post<{ success: boolean; jobs: PrintJob[] }>(`${this.apiUrl}/create-for-order`, {
      orderId,
      orderData
    });
  }
}
