import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PartnerPortalUser {
  _id: string;
  email: string;
  name: string;
  status: 'invited' | 'active' | 'disabled';
  invitedAt?: string;
  lastLoginAt?: string;
}

export type PartnerRequestStatus = 'pending' | 'processing' | 'accepted' | 'rejected' | 'cancelled';
export interface PartnerRequestRow {
  _id: string;
  code: string;
  kind: 'new' | 'change' | 'cancel';
  status: PartnerRequestStatus;
  partner: { _id: string; name?: string; code?: string };
  requestedBy?: { email: string; name: string };
  roomType?: string;
  roomTypeName?: string;
  checkIn?: string;
  checkOut?: string;
  proposedCheckIn?: string;
  proposedCheckOut?: string;
  rooms?: number;
  adults?: number;
  children?: number;
  guest?: { firstName?: string; lastName?: string; email?: string; phone?: string; nationality?: string };
  partnerReference?: string;
  notes?: string;
  quote?: { agreement?: { code?: string; name?: string }; currency?: string; agreedTotal?: number; publicTotal?: number; estimatedCommission?: number; roomNights?: number };
  reservation?: { _id: string; confirmationNumber?: string; status?: string };
  decision?: { at?: string; note?: string };
  lastCheckFailure?: { code: string; message: string; at: string };
  createdAt: string;
  events?: Array<{ type: string; at: string; by: string; note?: string }>;
}

/** The hotel's side of the partner portal: who may sign in for each partner, and the requests they send. */
@Injectable({ providedIn: 'root' })
export class PartnerRequestService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}`;

  users(storeId: string, partnerId: string): Observable<{ users: PartnerPortalUser[] }> { return this.http.get<{ users: PartnerPortalUser[] }>(`${this.base(storeId)}/partners/${partnerId}/users`); }
  invite(storeId: string, partnerId: string, body: { email: string; name?: string }) { return this.http.post<{ user: PartnerPortalUser }>(`${this.base(storeId)}/partners/${partnerId}/users`, body); }
  resend(storeId: string, partnerId: string, userId: string) { return this.http.post<{ user: PartnerPortalUser }>(`${this.base(storeId)}/partners/${partnerId}/users/${userId}/resend`, {}); }
  removeUser(storeId: string, partnerId: string, userId: string) { return this.http.delete<{ ok: true }>(`${this.base(storeId)}/partners/${partnerId}/users/${userId}`); }

  list(storeId: string, q: { status?: string; partner?: string; kind?: string; q?: string; page?: number; limit?: number } = {}): Observable<{ requests: PartnerRequestRow[]; total: number; page: number; limit: number; pending: number }> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '' && v !== 'all') p = p.set(k, String(v));
    return this.http.get<{ requests: PartnerRequestRow[]; total: number; page: number; limit: number; pending: number }>(`${this.base(storeId)}/partner-requests`, { params: p });
  }
  get(storeId: string, id: string): Observable<PartnerRequestRow> { return this.http.get<PartnerRequestRow>(`${this.base(storeId)}/partner-requests/${id}`); }
  rooms(storeId: string, id: string): Observable<{ needed: number; rooms: Array<{ _id: string; roomNumber: string }> }> { return this.http.get<{ needed: number; rooms: Array<{ _id: string; roomNumber: string }> }>(`${this.base(storeId)}/partner-requests/${id}/rooms`); }
  accept(storeId: string, id: string, roomIds?: string[]): Observable<PartnerRequestRow> { return this.http.post<PartnerRequestRow>(`${this.base(storeId)}/partner-requests/${id}/accept`, { roomIds }); }
  reject(storeId: string, id: string, reason: string): Observable<PartnerRequestRow> { return this.http.post<PartnerRequestRow>(`${this.base(storeId)}/partner-requests/${id}/reject`, { reason }); }
  resolve(storeId: string, id: string, outcome: 'accepted' | 'rejected', note?: string): Observable<PartnerRequestRow> { return this.http.post<PartnerRequestRow>(`${this.base(storeId)}/partner-requests/${id}/resolve`, { outcome, note }); }
}
