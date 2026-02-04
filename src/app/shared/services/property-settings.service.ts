import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface PropertySettings {
  min_price?: number | string | null;
  max_price?: number | string | null;
  allow_availability_autoupdate_on_confirmation?: boolean;
  allow_availability_autoupdate_on_modification?: boolean;
  allow_availability_autoupdate_on_cancellation?: boolean;
  min_stay_type?: string;
  state_length?: number;
  cut_off_time?: string;
  cut_off_days?: number;
  max_day_advance?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class PropertySettingsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  

  /**
   * Get property settings by ID
   */
  getPropertySettings(propertyId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/channex/properties/${propertyId}/settings`);
  }

  /**
   * Update property settings
   */
  updatePropertySettings(propertyId: string, settings: PropertySettings): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/channex/properties/${propertyId}/settings`, settings);
  }
}
