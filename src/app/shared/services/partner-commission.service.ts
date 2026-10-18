import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CommissionStatus = 'not_applicable' | 'estimated' | 'pending_review' | 'approved' | 'paid' | 'void';

export const COMMISSION_STATUS_LABELS: Record<string, () => string> = {
  estimated: () => $localize`Estimated`,
  pending_review: () => $localize`Awaiting approval`,
  approved: () => $localize`Approved`,
  paid: () => $localize`Paid`,
  void: () => $localize`Void`,
  not_applicable: () => $localize`Not applicable`,
};
export const commissionStatusLabel = (s: string) => COMMISSION_STATUS_LABELS[s]?.() ?? s;
export const COMMISSION_STATUS_TONES: Record<string, string> = {
  estimated: 'bg-indigo-100 text-indigo-900', pending_review: 'bg-amber-100 text-amber-900', approved: 'bg-blue-100 text-blue-900',
  paid: 'bg-green-100 text-green-900', void: 'bg-gray-100 text-gray-700', not_applicable: 'bg-gray-100 text-gray-700',
};

export interface CommissionPayment {
  reference?: string;
  method?: string;
  date?: string;
  amount: number;
  at: string;
  idempotencyKey: string;
}

export interface CommissionEvent {
  type: string;
  at: string;
  byType?: 'staff' | 'system';
  note?: string;
  data?: Record<string, unknown>;
}

export interface Commission {
  _id: string;
  status: CommissionStatus;
  amount: number;
  paidAmount: number;
  outstanding: number;
  currency?: string;
  rule?: { type?: 'percent' | 'fixed_per_room_night' | 'fixed_per_stay'; value?: number; basis?: string };
  basis?: { revenue: number; roomNights: number; computedAt?: string; source?: 'quote' | 'reservation' };
  review?: { needed: boolean; reason?: 'cancelled' | 'stay_changed' | 'terms_removed'; delta?: number; newAmount?: number; since?: string };
  partner: { _id: string; name?: string; code?: string };
  agreement?: { _id: string; code?: string; name?: string };
  reservation: { _id: string; confirmationNumber?: string; status?: string; checkInDate?: string; checkOutDate?: string; guest?: string };
  approvedAt?: string;
  updatedAt?: string;
  payments?: CommissionPayment[];
  events?: CommissionEvent[];
}

export interface CommissionList {
  rows: Commission[];
  total: number;
  page: number;
  limit: number;
  totals: { estimated: number; pendingReview: number; approvedOwed: number; paid: number; needsReview: number };
}

export interface CommissionQuery {
  partner?: string;
  status?: string;
  reservation?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const ruleSummary = (rule: Commission['rule'], money: (n: number) => string): string => {
  if (!rule?.type) return '';
  if (rule.type === 'percent') return $localize`${rule.value}% of room revenue`;
  if (rule.type === 'fixed_per_room_night') return $localize`${money(rule.value ?? 0)} per room night`;
  return $localize`${money(rule.value ?? 0)} per stay`;
};

/** What the hotel owes its travel partners: reviewing it, approving it, and recording that it has been settled. */
@Injectable({ providedIn: 'root' })
export class PartnerCommissionService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/commissions`;

  list(storeId: string, q: CommissionQuery = {}): Observable<CommissionList> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '' && v !== 'all') p = p.set(k, String(v));
    return this.http.get<CommissionList>(this.base(storeId), { params: p });
  }
  get(storeId: string, id: string): Observable<Commission> { return this.http.get<Commission>(`${this.base(storeId)}/${id}`); }
  approve(storeId: string, id: string): Observable<Commission> { return this.http.post<Commission>(`${this.base(storeId)}/${id}/approve`, {}); }
  voidIt(storeId: string, id: string, reason: string): Observable<Commission> { return this.http.post<Commission>(`${this.base(storeId)}/${id}/void`, { reason }); }
  recalculate(storeId: string, id: string): Observable<Commission> { return this.http.post<Commission>(`${this.base(storeId)}/${id}/recalculate`, {}); }
  resolveReview(storeId: string, id: string, action: 'accept' | 'dismiss', note?: string): Observable<Commission> { return this.http.post<Commission>(`${this.base(storeId)}/${id}/review`, { action, note }); }
  pay(storeId: string, id: string, body: { amount: number; reference?: string; method?: string; date?: string; idempotencyKey: string }): Observable<Commission> {
    return this.http.post<Commission>(`${this.base(storeId)}/${id}/payments`, body);
  }
}
