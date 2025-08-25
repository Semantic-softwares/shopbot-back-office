import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RestockItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: Date;
  totalCost: number;
}

export interface Restock {
  _id?: string;
  invoiceNumber: string;
  orderNumber?: string;
  invoiceDate: Date;
  supplier: string;
  items: RestockItem[];
  subtotal: number;
  discount?: number;
  discountAmount?: number;
  vat?: number;
  vatAmount?: number;
  total: number;
  amountPaid?: number;
  paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'credit';
  outstandingBalance?: number;
  status?: 'draft' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestockResponse {
  data: Restock[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RestockService {
  private hostServer: string = environment.apiUrl;

  constructor(private _httpClient: HttpClient) {}

  /**
   * Create a new restock entry
   */
  create(restock: Partial<Restock>): Observable<Restock> {
    return this._httpClient.post<Restock>(`${this.hostServer}/restocks`, restock);
  }

  /**
   * Get all restocks with pagination and filters
   */
  findAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplier?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<RestockResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this._httpClient.get<RestockResponse>(`${this.hostServer}/restocks`, { params: httpParams });
  }

  /**
   * Get a single restock by ID
   */
  findOne(id: string): Observable<Restock> {
    return this._httpClient.get<Restock>(`${this.hostServer}/restocks/${id}`);
  }

  /**
   * Update a restock
   */
  update(id: string, restock: Partial<Restock>): Observable<Restock> {
    return this._httpClient.put<Restock>(`${this.hostServer}/restocks/${id}`, restock);
  }

  /**
   * Delete a restock
   */
  delete(id: string): Observable<any> {
    return this._httpClient.delete(`${this.hostServer}/restocks/${id}`);
  }

  /**
   * Get restock statistics
   */
  getStats(): Observable<any> {
    return this._httpClient.get(`${this.hostServer}/restocks/stats`);
  }
}
