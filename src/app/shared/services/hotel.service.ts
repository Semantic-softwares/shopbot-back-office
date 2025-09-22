import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HotelSettings, Room, RoomType, Guest, Reservation } from '../models/hotel.models';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Hotel Settings
  getHotelSettings(storeId: string): Observable<HotelSettings> {
    return this.http.get<HotelSettings>(`${this.apiUrl}/hotels/${storeId}/settings`);
  }

  updateHotelSettings(storeId: string, settings: Partial<HotelSettings>): Observable<HotelSettings> {
    return this.http.put<HotelSettings>(`${this.apiUrl}/hotels/${storeId}/settings`, settings);
  }

  initializeHotel(storeId: string, settings: Partial<HotelSettings>): Observable<HotelSettings> {
    return this.http.post<HotelSettings>(`${this.apiUrl}/hotels/${storeId}/initialize`, settings);
  }

  // Dashboard Stats
  getDashboardStats(storeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/hotels/${storeId}/dashboard`);
  }

  // Room Types
  getRoomTypes(storeId: string): Observable<RoomType[]> {
    return this.http.get<RoomType[]>(`${this.apiUrl}/room-types/${storeId}`);
  }

  createRoomType(storeId: string, roomType: Partial<RoomType>): Observable<RoomType> {
    return this.http.post<RoomType>(`${this.apiUrl}/room-types/${storeId}`, roomType);
  }

  updateRoomType(storeId: string, roomTypeId: string, roomType: Partial<RoomType>): Observable<RoomType> {
    return this.http.put<RoomType>(`${this.apiUrl}/room-types/${storeId}/${roomTypeId}`, roomType);
  }

  deleteRoomType(storeId: string, roomTypeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/room-types/${storeId}/${roomTypeId}`);
  }

  // Rooms
  getRooms(storeId: string, params?: any): Observable<{ rooms: Room[], total: number }> {
    return this.http.get<{ rooms: Room[], total: number }>(`${this.apiUrl}/rooms/${storeId}`, { params });
  }

  createRoom(storeId: string, room: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/rooms/${storeId}`, room);
  }

  updateRoom(storeId: string, roomId: string, room: Partial<Room>): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/rooms/${storeId}/${roomId}`, room);
  }

  deleteRoom(storeId: string, roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rooms/${storeId}/${roomId}`);
  }

  updateRoomStatus(storeId: string, roomId: string, status: string, notes?: string): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/rooms/${storeId}/${roomId}/status`, { status, notes });
  }

  getAvailableRooms(storeId: string, checkIn: string, checkOut: string, roomTypeId?: string): Observable<Room[]> {
    const params: any = { checkIn, checkOut };
    if (roomTypeId) params.roomTypeId = roomTypeId;
    return this.http.get<Room[]>(`${this.apiUrl}/rooms/${storeId}/availability`, { params });
  }

  // Guests
  getGuests(params?: any): Observable<{ guests: Guest[], total: number }> {
    return this.http.get<{ guests: Guest[], total: number }>(`${this.apiUrl}/guests`, { params });
  }

  createGuest(guest: Partial<Guest>): Observable<Guest> {
    return this.http.post<Guest>(`${this.apiUrl}/guests`, guest);
  }

  updateGuest(guestId: string, guest: Partial<Guest>): Observable<Guest> {
    return this.http.put<Guest>(`${this.apiUrl}/guests/${guestId}`, guest);
  }

  deleteGuest(guestId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/guests/${guestId}`);
  }

  searchGuestByPhone(phone: string): Observable<Guest> {
    return this.http.get<Guest>(`${this.apiUrl}/guests/search/phone/${phone}`);
  }

  searchGuestByEmail(email: string): Observable<Guest> {
    return this.http.get<Guest>(`${this.apiUrl}/guests/search/email/${email}`);
  }

  // Reservations
  getReservations(params?: any): Observable<{ reservations: Reservation[], total: number }> {
    return this.http.get<{ reservations: Reservation[], total: number }>(`${this.apiUrl}/reservations`, { params });
  }

  createReservation(reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/reservations`, reservation);
  }

  updateReservation(reservationId: string, reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${reservationId}`, reservation);
  }

  cancelReservation(reservationId: string, reason: string, refundAmount?: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${reservationId}/cancel`, { reason, refundAmount });
  }

  checkInReservation(reservationId: string, checkInData?: any): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${reservationId}/check-in`, checkInData || {});
  }

  checkOutReservation(reservationId: string, checkOutData?: any): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${reservationId}/check-out`, checkOutData || {});
  }

  getReservationCalendar(storeId: string, start: string, end: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reservations/calendar/${storeId}`, { params: { start, end } });
  }

  checkReservationConflicts(storeId: string, roomId: string, checkIn: string, checkOut: string, excludeReservationId?: string): Observable<{ hasConflicts: boolean, conflicts: any[] }> {
    const params: any = { storeId, roomId, checkIn, checkOut };
    if (excludeReservationId) params.excludeReservationId = excludeReservationId;
    return this.http.get<{ hasConflicts: boolean, conflicts: any[] }>(`${this.apiUrl}/reservations/conflicts/check`, { params });
  }
}