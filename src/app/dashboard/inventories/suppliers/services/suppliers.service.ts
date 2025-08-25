import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier, CreateSupplierDto, UpdateSupplierDto, SuppliersResponse } from '../interfaces/supplier.interface';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) { }

  getSuppliers(storeId: string, page: number = 1, limit: number = 10, search?: string): Observable<SuppliersResponse> {
    let params = new HttpParams()
      .set('storeId', storeId)
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<SuppliersResponse>(this.apiUrl, { params });
  }

  getSuppliersByStore(storeId: string): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}/store/${storeId}`);
  }

  getSupplier(id: string, storeId?: string): Observable<Supplier> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`, { params });
  }

  createSupplier(supplier: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, supplier);
  }

  updateSupplier(id: string, supplier: UpdateSupplierDto, storeId?: string): Observable<Supplier> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    return this.http.patch<Supplier>(`${this.apiUrl}/${id}`, supplier, { params });
  }

  deleteSupplier(id: string, storeId?: string): Observable<{ message: string }> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { params });
  }

  toggleSupplierStatus(id: string, storeId?: string): Observable<Supplier> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    return this.http.patch<Supplier>(`${this.apiUrl}/${id}/toggle-active`, {}, { params });
  }
}
