import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pet, ApiResponse, PaginatedResponse } from '../models/estate.model';
import { StoreStore } from '../stores/store.store';

@Injectable({ providedIn: 'root' })
export class PetService {
  private http = inject(HttpClient);
  private storeStore = inject(StoreStore);
  private baseUrl = `${environment.apiUrl}/estate/pets`;

  private get storeId(): string {
    return this.storeStore.selectedStore()?._id ?? '';
  }

  getPets(params: Record<string, string> = {}): Observable<PaginatedResponse<Pet>> {
    let httpParams = new HttpParams().set('storeId', this.storeId);
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<PaginatedResponse<Pet>>(this.baseUrl, { params: httpParams });
  }

  getPetsByTenant(tenantId: string): Observable<ApiResponse<Pet[]>> {
    return this.http.get<ApiResponse<Pet[]>>(`${this.baseUrl}/by-tenant/${tenantId}`);
  }

  getPetById(id: string): Observable<ApiResponse<Pet>> {
    return this.http.get<ApiResponse<Pet>>(`${this.baseUrl}/${id}`);
  }

  createPet(data: Partial<Pet>): Observable<ApiResponse<Pet>> {
    return this.http.post<ApiResponse<Pet>>(this.baseUrl, data, {
      params: new HttpParams().set('storeId', this.storeId),
    });
  }

  updatePet(id: string, data: Partial<Pet>): Observable<ApiResponse<Pet>> {
    return this.http.patch<ApiResponse<Pet>>(`${this.baseUrl}/${id}`, data);
  }

  deletePet(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
