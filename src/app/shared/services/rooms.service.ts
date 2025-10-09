import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Room,
  RoomType,
  CreateRoomRequest,
  UpdateRoomRequest,
  CreateRoomTypeRequest,
  UpdateRoomTypeRequest,
  RoomFilters,
  RoomTypeFilters,
  RoomStats,
  RoomTypeStats,
  AvailabilityRequest,
  AvailableRoom,
  AvailableRoomType,
  RoomStatus,
  HousekeepingStatus
} from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomsService {
  private baseUrl = environment.apiUrl;
  
  // Signal-based state management
  private roomsSignal = signal<Room[]>([]);
  private roomTypesSignal = signal<RoomType[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Getters for signals
  rooms = this.roomsSignal.asReadonly();
  roomTypes = this.roomTypesSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  // Room Management Methods
  
  /**
   * Get all rooms for a store with optional filtering
   */
  getRooms(storeId: string, filters?: RoomFilters): Observable<Room[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    let params = new HttpParams();
    if (filters) {
      if (filters.status?.length) {
        params = params.set('status', filters.status.join(','));
      }
      if (filters.housekeepingStatus?.length) {
        params = params.set('housekeepingStatus', filters.housekeepingStatus.join(','));
      }
      if (filters.roomType?.length) {
        params = params.set('roomType', filters.roomType.join(','));
      }
      if (filters.floor?.length) {
        params = params.set('floor', filters.floor.join(','));
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.http.get<Room[]>(`${this.baseUrl}/rooms/${storeId}/store`, { params })
      .pipe(
        tap(rooms => {
          this.roomsSignal.set(rooms);
          this.loadingSignal.set(false);
        }),
        map(rooms => rooms)
      );
  }

  /**
   * Get rooms grouped by floor
   */
  getRoomsByFloor(storeId: string): Observable<Record<number, Room[]>> {
    return this.http.get<Record<number, Room[]>>(`${this.baseUrl}/rooms/${storeId}/by-floor`);
  }

  /**
   * Get a single room by ID
   */
  getRoom(roomId: string): Observable<Room> {
    return this.http.get<Room>(`${this.baseUrl}/rooms/${roomId}`);
  }

  /**
   * Create a new room
   */
  createRoom(storeId: string, roomData: CreateRoomRequest): Observable<Room> {
    const payload = { ...roomData, store: storeId };
    return this.http.post<Room>(`${this.baseUrl}/rooms`, payload)
      .pipe(
        tap(newRoom => {
          const currentRooms = this.roomsSignal();
          this.roomsSignal.set([...currentRooms, newRoom]);
        })
      );
  }

  /**
   * Update an existing room
   */
  updateRoom(roomId: string, updateData: UpdateRoomRequest): Observable<Room> {
    return this.http.put<Room>(`${this.baseUrl}/rooms/${roomId}`, updateData)
      .pipe(
        tap(updatedRoom => {
          const currentRooms = this.roomsSignal();
          const index = currentRooms.findIndex(room => room._id === roomId || room.id === roomId);
          if (index !== -1) {
            const updated = [...currentRooms];
            updated[index] = updatedRoom;
            this.roomsSignal.set(updated);
          }
        })
      );
  }

  /**
   * Update room status
   */
  updateRoomStatus(roomId: string, status: RoomStatus, notes?: string): Observable<Room> {
    const payload = { status, notes };
    return this.http.put<Room>(`${this.baseUrl}/rooms/${roomId}/status`, payload);
  }

  /**
   * Update housekeeping status
   */
  updateHousekeepingStatus(roomId: string, housekeepingStatus: HousekeepingStatus, notes?: string): Observable<Room> {
    const payload = { housekeepingStatus, notes };
    return this.http.put<Room>(`${this.baseUrl}/rooms/${roomId}/housekeeping`, payload);
  }

  /**
   * Delete a room
   */
  deleteRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/rooms/${roomId}`)
      .pipe(
        tap(() => {
          const currentRooms = this.roomsSignal();
          this.roomsSignal.set(currentRooms.filter(room => room._id !== roomId && room.id !== roomId));
        })
      );
  }

  /**
   * Get available rooms for date range
   */
  getAvailableRooms(params: {
    storeId: string; 
    checkInDate: string; 
    checkOutDate: string; 
    roomTypeId?: string;
    excludeReservationId?: string;
  }): Observable<any[]> {
    let httpParams = new HttpParams()
      .set('checkIn', params.checkInDate)
      .set('checkOut', params.checkOutDate);
    
    if (params.roomTypeId) {
      httpParams = httpParams.set('roomTypeId', params.roomTypeId);
    }

    if (params.excludeReservationId) {
      httpParams = httpParams.set('excludeReservationId', params.excludeReservationId);
    }

    return this.http.get<{success: boolean, data: any[]}>(`${this.baseUrl}/rooms/${params.storeId}/availability`, { params: httpParams })
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Get room statistics
   */
  getRoomStats(storeId: string): Observable<RoomStats> {
    return this.http.get<RoomStats>(`${this.baseUrl}/rooms/${storeId}/stats`);
  }

  /**
   * Get maintenance rooms
   */
  getMaintenanceRooms(storeId: string): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/rooms/${storeId}/maintenance`);
  }

  /**
   * Bulk update room status
   */
  bulkUpdateRoomStatus(roomIds: string[], status: RoomStatus, notes?: string): Observable<void> {
    const payload = { roomIds, status, notes };
    return this.http.put<void>(`${this.baseUrl}/rooms/bulk/status`, payload);
  }

  // Room Type Management Methods

  /**
   * Get all room types for a store
   */
  getRoomTypes(storeId: string, filters?: RoomTypeFilters): Observable<RoomType[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    let params = new HttpParams();
    if (filters) {
      if (filters.active !== undefined) {
        params = params.set('active', filters.active.toString());
      }
      if (filters.minPrice !== undefined) {
        params = params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params = params.set('maxPrice', filters.maxPrice.toString());
      }
      if (filters.amenities?.length) {
        params = params.set('amenities', filters.amenities.join(','));
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.http.get<RoomType[]>(`${this.baseUrl}/room-types/${storeId}/store`, { params })
      .pipe(
        tap(roomTypes => {
          this.roomTypesSignal.set(roomTypes);
          this.loadingSignal.set(false);
        }),
        map(roomTypes => roomTypes)
      );
  }

  /**
   * Get a single room type by ID
   */
  getRoomType(roomTypeId: string): Observable<RoomType> {
    return this.http.get<RoomType>(`${this.baseUrl}/room-types/${roomTypeId}`);
  }

  /**
   * Create a new room type
   */
  createRoomType(storeId: string, roomTypeData: CreateRoomTypeRequest): Observable<RoomType> {
    const payload = { ...roomTypeData, store: storeId };
    return this.http.post<RoomType>(`${this.baseUrl}/room-types`, payload)
      .pipe(
        tap(newRoomType => {
          const currentRoomTypes = this.roomTypesSignal();
          this.roomTypesSignal.set([...currentRoomTypes, newRoomType]);
        })
      );
  }

  /**
   * Update an existing room type
   */
  updateRoomType(roomTypeId: string, updateData: UpdateRoomTypeRequest): Observable<RoomType> {
    return this.http.put<RoomType>(`${this.baseUrl}/room-types/${roomTypeId}`, updateData)
      .pipe(
        tap(updatedRoomType => {
          const currentRoomTypes = this.roomTypesSignal();
          const index = currentRoomTypes.findIndex(rt => rt._id === roomTypeId || rt.id === roomTypeId);
          if (index !== -1) {
            const updated = [...currentRoomTypes];
            updated[index] = updatedRoomType;
            this.roomTypesSignal.set(updated);
          }
        })
      );
  }

  /**
   * Delete a room type
   */
  deleteRoomType(roomTypeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/room-types/${roomTypeId}`)
      .pipe(
        tap(() => {
          const currentRoomTypes = this.roomTypesSignal();
          this.roomTypesSignal.set(currentRoomTypes.filter(rt => rt._id !== roomTypeId && rt.id !== roomTypeId));
        })
      );
  }

  /**
   * Get available room types for date range
   */
  getAvailableRoomTypes(storeId: string, checkIn: string, checkOut: string): Observable<AvailableRoomType[]> {
    const params = new HttpParams()
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);

    return this.http.get<AvailableRoomType[]>(`${this.baseUrl}/room-types/${storeId}/availability`, { params });
  }

  /**
   * Update room types sort order
   */
  updateRoomTypesSortOrder(storeId: string, sortData: { id: string; sortOrder: number }[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/room-types/${storeId}/sort-order`, sortData);
  }

  /**
   * Get room type statistics
   */
  getRoomTypeStats(storeId: string): Observable<RoomTypeStats[]> {
    return this.http.get<RoomTypeStats[]>(`${this.baseUrl}/room-types/${storeId}/stats`);
  }

  // Utility Methods

  /**
   * Clear state
   */
  clearState(): void {
    this.roomsSignal.set([]);
    this.roomTypesSignal.set([]);
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.errorSignal.set(error);
  }
}