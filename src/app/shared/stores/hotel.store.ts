import { Injectable, computed, signal, inject } from '@angular/core';
import { HotelService } from '../services/hotel.service';
import { Room, RoomType, Guest, Reservation } from '../models/hotel.models';
import { HotelSettings } from '../models/store.model';
import { StoreStore } from './store.store';

@Injectable({
  providedIn: 'root'
})
export class HotelStore {
  private hotelService = inject(HotelService);
  private storeStore = inject(StoreStore);

  // Hotel Settings State
  private _hotelSettings = signal<HotelSettings | null>(null);
  private _hotelSettingsLoading = signal(false);
  
  // Room Types State
  private _roomTypes = signal<RoomType[]>([]);
  private _roomTypesLoading = signal(false);
  
  // Rooms State
  private _rooms = signal<Room[]>([]);
  private _roomsLoading = signal(false);
  private _roomsTotal = signal(0);
  
  // Guests State
  private _guests = signal<Guest[]>([]);
  private _guestsLoading = signal(false);
  private _guestsTotal = signal(0);
  
  // Reservations State
  private _reservations = signal<Reservation[]>([]);
  private _reservationsLoading = signal(false);
  private _reservationsTotal = signal(0);
  
  // Dashboard Stats State
  private _dashboardStats = signal<any>(null);
  private _dashboardStatsLoading = signal(false);

  // Public readonly signals
  hotelSettings = this._hotelSettings.asReadonly();
  hotelSettingsLoading = this._hotelSettingsLoading.asReadonly();
  
  roomTypes = this._roomTypes.asReadonly();
  roomTypesLoading = this._roomTypesLoading.asReadonly();
  
  rooms = this._rooms.asReadonly();
  roomsLoading = this._roomsLoading.asReadonly();
  roomsTotal = this._roomsTotal.asReadonly();
  
  guests = this._guests.asReadonly();
  guestsLoading = this._guestsLoading.asReadonly();
  guestsTotal = this._guestsTotal.asReadonly();
  
  reservations = this._reservations.asReadonly();
  reservationsLoading = this._reservationsLoading.asReadonly();
  reservationsTotal = this._reservationsTotal.asReadonly();
  
  dashboardStats = this._dashboardStats.asReadonly();
  dashboardStatsLoading = this._dashboardStatsLoading.asReadonly();

  // Computed values
  availableRooms = computed(() => 
    this.rooms().filter(room => room.status === 'available')
  );
  
  occupiedRooms = computed(() => 
    this.rooms().filter(room => room.status === 'occupied')
  );
  
  maintenanceRooms = computed(() => 
    this.rooms().filter(room => room.status === 'maintenance' || room.status === 'out_of_order')
  );
  
  todayReservations = computed(() => {
    const today = new Date().toDateString();
    return this.reservations().filter(reservation => 
      new Date(reservation.checkInDate).toDateString() === today
    );
  });

  // Hotel Settings Actions
  async loadHotelSettings() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this._hotelSettingsLoading.set(true);
    try {
      const settings = await this.hotelService.getHotelSettings(storeId).toPromise();
      this._hotelSettings.set(settings || null);
    } catch (error) {
      console.error('Error loading hotel settings:', error);
      this._hotelSettings.set(null);
    } finally {
      this._hotelSettingsLoading.set(false);
    }
  }

  async updateHotelSettings(settings: Partial<HotelSettings>) {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this._hotelSettingsLoading.set(true);
    try {
      const updatedSettings = await this.hotelService.updateHotelSettings(storeId, settings).toPromise();
      this._hotelSettings.set(updatedSettings || null);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating hotel settings:', error);
      throw error;
    } finally {
      this._hotelSettingsLoading.set(false);
    }
  }

  // Room Types Actions
  async loadRoomTypes() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this._roomTypesLoading.set(true);
    try {
      const roomTypes = await this.hotelService.getRoomTypes(storeId).toPromise();
      this._roomTypes.set(roomTypes || []);
    } catch (error) {
      console.error('Error loading room types:', error);
      this._roomTypes.set([]);
    } finally {
      this._roomTypesLoading.set(false);
    }
  }

  async createRoomType(roomType: Partial<RoomType>) {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    try {
      const newRoomType = await this.hotelService.createRoomType(storeId, roomType).toPromise();
      if (newRoomType) {
        this._roomTypes.update(types => [...types, newRoomType]);
      }
      return newRoomType;
    } catch (error) {
      console.error('Error creating room type:', error);
      throw error;
    }
  }

  // Rooms Actions
  async loadRooms(params?: any) {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this._roomsLoading.set(true);
    try {
      const response = await this.hotelService.getRooms(storeId, params).toPromise();
      this._rooms.set(response?.rooms || []);
      this._roomsTotal.set(response?.total || 0);
    } catch (error) {
      console.error('Error loading rooms:', error);
      this._rooms.set([]);
      this._roomsTotal.set(0);
    } finally {
      this._roomsLoading.set(false);
    }
  }

  async updateRoomStatus(roomId: string, status: string, notes?: string) {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    try {
      const updatedRoom = await this.hotelService.updateRoomStatus(storeId, roomId, status, notes).toPromise();
      if (updatedRoom) {
        this._rooms.update(rooms => 
          rooms.map(room => room._id === roomId ? updatedRoom : room)
        );
      }
      return updatedRoom;
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  }

  // Guests Actions
  async loadGuests(params?: any) {
    this._guestsLoading.set(true);
    try {
      const response = await this.hotelService.getGuests(params).toPromise();
      this._guests.set(response?.guests || []);
      this._guestsTotal.set(response?.total || 0);
    } catch (error) {
      console.error('Error loading guests:', error);
      this._guests.set([]);
      this._guestsTotal.set(0);
    } finally {
      this._guestsLoading.set(false);
    }
  }

  // Reservations Actions
  async loadReservations(params?: any) {
    this._reservationsLoading.set(true);
    try {
      const response = await this.hotelService.getReservations(params).toPromise();
      this._reservations.set(response?.reservations || []);
      this._reservationsTotal.set(response?.total || 0);
    } catch (error) {
      console.error('Error loading reservations:', error);
      this._reservations.set([]);
      this._reservationsTotal.set(0);
    } finally {
      this._reservationsLoading.set(false);
    }
  }

  // Dashboard Stats Actions
  async loadDashboardStats() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this._dashboardStatsLoading.set(true);
    try {
      const stats = await this.hotelService.getDashboardStats(storeId).toPromise();
      this._dashboardStats.set(stats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this._dashboardStats.set(null);
    } finally {
      this._dashboardStatsLoading.set(false);
    }
  }

  // Utility Methods
  reset() {
    this._hotelSettings.set(null);
    this._roomTypes.set([]);
    this._rooms.set([]);
    this._guests.set([]);
    this._reservations.set([]);
    this._dashboardStats.set(null);
  }
}