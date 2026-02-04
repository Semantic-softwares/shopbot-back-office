import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HotelPolicy {
  property_id?: string;
  title: string;
  currency: string;
  is_adults_only?: boolean;
  max_count_of_guests: number;
  checkin_from_time: string;
  checkin_to_time: string;
  checkout_from_time: string;
  checkout_to_time: string;
  internet_access_type: 'none' | 'wifi' | 'wired';
  internet_access_coverage?: 'entire_property' | 'public_areas' | 'all_rooms' | 'some_rooms' | 'business_centre';
  internet_access_cost?: number | null;
  parking_type: 'on_site' | 'nearby' | 'none';
  parking_reservation: 'not_available' | 'not_needed' | 'needed';
  parking_is_private: boolean;
  parking_cost?: number | null;
  pets_policy: 'allowed' | 'not_allowed' | 'by_arrangements' | 'assistive_only';
  pets_non_refundable_fee: number | string;
  pets_refundable_deposit: number | string;
  smoking_policy: 'no_smoking' | 'permitted_areas_only' | 'allowed';
  enhanced_cleaning_practices?: boolean;
  cleaning_practices_description?: string;
  partner_hygiene_link?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HotelPolicyService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get all hotel policies with optional filtering and pagination
   * Calls backend endpoint: GET /admin/channex/hotel-policies?propertyId={id}&page={page}&perPage={perPage}
   */
  getHotelPolicies(propertyId?: string, page?: number, perPage?: number): Observable<any> {
    let url = `${this.apiUrl}/admin/channex/hotel-policies`;
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
   * Get hotel policy by ID
   * Calls backend endpoint: GET /admin/channex/hotel-policies/:policyId
   */
  getHotelPolicy(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/channex/hotel-policies/${id}`);
  }

  /**
   * Create new hotel policy
   * Calls backend endpoint: POST /admin/channex/hotel-policies
   */
  createHotelPolicy(policy: HotelPolicy): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/channex/hotel-policies`, policy);
  }

  /**
   * Update hotel policy
   * Calls backend endpoint: PATCH /admin/channex/hotel-policies/:policyId
   */
  updateHotelPolicy(id: string, policy: HotelPolicy): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/channex/hotel-policies/${id}`, policy);
  }

  /**
   * Delete hotel policy
   * Calls backend endpoint: DELETE /admin/channex/hotel-policies/:policyId
   */
  deleteHotelPolicy(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/channex/hotel-policies/${id}`);
  }
}
