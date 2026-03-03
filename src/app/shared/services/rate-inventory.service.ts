import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RatePlan {
  _id: string;
  store: string;
  roomType: any;
  name: string;
  description: string;
  baseRate: number;
  otaBaseRate: number | null;
  currency: string;
  dayOfWeekRates: {
    monday: number | null;
    tuesday: number | null;
    wednesday: number | null;
    thursday: number | null;
    friday: number | null;
    saturday: number | null;
    sunday: number | null;
  };
  seasonalRates: Array<{
    name: string;
    startDate: string;
    endDate: string;
    rate: number;
    priority: number;
  }>;
  restrictions: {
    minStay: number;
    maxStay: number;
    closedToArrival: boolean;
    closedToDeparture: boolean;
  };
  isDefault: boolean;
  active: boolean;
  channex?: {
    ratePlanId: string;
    lastSyncAt: string;
    syncStatus: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RateInventoryRecord {
  _id: string;
  store: string;
  roomType: string;
  ratePlan: any;
  date: string;
  rate: number;
  currency: string;
  otaRate: number | null;
  otaCurrency: string | null;
  availability: number;
  restrictions: {
    minStay: number;
    maxStay: number;
    closedToArrival: boolean;
    closedToDeparture: boolean;
    stopSell: boolean;
  };
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface NightRate {
  date: string;
  rate: number;
  source: string;
}

export interface StayRates {
  nights: NightRate[];
  totalRate: number;
  averageRate: number;
  numberOfNights: number;
}

export interface AvailabilityCheck {
  available: boolean;
  minAvailability: number;
  dailyAvailability: Array<{ date: string; availability: number }>;
}

export interface InventoryGrid {
  roomTypes: Array<{
    _id: string;
    name: string;
    basePrice: number;
    totalRooms: number;
    ratePlans: RatePlan[];
    [key: string]: any;
  }>;
  grid: Record<string, Record<string, Record<string, RateInventoryRecord | AvailabilityCell>>>;
}

export interface AvailabilityCell {
  availability: number;
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
    stopSell?: boolean;
  };
}

export interface BulkSetResult {
  upsertedCount: number;
  modifiedCount: number;
}

export interface ChannexSyncResult {
  success: boolean;
  availabilityCount: number;
  restrictionsCount: number;
  warnings: any[];
}

@Injectable({ providedIn: 'root' })
export class RateInventoryService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ─────────────────────────────────────────────
  // RATE PLANS
  // ─────────────────────────────────────────────

  createRatePlan(storeId: string, data: Partial<RatePlan>): Observable<RatePlan> {
    return this.http.post<RatePlan>(`${this.baseUrl}/stores/${storeId}/rate-plans`, data);
  }

  getRatePlans(storeId: string): Observable<RatePlan[]> {
    return this.http.get<RatePlan[]>(`${this.baseUrl}/stores/${storeId}/rate-plans`);
  }

  getRatePlansByRoomType(storeId: string, roomTypeId: string): Observable<RatePlan[]> {
    return this.http.get<RatePlan[]>(
      `${this.baseUrl}/stores/${storeId}/room-types/${roomTypeId}/rate-plans`,
    );
  }

  getRatePlan(id: string): Observable<RatePlan> {
    return this.http.get<RatePlan>(`${this.baseUrl}/rate-plans/${id}`);
  }

  updateRatePlan(id: string, data: Partial<RatePlan>): Observable<RatePlan> {
    return this.http.put<RatePlan>(`${this.baseUrl}/rate-plans/${id}`, data);
  }

  deleteRatePlan(id: string): Observable<RatePlan> {
    return this.http.delete<RatePlan>(`${this.baseUrl}/rate-plans/${id}`);
  }

  syncRatePlanToChannex(storeId: string, ratePlanId: string): Observable<RatePlan> {
    return this.http.post<RatePlan>(
      `${this.baseUrl}/stores/${storeId}/rate-plans/${ratePlanId}/sync-to-channex`,
      {},
    );
  }

  // ─────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────

  getInventoryGrid(storeId: string, startDate: string, endDate: string): Observable<InventoryGrid> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<InventoryGrid>(`${this.baseUrl}/stores/${storeId}/inventory`, { params });
  }

  getInventory(
    storeId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string,
    ratePlanId?: string,
  ): Observable<RateInventoryRecord[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    if (ratePlanId) params = params.set('ratePlanId', ratePlanId);

    return this.http.get<RateInventoryRecord[]>(
      `${this.baseUrl}/stores/${storeId}/room-types/${roomTypeId}/inventory`,
      { params },
    );
  }

  setInventory(
    storeId: string,
    roomTypeId: string,
    data: {
      date: string;
      rate?: number;
      otaRate?: number;
      otaCurrency?: string;
      availability?: number;
      restrictions?: any;
      ratePlanId?: string;
    },
  ): Observable<RateInventoryRecord> {
    return this.http.post<RateInventoryRecord>(
      `${this.baseUrl}/stores/${storeId}/room-types/${roomTypeId}/inventory`,
      data,
    );
  }

  bulkSetInventory(
    storeId: string,
    roomTypeId: string,
    data: {
      startDate: string;
      endDate: string;
      rate?: number;
      otaRate?: number;
      otaCurrency?: string;
      availability?: number;
      restrictions?: any;
      ratePlanId?: string;
      dayOfWeekRates?: Record<string, number>;
      dayOfWeekOtaRates?: Record<string, number>;
    },
  ): Observable<BulkSetResult> {
    return this.http.post<BulkSetResult>(
      `${this.baseUrl}/stores/${storeId}/room-types/${roomTypeId}/inventory/bulk`,
      data,
    );
  }

  generateFromRatePlan(
    storeId: string,
    ratePlanId: string,
    startDate: string,
    endDate: string,
  ): Observable<BulkSetResult> {
    return this.http.post<BulkSetResult>(
      `${this.baseUrl}/stores/${storeId}/rate-plans/${ratePlanId}/generate-inventory`,
      { startDate, endDate },
    );
  }

  // ─────────────────────────────────────────────
  // PRICING & AVAILABILITY
  // ─────────────────────────────────────────────

  getRatesForStay(
    storeId: string,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    ratePlanId?: string,
  ): Observable<StayRates> {
    let params = new HttpParams()
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);
    if (ratePlanId) params = params.set('ratePlanId', ratePlanId);

    return this.http.get<StayRates>(
      `${this.baseUrl}/stores/${storeId}/room-types/${roomTypeId}/rates`,
      { params },
    );
  }

  checkAvailability(
    storeId: string,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
  ): Observable<AvailabilityCheck> {
    const params = new HttpParams()
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);

    return this.http.get<AvailabilityCheck>(
      `${this.baseUrl}/stores/${storeId}/room-types/${roomTypeId}/availability`,
      { params },
    );
  }

  // ─────────────────────────────────────────────
  // CHANNEX SYNC
  // ─────────────────────────────────────────────

  syncToChannex(
    storeId: string,
    startDate: string,
    endDate: string,
    roomTypeId?: string,
  ): Observable<ChannexSyncResult> {
    const body: any = { startDate, endDate };
    if (roomTypeId) body.roomTypeId = roomTypeId;

    return this.http.post<ChannexSyncResult>(
      `${this.baseUrl}/stores/${storeId}/inventory/sync-to-channex`,
      body,
    );
  }
}
