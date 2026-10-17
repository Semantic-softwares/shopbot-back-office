import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { toDateOnly } from '../utils/date-only';

export interface OccupancyData {
  date: Date;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  outOfOrderRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  /** Room revenue for the nights in the period (before taxes and fees). */
  revenue: number;
  /** ADR: room revenue per room sold. */
  averageRate: number;
  /** Room revenue per available room. */
  revpar?: number;
  reservationCount: number;
}

export interface RoomStatus {
  roomNumber: string;
  roomType: string;
  floorNumber: number;
  status: 'occupied' | 'available' | 'out-of-order' | 'maintenance';
  guestName?: string;
  guestId?: string;
  checkIn?: Date;
  checkOut?: Date;
  rate?: number;
  notes?: string;
}

export interface OccupancyStats {
  totalRooms: number;
  currentOccupied: number;
  currentAvailable: number;
  currentOOO: number;
  currentMaintenance: number;
  currentOccupancyRate: number;
  averageOccupancyRate: number;
  totalRevenue: number;
  averageRate: number;
  revpar?: number;
  peakOccupancyDate: Date;
  lowestOccupancyDate: Date;
  peakOccupancyRate: number;
  lowestOccupancyRate: number;
}

export interface OccupancyFilters {
  startDate: Date | string;
  endDate: Date | string;
  reportType: 'daily' | 'weekly' | 'monthly';
  /** Room type id. */
  roomType?: string;
  floorNumber?: number;
}

/** Loads occupancy from the server. A failure is an error for the screen to show, never invented numbers. */
@Injectable({ providedIn: 'root' })
export class OccupancyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/occupancy`;

  private params(filters: OccupancyFilters, extra: Record<string, string> = {}): HttpParams {
    let params = new HttpParams()
      .set('startDate', toDateOnly(filters.startDate))
      .set('endDate', toDateOnly(filters.endDate))
      .set('reportType', filters.reportType);
    if (filters.roomType) params = params.set('roomType', filters.roomType);
    if (filters.floorNumber && !isNaN(filters.floorNumber)) params = params.set('floorNumber', String(filters.floorNumber));
    for (const [key, value] of Object.entries(extra)) params = params.set(key, value);
    return params;
  }

  getOccupancyData(filters: OccupancyFilters): Observable<OccupancyData[]> {
    return this.http
      .get<OccupancyData[]>(`${this.baseUrl}/data`, { params: this.params(filters) })
      .pipe(map((data) => data.map((item) => ({ ...item, date: new Date(item.date) }))));
  }

  /** Live room board: who is checked in to each room right now. */
  getRoomStatuses(floorNumber?: number): Observable<RoomStatus[]> {
    let params = new HttpParams();
    if (floorNumber && !isNaN(floorNumber)) params = params.set('floor', String(floorNumber));
    return this.http.get<RoomStatus[]>(`${this.baseUrl}/rooms`, { params }).pipe(
      map((rooms) => rooms.map((room) => ({
        ...room,
        checkIn: room.checkIn ? new Date(room.checkIn) : undefined,
        checkOut: room.checkOut ? new Date(room.checkOut) : undefined,
      }))),
    );
  }

  getOccupancyStats(filters: OccupancyFilters): Observable<OccupancyStats> {
    return this.http.get<OccupancyStats>(`${this.baseUrl}/stats`, { params: this.params(filters) }).pipe(
      map((stats) => ({
        ...stats,
        peakOccupancyDate: new Date(stats.peakOccupancyDate),
        lowestOccupancyDate: new Date(stats.lowestOccupancyDate),
      })),
    );
  }

  exportToCSV(filters: OccupancyFilters): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { params: this.params(filters, { format: 'csv' }), responseType: 'blob' });
  }
}
