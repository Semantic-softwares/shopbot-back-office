import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vehicle, ApiResponse, PaginatedResponse } from '../models/estate.model';
import { StoreStore } from '../stores/store.store';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private http = inject(HttpClient);
  private storeStore = inject(StoreStore);
  private baseUrl = `${environment.apiUrl}/estate/vehicles`;

  private get storeId(): string {
    return this.storeStore.selectedStore()?._id ?? '';
  }

  getVehicles(params: Record<string, string> = {}): Observable<PaginatedResponse<Vehicle>> {
    let httpParams = new HttpParams().set('storeId', this.storeId);
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<PaginatedResponse<Vehicle>>(this.baseUrl, { params: httpParams });
  }

  getVehiclesByTenant(tenantId: string): Observable<ApiResponse<Vehicle[]>> {
    return this.http.get<ApiResponse<Vehicle[]>>(`${this.baseUrl}/by-tenant/${tenantId}`);
  }

  getVehicleById(id: string): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>(`${this.baseUrl}/${id}`);
  }

  createVehicle(data: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.http.post<ApiResponse<Vehicle>>(this.baseUrl, data, {
      params: new HttpParams().set('storeId', this.storeId),
    });
  }

  updateVehicle(id: string, data: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.http.patch<ApiResponse<Vehicle>>(`${this.baseUrl}/${id}`, data);
  }

  deleteVehicle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
