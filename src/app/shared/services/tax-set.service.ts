import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaxInSet {
  id: string;
  level?: number;
}

export interface TaxSet {
  property_id?: string;
  title: string;
  currency: string;
  taxes: TaxInSet[];
  associated_rate_plan_ids?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TaxSetService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get all tax sets with optional filtering and pagination
   * Calls backend endpoint: GET /admin/channex/tax-sets?propertyId={id}&page={page}&perPage={perPage}
   */
  getTaxSets(propertyId?: string, page?: number, perPage?: number): Observable<any> {
    let url = `${this.apiUrl}/admin/channex/tax-sets`;
    const params = new URLSearchParams();
    
    if (propertyId) {
      params.append('propertyId', propertyId);
    }
    if (page) {
      params.append('page', page.toString());
    }
    if (perPage) {
      params.append('perPage', perPage.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get(url);
  }

  /**
   * Get tax set by ID
   * Calls backend endpoint: GET /admin/channex/tax-sets/:taxSetId
   */
  getTaxSet(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/channex/tax-sets/${id}`);
  }

  /**
   * Create new tax set
   * Calls backend endpoint: POST /admin/channex/tax-sets
   */
  createTaxSet(taxSet: TaxSet): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/channex/tax-sets`, taxSet);
  }

  /**
   * Update tax set
   * Calls backend endpoint: PATCH /admin/channex/tax-sets/:taxSetId
   */
  updateTaxSet(id: string, taxSet: TaxSet): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/channex/tax-sets/${id}`, taxSet);
  }

  /**
   * Delete tax set
   * Calls backend endpoint: DELETE /admin/channex/tax-sets/:taxSetId
   */
  deleteTaxSet(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/channex/tax-sets/${id}`);
  }
}
