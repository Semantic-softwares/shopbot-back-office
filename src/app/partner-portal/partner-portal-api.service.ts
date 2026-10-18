import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PortalHotel {
  storeId: string;
  hotel: { name: string; currency: string };
  partner: { _id: string; name: string; code: string };
}
export interface Offer {
  roomType: { _id: string; name: string; description: string; photos: string[]; maxOccupancy: number; capacity?: { adults: number; children: number }; amenities: string[]; bedConfiguration: string };
  ratePlan: { _id: string; name?: string } | null;
  currency: string;
  nights: Array<{ date: string; rate: number }>;
  /** Per room. */
  total: number;
  roomNights: number;
  agreement: { name: string };
  available: number;
  fitsGuests: boolean;
}
export interface Unavailable {
  roomType: Offer['roomType'];
  ratePlan: Offer['ratePlan'];
  reason: 'SOLD_OUT' | 'STOP_SELL' | 'CLOSED_TO_ARRIVAL' | 'CLOSED_TO_DEPARTURE' | 'MIN_STAY' | 'MAX_STAY';
  minStay?: number;
  available?: number;
}
export interface AvailabilityResult {
  hotel: { name: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  offers: Offer[];
  unavailable: Unavailable[];
}
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export interface PortalRequest {
  _id: string;
  code: string;
  kind: 'new' | 'change' | 'cancel';
  status: RequestStatus;
  store: string;
  hotel?: string;
  roomTypeName?: string;
  checkIn?: string;
  checkOut?: string;
  proposedCheckIn?: string;
  proposedCheckOut?: string;
  rooms: number;
  adults?: number;
  children?: number;
  guest?: { firstName?: string; lastName?: string; email?: string; phone?: string; nationality?: string };
  partnerReference?: string;
  notes?: string;
  quote?: { currency: string; perRoom: number; total: number };
  reservation?: { _id: string; confirmationNumber: string; status: string } | null;
  decisionNote?: string;
  createdAt: string;
}
export interface PortalReservation {
  _id: string;
  confirmationNumber: string;
  hotel: string;
  currency: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  partnerReference?: string;
  leadGuest: string;
  rooms: string[];
  total?: number;
  openRequest?: 'change' | 'cancel';
}
export interface SubmitBody {
  idempotencyKey: string;
  roomTypeId: string;
  ratePlanId?: string | null;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  quotedTotal: number;
  guest: { firstName: string; lastName: string; email?: string; phone?: string; nationality?: string };
  partnerReference?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class PartnerPortalApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/partner-portal`;

  hotels(): Observable<{ hotels: PortalHotel[] }> { return this.http.get<{ hotels: PortalHotel[] }>(`${this.base}/hotels`); }
  availability(storeId: string, q: { checkIn: string; checkOut: string; adults: number; rooms: number }): Observable<AvailabilityResult> {
    const p = new HttpParams().set('checkIn', q.checkIn).set('checkOut', q.checkOut).set('adults', q.adults).set('rooms', q.rooms);
    return this.http.get<AvailabilityResult>(`${this.base}/hotels/${storeId}/availability`, { params: p });
  }
  submit(storeId: string, body: SubmitBody): Observable<{ request: PortalRequest; replay: boolean }> { return this.http.post<{ request: PortalRequest; replay: boolean }>(`${this.base}/hotels/${storeId}/requests`, body); }
  amend(storeId: string, reservationId: string, kind: 'change' | 'cancel', body: { idempotencyKey: string; note?: string; reason?: string; proposedCheckIn?: string; proposedCheckOut?: string }) {
    return this.http.post<{ request: PortalRequest }>(`${this.base}/hotels/${storeId}/reservations/${reservationId}/${kind}-request`, body);
  }
  requests(q: { storeId?: string; status?: string; page?: number; limit?: number } = {}): Observable<{ requests: PortalRequest[]; total: number; page: number; limit: number }> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '' && v !== 'all') p = p.set(k, String(v));
    return this.http.get<{ requests: PortalRequest[]; total: number; page: number; limit: number }>(`${this.base}/requests`, { params: p });
  }
  cancelRequest(id: string): Observable<PortalRequest> { return this.http.post<PortalRequest>(`${this.base}/requests/${id}/cancel`, {}); }
  reservations(q: { storeId?: string; status?: string; page?: number; limit?: number } = {}): Observable<{ reservations: PortalReservation[]; total: number; page: number; limit: number }> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '' && v !== 'all') p = p.set(k, String(v));
    return this.http.get<{ reservations: PortalReservation[]; total: number; page: number; limit: number }>(`${this.base}/reservations`, { params: p });
  }
}

/** A fresh key per attempt at one action, so a double click or a retry is one request on the server. */
export const newKey = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

/** The message the server gave, or a plain fallback. */
export const messageOf = (e: any, fallback: string): string => e?.error?.message ?? fallback;
