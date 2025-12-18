import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Guest } from '../models/reservation.model';

export interface GuestSearchResponse {
  guests: Guest[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/guests`;

  /**
   * Search guests by email, phone, or name
   * @param searchTerm - Search term
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 10)
   * @param storeId - Store ID to filter by (optional)
   * @param guestType - Guest type: 'single' (individual), 'group' (corporate), or undefined/null (all)
   */
  searchGuests(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    storeId?: string,
    guestType?: 'single' | 'group' | null
  ): Observable<GuestSearchResponse> {
    let params = new HttpParams()
      .set('search', searchTerm)
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    if (guestType) {
      params = params.set('guestType', guestType);
    }

    return this.http.get<GuestSearchResponse>(this.apiUrl, { params });
  }

  /**
   * Search guest by phone number
   */
  searchGuestByPhone(phone: string, storeId?: string): Observable<Guest | null> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    return this.http.get<Guest>(`${this.apiUrl}/search/phone/${phone}`, { params }).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Search guest by email
   */
  searchGuestByEmail(email: string, storeId?: string): Observable<Guest | null> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    
    return this.http.get<Guest>(`${this.apiUrl}/search/email/${email}`, { params }).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get guest by ID
   */
  getGuestById(guestId: string): Observable<Guest> {
    return this.http.get<Guest>(`${this.apiUrl}/${guestId}`);
  }

  /**
   * Create a new guest
   */
  createGuest(guestData: Partial<Guest>): Observable<Guest> {
    return this.http.post<Guest>(this.apiUrl, guestData);
  }

  /**
   * Update guest information
   */
  updateGuest(guestId: string, updateData: Partial<Guest>): Observable<Guest> {
    return this.http.put<Guest>(`${this.apiUrl}/${guestId}`, updateData);
  }

  /**
   * Delete guest
   */
  deleteGuest(guestId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${guestId}`);
  }

  /**
   * Get guest reservation history
   */
  getGuestHistory(guestId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${guestId}/history`);
  }

  /**
   * Update guest loyalty points
   */
  updateLoyaltyPoints(guestId: string, points: number, reason: string): Observable<Guest> {
    return this.http.put<Guest>(`${this.apiUrl}/${guestId}/loyalty`, { points, reason });
  }

  /**
   * Get guest statistics
   */
  getGuestStats(storeId?: string): Observable<any> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    return this.http.get(`${this.apiUrl}/stats/overview`, { params });
  }
}