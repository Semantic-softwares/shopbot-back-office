import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CashierShift {
  _id: string;
  user: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  businessDate?: string;
  openingFloat: number;
  drops: Array<{ amount: number; at: string; note?: string }>;
  countedCash?: number;
  expectedCash?: number;
  variance?: number;
  totalsByMethod?: Record<string, number>;
  notes?: string;
}

export interface ShiftSummary {
  expectedCash: number;
  totalsByMethod: Record<string, number>;
}

export interface CurrentShift {
  shift: CashierShift | null;
  summary?: ShiftSummary;
}

/** A cashier's till: open with a float, take drops, close with a count. */
@Injectable({ providedIn: 'root' })
export class CashierService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/cashier-shifts`;

  current(storeId: string): Observable<CurrentShift> {
    return this.http.get<CurrentShift>(`${this.base(storeId)}/current`);
  }
  list(storeId: string): Observable<CashierShift[]> {
    return this.http.get<CashierShift[]>(this.base(storeId));
  }
  open(storeId: string, openingFloat: number): Observable<CashierShift> {
    return this.http.post<CashierShift>(`${this.base(storeId)}/open`, { openingFloat });
  }
  drop(storeId: string, shiftId: string, amount: number, note?: string): Observable<CashierShift> {
    return this.http.post<CashierShift>(`${this.base(storeId)}/${shiftId}/drop`, { amount, note });
  }
  close(storeId: string, shiftId: string, body: { countedCash?: number; denominations?: Array<{ value: number; count: number }>; notes?: string }): Observable<CashierShift> {
    return this.http.post<CashierShift>(`${this.base(storeId)}/${shiftId}/close`, body);
  }
}
