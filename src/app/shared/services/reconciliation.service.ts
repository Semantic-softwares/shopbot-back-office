import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReconciliationItem {
  _id?: string;
  product: string;
  productName: string;
  productSku?: string;
  systemQuantity: number;
  physicalQuantity?: number;
  variance: number;
  unitCost: number;
  varianceValue: number;
  reason?: 'damage' | 'theft' | 'expiry' | 'supplier_error' | 'counting_error' | 'system_error' | 'other';
  reasonNote?: string;
  status: 'pending' | 'counted' | 'approved' | 'rejected';
  countedAt?: Date;
  countedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface Reconciliation {
  _id?: string;
  name: string;
  store: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  completedDate?: Date;
  totalProducts: number;
  countedProducts: number;
  discrepancyCount: number;
  totalVarianceValue: number;
  createdBy?: string;
  completedBy?: string;
  description?: string;
  type: 'full_inventory' | 'partial' | 'cycle_count';
  items: ReconciliationItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconciliationResponse {
  data: Reconciliation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CountData {
  physicalQuantity: number;
  reason?: string;
  reasonNote?: string;
  countedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private hostServer: string = environment.apiUrl;

  constructor(private _httpClient: HttpClient) {}

  /**
   * Create a new reconciliation
   */
  create(reconciliation: Partial<Reconciliation>): Observable<Reconciliation> {
    return this._httpClient.post<Reconciliation>(`${this.hostServer}/reconciliations`, reconciliation);
  }

  /**
   * Initialize reconciliation with current inventory
   */
  initialize(initData: {
    name: string;
    description?: string;
    type?: string;
    createdBy?: string;
  }): Observable<Reconciliation> {
    return this._httpClient.post<Reconciliation>(`${this.hostServer}/reconciliations/initialize`, initData);
  }

  /**
   * Get all reconciliations with pagination and filters
   */
  findAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<ReconciliationResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this._httpClient.get<ReconciliationResponse>(`${this.hostServer}/reconciliations`, { params: httpParams });
  }

  /**
   * Get a single reconciliation by ID
   */
  findOne(id: string): Observable<Reconciliation> {
    return this._httpClient.get<Reconciliation>(`${this.hostServer}/reconciliations/${id}`);
  }

  /**
   * Update a reconciliation
   */
  update(id: string, reconciliation: Partial<Reconciliation>): Observable<Reconciliation> {
    return this._httpClient.put<Reconciliation>(`${this.hostServer}/reconciliations/${id}`, reconciliation);
  }

  /**
   * Update item count
   */
  updateItemCount(reconciliationId: string, itemId: string, countData: CountData): Observable<Reconciliation> {
    return this._httpClient.put<Reconciliation>(
      `${this.hostServer}/reconciliations/${reconciliationId}/items/${itemId}/count`, 
      countData
    );
  }

  /**
   * Bulk update counts
   */
  bulkUpdateCounts(reconciliationId: string, countsData: Array<{
    productId: string;
    physicalQuantity: number;
    reason?: string;
    reasonNote?: string;
    countedBy?: string;
  }>): Observable<Reconciliation> {
    return this._httpClient.put<Reconciliation>(
      `${this.hostServer}/reconciliations/${reconciliationId}/bulk-count`, 
      countsData
    );
  }

  /**
   * Approve adjustments
   */
  approveAdjustments(reconciliationId: string, approvalData: {
    itemIds: string[];
    approvedBy: string;
  }): Observable<Reconciliation> {
    return this._httpClient.put<Reconciliation>(
      `${this.hostServer}/reconciliations/${reconciliationId}/approve`, 
      approvalData
    );
  }

  /**
   * Complete reconciliation
   */
  complete(reconciliationId: string, completionData: {
    completedBy: string;
  }): Observable<Reconciliation> {
    return this._httpClient.put<Reconciliation>(
      `${this.hostServer}/reconciliations/${reconciliationId}/complete`, 
      completionData
    );
  }

  /**
   * Delete a reconciliation
   */
  delete(id: string): Observable<any> {
    return this._httpClient.delete(`${this.hostServer}/reconciliations/${id}`);
  }

  /**
   * Get reconciliation statistics
   */
  getStats(): Observable<any> {
    return this._httpClient.get(`${this.hostServer}/reconciliations/stats`);
  }
}
