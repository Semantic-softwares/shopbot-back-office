import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AttentionSeverity = 'critical' | 'warning' | 'info';

export interface AttentionItem {
  code: string;
  severity: AttentionSeverity;
  count: number;
  samples: Array<{ id: string; kind: 'reservation' | 'room'; label: string; amount?: number }>;
}

export interface DashboardStay {
  id: string;
  guest: string;
  rooms: string;
  status: string;
  vip: boolean;
  nights: number;
  adults: number;
  children: number;
  balance: number;
  source: string;
  notes: string;
}

export interface HotelDashboard {
  generatedAt: string;
  today: string;
  currency: string;
  canSeeMoney: boolean;
  businessDay: { enabled: boolean; businessDate: string | null; daysBehind: number };
  kpis: {
    occupancy: { percent: number | null; roomsSold: number; sellableRooms: number; yesterdayPercent: number | null; lastWeekPercent: number | null };
    arrivals: { expected: number; arrived: number; tomorrow: number };
    departures: { due: number; left: number; tomorrow: number };
    inHouse: { stays: number; guests: number };
    revenue?: { today: number; yesterday: number; monthToDate: number; lastMonthSamePeriod: number; adr: number | null; revpar: number | null; adrYesterday: number | null };
    balanceDue?: number;
  };
  attention: AttentionItem[];
  arrivalsToday: DashboardStay[];
  departuresToday: DashboardStay[];
  rooms: { total: number; occupied: number; vacantClean: number; dirty: number; outOfOrder: number; byType: Array<{ name: string; total: number; occupied: number }> };
  roomMap: Array<{ id: string; number: string; type: string; state: 'occupied' | 'ready' | 'dirty' | 'out_of_order'; guest: string; checkOut: string }>;
  trend: Array<{ date: string; occupancy: number | null; roomsSold: number; arrivals: number; departures: number; roomRevenue?: number; adr?: number | null; future: boolean }>;
  sources?: Array<{ source: string; nights: number; revenue: number }>;
  payments?: { total: number; byMethod: Array<{ method: string; amount: number }>; shiftsOpen: number };
  roomOrders?: { orders: number; total: number; unpaid: number };
  activity: Array<{ id: string; type: string; guest: string; rooms: string; at: string }>;
}

/** The hotel overview, computed on the server from the same numbers the reports use. */
@Injectable({ providedIn: 'root' })
export class HotelDashboardService {
  private http = inject(HttpClient);

  get(storeId: string): Observable<HotelDashboard> {
    return this.http.get<HotelDashboard>(`${environment.apiUrl}/stores/${storeId}/hotel-dashboard`);
  }
}
