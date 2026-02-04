import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LiveBookingModel, LiveBookingsListResponse, BookingFilters } from '../models/live-booking.model';

export interface LiveBookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  otaCodes?: string[];
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  departureDateFrom?: string;
  departureDateTo?: string;
  bookingDateFrom?: string;
  bookingDateTo?: string;
  status?: string;
}

export interface LiveBooking {
  id: string;
  uniqueId: string;
  property: string;
  customerName: string;
  otaName: string;
  arrivalDate: string;
  departureDate: string;
  bookingDate: string;
  roomsCount: number;
  amount: number;
  currency: string;
  status: 'new' | 'modified' | 'cancelled';
  acknowledged: boolean;
  paymentType: string;
  paymentCollect: string;
  revisionId: string;
  raw: any;
}

export interface LiveBookingsResponse {
  success: boolean;
  bookings: LiveBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LiveBookingService {
    private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getLiveBookings(
    storeId: string,
    filters: LiveBookingFilters,
  ): Observable<LiveBookingsResponse> {
    let params = new HttpParams();

    // Pagination - Channex uses pagination[page] and pagination[limit]
    if (filters.page) params = params.set('pagination[page]', String(filters.page));
    if (filters.limit) params = params.set('pagination[limit]', String(filters.limit));

    // Search - Channex uses filter[q]
    if (filters.search) params = params.set('filter[q]', filters.search);
    
    // Status filter
    if (filters.status) params = params.set('filter[status]', filters.status);

    // OTA codes filter
    if (filters.otaCodes && filters.otaCodes.length > 0) {
      filters.otaCodes.forEach(code => {
        params = params.append('filter[ota_codes][]', code);
      });
    }

    // Arrival date range filter
    if (filters.arrivalDateFrom) params = params.set('filter[arrival_date][gte]', filters.arrivalDateFrom);
    if (filters.arrivalDateTo) params = params.set('filter[arrival_date][lte]', filters.arrivalDateTo);

    // Departure date range filter
    if (filters.departureDateFrom) params = params.set('filter[departure_date][gte]', filters.departureDateFrom);
    if (filters.departureDateTo) params = params.set('filter[departure_date][lte]', filters.departureDateTo);

    // Booking date range filter
    if (filters.bookingDateFrom) params = params.set('filter[inserted_at][gte]', filters.bookingDateFrom);
    if (filters.bookingDateTo) params = params.set('filter[inserted_at][lte]', filters.bookingDateTo);

    // Order by inserted_at descending (most recent first)
    params = params.set('order[inserted_at]', 'desc');

    return this.http.get<LiveBookingsResponse>(
      `${this.apiUrl}/admin/channex/stores/${storeId}/live-bookings`,
      { params },
    );
  }

  getBookingDetails(bookingId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/admin/channex/bookings/${bookingId}`,
    );
  }

  getBookingEvents(bookingId: string): Observable<any> {
    let params = new HttpParams();
    params = params.set('pagination[limit]', '100');
    params = params.set('pagination[page]', '1');
    params = params.set('order[inserted_at]', 'asc');

    return this.http.get<any>(
      `${this.apiUrl}/admin/channex/bookings/${bookingId}/events`,
      { params },
    );
  }
}
