import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PricingMode = 'public' | 'percent_discount' | 'fixed_amount_off' | 'fixed_rate';
export type CommissionType = 'percent' | 'fixed_per_room_night' | 'fixed_per_stay';
export type AgreementKind = 'commission' | 'negotiated_rate' | 'commission_and_negotiated_rate';

export interface FixedRate {
  roomType: string;
  rate: number;
  from?: string;
  to?: string;
}

export interface PartnerAgreement {
  _id: string;
  store: string;
  partner: string;
  code: string;
  name: string;
  kind: AgreementKind;
  pricing: { mode: PricingMode; value?: number; fixedRates?: FixedRate[] };
  commission: { enabled: boolean; type?: CommissionType; value?: number };
  allowBoth: boolean;
  startDate: string;
  endDate: string;
  roomTypes: string[];
  ratePlans: string[];
  status: 'active' | 'inactive';
  notes?: string;
  events?: Array<{ type: string; at: string; note?: string; changes?: unknown }>;
}

export type AgreementInput = Partial<Pick<PartnerAgreement, 'code' | 'name' | 'pricing' | 'commission' | 'allowBoth' | 'startDate' | 'endDate' | 'roomTypes' | 'ratePlans' | 'notes'>>;

export interface RoomQuote {
  index: number;
  partner: { _id: string; name: string; code: string };
  agreement: null | { _id: string; code: string; name: string; kind: AgreementKind; pricing: PartnerAgreement['pricing']; commission: PartnerAgreement['commission']; allowBoth: boolean };
  currency: string;
  ratePlanId: string | null;
  nights: Array<{ date: string; publicRate: number; agreedRate: number }>;
  publicTotal: number;
  agreedTotal: number;
  roomNights: number;
  estimatedCommission: number;
  warnings: string[];
}

export interface QuoteResult {
  agreement: RoomQuote['agreement'];
  quotes: RoomQuote[];
}

/** What an agreement says, in a few words: what the guest pays and what the hotel owes. */
export function pricingSummary(a: Pick<PartnerAgreement, 'pricing'>, money: (n: number) => string): string {
  const p = a.pricing;
  switch (p.mode) {
    case 'percent_discount': return $localize`${p.value}% off the public rate`;
    case 'fixed_amount_off': return $localize`${money(p.value ?? 0)} off each night`;
    case 'fixed_rate': return $localize`Contracted rates (${p.fixedRates?.length ?? 0})`;
    default: return $localize`Public rate`;
  }
}
export function commissionSummary(a: Pick<PartnerAgreement, 'commission'>, money: (n: number) => string): string {
  const c = a.commission;
  if (!c?.enabled) return $localize`No commission`;
  switch (c.type) {
    case 'percent': return $localize`${c.value}% commission`;
    case 'fixed_per_room_night': return $localize`${money(c.value ?? 0)} per room night`;
    default: return $localize`${money(c.value ?? 0)} per stay`;
  }
}

/** Commercial agreements of a travel partner, and the server-side price quote that applies them. */
@Injectable({ providedIn: 'root' })
export class PartnerAgreementService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}`;

  list(storeId: string, partnerId: string, status?: string): Observable<PartnerAgreement[]> {
    let p = new HttpParams();
    if (status) p = p.set('status', status);
    return this.http.get<PartnerAgreement[]>(`${this.base(storeId)}/partners/${partnerId}/agreements`, { params: p });
  }

  get(storeId: string, id: string): Observable<PartnerAgreement> {
    return this.http.get<PartnerAgreement>(`${this.base(storeId)}/agreements/${id}`);
  }

  create(storeId: string, partnerId: string, input: AgreementInput): Observable<PartnerAgreement> {
    return this.http.post<PartnerAgreement>(`${this.base(storeId)}/partners/${partnerId}/agreements`, input);
  }

  update(storeId: string, id: string, input: AgreementInput): Observable<PartnerAgreement> {
    return this.http.put<PartnerAgreement>(`${this.base(storeId)}/agreements/${id}`, input);
  }

  setStatus(storeId: string, id: string, status: 'active' | 'inactive', reason?: string): Observable<PartnerAgreement> {
    return this.http.put<PartnerAgreement>(`${this.base(storeId)}/agreements/${id}/status`, { status, reason });
  }

  /** Price one or more rooms for a partner: which agreement applies, nightly prices under it, and the estimated commission. */
  quote(storeId: string, body: { partnerId: string; agreementId?: string; rooms: Array<{ roomTypeId: string; ratePlanId?: string | null; checkIn: string; checkOut: string }> }): Observable<QuoteResult> {
    return this.http.post<QuoteResult>(`${this.base(storeId)}/partner-quotes`, body);
  }
}
