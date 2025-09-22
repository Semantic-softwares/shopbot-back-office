import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface OccupancyData {
  date: Date;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  outOfOrderRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  revenue: number;
  averageRate: number;
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
  peakOccupancyDate: Date;
  lowestOccupancyDate: Date;
  peakOccupancyRate: number;
  lowestOccupancyRate: number;
}

export interface OccupancyFilters {
  startDate: Date;
  endDate: Date;
  reportType: 'daily' | 'weekly' | 'monthly';
  roomType?: string;
  floorNumber?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OccupancyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/occupancy`;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Get occupancy data for a specific date range
   */
  getOccupancyData(filters: OccupancyFilters): Observable<OccupancyData[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType);

    if (filters.roomType) {
      params = params.set('roomType', filters.roomType);
    }

    if (filters.floorNumber && !isNaN(filters.floorNumber)) {
      params = params.set('floorNumber', filters.floorNumber.toString());
    }

    return this.http.get<OccupancyData[]>(`${this.baseUrl}/data`, { params }).pipe(
      map(data => {
        this.loadingSubject.next(false);
        return data.map(item => ({
          ...item,
          date: new Date(item.date)
        }));
      }),
      catchError(error => {
        console.error('Error fetching occupancy data:', error);
        this.errorSubject.next('Failed to load occupancy data. Using mock data for demonstration.');
        this.loadingSubject.next(false);
        
        // Return mock data on error
        return of(this.generateMockOccupancyData(filters.startDate, filters.endDate));
      })
    );
  }

  /**
   * Get current room statuses
   */
  getRoomStatuses(floorNumber?: number): Observable<RoomStatus[]> {
    let params = new HttpParams();
    
    if (floorNumber && !isNaN(floorNumber)) {
      params = params.set('floor', floorNumber.toString());
    }
    
    return this.http.get<RoomStatus[]>(`${this.baseUrl}/rooms`, { params }).pipe(
      map(rooms => rooms.map(room => ({
        ...room,
        checkIn: room.checkIn ? new Date(room.checkIn) : undefined,
        checkOut: room.checkOut ? new Date(room.checkOut) : undefined
      }))),
      catchError(error => {
        console.error('Error fetching room statuses:', error);
        return of(this.generateMockRoomStatuses());
      })
    );
  }

  /**
   * Get occupancy statistics summary
   */
  getOccupancyStats(filters: OccupancyFilters): Observable<OccupancyStats> {
    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType);

    if (filters.roomType) {
      params = params.set('roomType', filters.roomType);
    }

    if (filters.floorNumber && !isNaN(filters.floorNumber)) {
      params = params.set('floorNumber', filters.floorNumber.toString());
    }

    return this.http.get<OccupancyStats>(`${this.baseUrl}/stats`, { params }).pipe(
      map(stats => ({
        ...stats,
        peakOccupancyDate: new Date(stats.peakOccupancyDate),
        lowestOccupancyDate: new Date(stats.lowestOccupancyDate)
      })),
      catchError(error => {
        console.error('Error fetching occupancy stats:', error);
        
        // Return mock stats on error
        return of({
          totalRooms: 100,
          currentOccupied: 75,
          currentAvailable: 20,
          currentOOO: 3,
          currentMaintenance: 2,
          currentOccupancyRate: 75,
          averageOccupancyRate: 72.5,
          totalRevenue: 156750,
          averageRate: 209,
          peakOccupancyDate: new Date(),
          lowestOccupancyDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          peakOccupancyRate: 95,
          lowestOccupancyRate: 45
        });
      })
    );
  }

  /**
   * Export occupancy data to CSV
   */
  exportToCSV(filters: OccupancyFilters): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType)
      .set('format', 'csv');

    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error exporting data:', error);
        this.errorSubject.next('Failed to export data. Please try again.');
        throw error;
      })
    );
  }

  /**
   * Export occupancy data to PDF
   */
  exportToPDF(filters: OccupancyFilters): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString())
      .set('reportType', filters.reportType)
      .set('format', 'pdf');

    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error exporting PDF:', error);
        this.errorSubject.next('Failed to export PDF. Please try again.');
        throw error;
      })
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Generate mock occupancy data for fallback
   */
  private generateMockOccupancyData(startDate: Date, endDate: Date): OccupancyData[] {
    const data: OccupancyData[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const totalRooms = 100;
      const occupiedRooms = Math.floor(Math.random() * 85) + 10; // 10-95 occupied
      const outOfOrderRooms = Math.floor(Math.random() * 5); // 0-5 OOO
      const maintenanceRooms = Math.floor(Math.random() * 3); // 0-3 maintenance
      const availableRooms = totalRooms - occupiedRooms - outOfOrderRooms - maintenanceRooms;
      const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
      const averageRate = 150 + Math.random() * 100; // $150-$250
      const revenue = occupiedRooms * averageRate;
      const reservationCount = occupiedRooms + Math.floor(Math.random() * 10);

      data.push({
        date: new Date(current),
        totalRooms,
        occupiedRooms,
        availableRooms,
        outOfOrderRooms,
        maintenanceRooms,
        occupancyRate,
        revenue,
        averageRate,
        reservationCount
      });

      current.setDate(current.getDate() + 1);
    }

    return data;
  }

  /**
   * Generate mock room statuses for fallback
   */
  private generateMockRoomStatuses(): RoomStatus[] {
    const statuses: RoomStatus[] = [];
    const statusTypes: RoomStatus['status'][] = ['occupied', 'available', 'out-of-order', 'maintenance'];
    const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];
    const floors = [1, 2, 3, 4, 5];

    for (let i = 101; i <= 200; i++) {
      const status = statusTypes[Math.floor(Math.random() * statusTypes.length)];
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const floorNumber = floors[Math.floor(Math.random() * floors.length)];

      const room: RoomStatus = {
        roomNumber: i.toString(),
        roomType,
        floorNumber,
        status
      };

      if (status === 'occupied') {
        const guestNames = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'];
        room.guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
        room.guestId = `guest_${i}`;
        room.checkIn = new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
        room.checkOut = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
        room.rate = 150 + Math.random() * 100;
      } else if (status === 'maintenance') {
        room.notes = 'Scheduled maintenance - AC repair';
      } else if (status === 'out-of-order') {
        room.notes = 'Plumbing issue - under repair';
      }

      statuses.push(room);
    }

    return statuses.sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
  }
}