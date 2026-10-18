import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PartnerType = 'travel_agency' | 'tour_operator' | 'dmc' | 'wholesaler' | 'corporate' | 'referral' | 'other';
export type PartnerStatus = 'active' | 'inactive';

export const PARTNER_TYPE_LABELS: Record<PartnerType, () => string> = {
  travel_agency: () => $localize`Travel agency`,
  tour_operator: () => $localize`Tour operator`,
  dmc: () => $localize`Destination management company`,
  wholesaler: () => $localize`Wholesaler or bed bank`,
  corporate: () => $localize`Corporate travel`,
  referral: () => $localize`Referral or sales partner`,
  other: () => $localize`Other`,
};
export const PARTNER_TYPES = Object.keys(PARTNER_TYPE_LABELS) as PartnerType[];

/** How a booking reached the hotel. WHO brought it is the partner; this is the channel. */
export const BOOKING_CHANNELS: Array<{ value: string; label: () => string; legacy?: boolean }> = [
  { value: 'direct', label: () => $localize`Direct` },
  { value: 'walk_in', label: () => $localize`Walk-in` },
  { value: 'phone', label: () => $localize`Phone` },
  { value: 'email', label: () => $localize`Email` },
  { value: 'online', label: () => $localize`Online` },
  { value: 'partner_portal', label: () => $localize`Partner portal` },
  { value: 'booking.com', label: () => $localize`Booking.com` },
  { value: 'expedia', label: () => $localize`Expedia` },
  { value: 'airbnb', label: () => $localize`Airbnb` },
  // Older bookings used these two to say WHO. They stay valid for history but are no longer offered for new bookings.
  { value: 'travel_agent', label: () => $localize`Travel agent (older)`, legacy: true },
  { value: 'corporate', label: () => $localize`Corporate (older)`, legacy: true },
];
export const channelLabel = (value?: string | null): string => BOOKING_CHANNELS.find((c) => c.value === value)?.label() ?? (value || '');

export interface PartnerEvent {
  type: string;
  by?: string;
  at: string;
  note?: string;
  fields?: string[];
}

export interface Partner {
  _id: string;
  store: string;
  code: string;
  name: string;
  legalName?: string;
  type: PartnerType;
  contact?: { name?: string; email?: string; phone?: string };
  address?: { street?: string; city?: string; country?: string };
  status: PartnerStatus;
  notes?: string;
  events?: PartnerEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export type PartnerInput = Partial<Pick<Partner, 'code' | 'name' | 'legalName' | 'type' | 'contact' | 'address' | 'notes'>>;

export interface PartnerReservationRow {
  _id: string;
  confirmationNumber?: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  bookingSource?: string;
  partnerReference?: string;
  pricing?: { total: number; paid: number };
  guest?: { firstName?: string; lastName?: string; companyName?: string; guestType?: string };
}

/** Travel partners (agencies, tour operators, DMCs) of the selected hotel, and who brought which reservation. */
@Injectable({ providedIn: 'root' })
export class PartnerService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/partners`;

  list(storeId: string, q: { q?: string; type?: string; status?: string; page?: number; limit?: number; activeOnly?: boolean } = {}): Observable<{ partners: Partner[]; total: number; page: number; limit: number }> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '' && v !== 'all') p = p.set(k, String(v));
    return this.http.get<{ partners: Partner[]; total: number; page: number; limit: number }>(this.base(storeId), { params: p });
  }

  get(storeId: string, id: string): Observable<Partner> {
    return this.http.get<Partner>(`${this.base(storeId)}/${id}`);
  }

  create(storeId: string, input: PartnerInput): Observable<Partner> {
    return this.http.post<Partner>(this.base(storeId), input);
  }

  update(storeId: string, id: string, input: PartnerInput): Observable<Partner> {
    return this.http.put<Partner>(`${this.base(storeId)}/${id}`, input);
  }

  setStatus(storeId: string, id: string, status: PartnerStatus, reason?: string): Observable<Partner> {
    return this.http.put<Partner>(`${this.base(storeId)}/${id}/status`, { status, reason });
  }

  reservations(storeId: string, id: string, q: { page?: number; limit?: number } = {}): Observable<{ reservations: PartnerReservationRow[]; total: number; page: number; limit: number }> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v) p = p.set(k, String(v));
    return this.http.get<{ reservations: PartnerReservationRow[]; total: number; page: number; limit: number }>(`${this.base(storeId)}/${id}/reservations`, { params: p });
  }

  /** Change who brought a reservation, how it arrived, or the partner's own reference. Audited on the server. */
  setAttribution(reservationId: string, dto: { partner?: string | null; bookingSource?: string; partnerReference?: string; reason?: string }): Observable<unknown> {
    return this.http.put(`${environment.apiUrl}/reservations/${reservationId}/partner`, dto);
  }
}
