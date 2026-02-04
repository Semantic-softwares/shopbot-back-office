import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ChannexSyncRequest {
  propertyType?: 'hotel' | 'hostel' | 'apartment' | 'guesthouse';
  checkInTime?: string;
  checkOutTime?: string;
}

export interface ChannexSyncResponse {
  success: boolean;
  message: string;
  store: {
    id: string;
    name: string;
    channexPropertyId: string;
  };
}

export interface RoomTypeSyncRequest {
  code?: string;
}

export interface RoomTypeSyncResponse {
  success: boolean;
  message: string;
  channexRoomTypeId: string;
  mapping: {
    id: string;
  };
}

export interface AvailabilityPushRequest {
  startDate: string;
  endDate: string;
}

export interface AvailabilityPushResponse {
  success: boolean;
  message: string;
}

export interface ChannelAuthUrlResponse {
  success: boolean;
  authorization_url: string;
}

export interface ChannelCallbackRequest {
  code: string;
  state?: string;
}

export interface ChannelCallbackResponse {
  success: boolean;
  channel: string;
  status: string;
  message: string;
}

export interface ChannelConnectionKeyResponse {
  success: boolean;
  data: {
    oneTimeKey: string;
    iframeUrl: string;
  };
}

export interface ConnectedChannel {
  id: string;
  name: string;
  connectedAt: string;
  bookingsCount: number;
  status: 'active' | 'inactive' | 'error';
}

export interface AvailableChannel {
  id: string;
  name: string;
  description: string;
  logo?: string;
}

export interface ChannelsListResponse {
  success: boolean;
  connected: ConnectedChannel[];
  available: AvailableChannel[];
}

export interface ChannexStatusResponse {
  success: boolean;
  data: {
    channex: {
      propertyId: string;
      syncEnabled: boolean;
      syncStatus: 'not_synced' | 'syncing' | 'synced' | 'error';
      lastSyncAt: string;
      oneTimeKey?: string;
      oneTimeKeyExpiry?: string;
      channelsConnected?: boolean;
      connectedChannels?: Array<{
        channelId: string;
        channelName: string;
        connectedAt: string;
        status: 'active' | 'disconnected' | 'error';
      }>;
      metadata?: {
        channelManager: string;
        propertyType: string;
        currency: string;
        timezone: string;
      };
    };
    roomMappings: Array<{
      _id: string;
      channexRoomTypeId: string;
      roomType: {
        _id: string;
        name: string;
      };
      syncEnabled: boolean;
      lastSyncAt?: string;
    }>;
    totalRoomTypes: number;
    syncEnabled: boolean;
  };
}

export interface ChannexReservation {
  _id: string;
  confirmationNumber: string;
  guest: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  checkInDate: string;
  checkOutDate: string;
  status: string;
  channex: {
    bookingId: string;
    channelType: string;
    channelBookingId: string;
  };
}

export interface ChannexReservationsResponse {
  success: boolean;
  count: number;
  data: ChannexReservation[];
}

@Injectable({
  providedIn: 'root'
})
export class ChannexService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Signal-based state
  private syncingStore = signal(false);
  private syncingRoomTypes = signal<Set<string>>(new Set());
  private pushingAvailability = signal(false);
  private connectingChannel = signal<string | null>(null);

  // Readonly signals
  readonly isSyncingStore = this.syncingStore.asReadonly();
  readonly syncingRoomTypes$ = this.syncingRoomTypes.asReadonly();
  readonly isPushingAvailability = this.pushingAvailability.asReadonly();
  readonly connectingChannel$ = this.connectingChannel.asReadonly();

  /**
   * Sync store to Channex - Creates property in Channex
   */
  syncStoreToChannex(storeId: string, data: ChannexSyncRequest): Observable<ChannexSyncResponse> {
    this.syncingStore.set(true);
    return this.http.post<ChannexSyncResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/sync`,
      data
    ).pipe(
      tap(() => this.syncingStore.set(false))
    );
  }

  /**
   * Sync room type to Channex - Creates room type mapping
   */
  syncRoomTypeToChannex(
    storeId: string,
    roomTypeId: string,
    data: RoomTypeSyncRequest
  ): Observable<RoomTypeSyncResponse> {
    this.syncingRoomTypes.update(types => new Set(types).add(roomTypeId));
    
    return this.http.post<RoomTypeSyncResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/room-types/${roomTypeId}/sync`,
      data
    ).pipe(
      tap(() => {
        this.syncingRoomTypes.update(types => {
          const newSet = new Set(types);
          newSet.delete(roomTypeId);
          return newSet;
        });
      })
    );
  }

  /**
   * Push availability and rates to Channex
   */
  pushAvailability(storeId: string, data: AvailabilityPushRequest): Observable<AvailabilityPushResponse> {
    this.pushingAvailability.set(true);
    return this.http.post<AvailabilityPushResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/availability`,
      data
    ).pipe(
      tap(() => this.pushingAvailability.set(false))
    );
  }

  /**
   * Get store Channex status and room mappings
   */
  getStoreStatus(storeId: string): Observable<ChannexStatusResponse> {
    return this.http.get<ChannexStatusResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/status`
    );
  }

  /**
   * Get Channex reservations for a store
   */
  getChannexReservations(
    storeId: string,
    filters?: { status?: string; startDate?: string; endDate?: string }
  ): Observable<ChannexReservationsResponse> {
    let params = new HttpParams();
    
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<ChannexReservationsResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/reservations`,
      { params }
    );
  }

  /**
   * Get one-time key for channel connection iframe
   */
  getChannelConnectionKey(storeId: string): Observable<ChannelConnectionKeyResponse> {
    return this.http.post<ChannelConnectionKeyResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/channel-connection-key`,
      {}
    );
  }

  /**
   * Update channel connection status after iframe interaction
   */
  updateChannelStatus(storeId: string, channels: any[]): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/channel-status`,
      { channels }
    );
  }

  /**
   * Get authorization URL for connecting a channel (OTA)
   */
  getChannelAuthUrl(storeId: string, channelId: string): Observable<ChannelAuthUrlResponse> {
    this.connectingChannel.set(channelId);
    return this.http.get<ChannelAuthUrlResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/channels/${channelId}/authorize-url`
    ).pipe(
      tap(() => this.connectingChannel.set(null))
    );
  }

  /**
   * Handle channel authorization callback
   */
  handleChannelCallback(
    storeId: string,
    channelId: string,
    data: ChannelCallbackRequest
  ): Observable<ChannelCallbackResponse> {
    return this.http.post<ChannelCallbackResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/channels/${channelId}/callback`,
      data
    );
  }

  /**
   * Get list of connected and available channels
   */
  getChannels(storeId: string): Observable<ChannelsListResponse> {
    return this.http.get<ChannelsListResponse>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/channels`
    );
  }

  /**
   * Disconnect a channel
   */
  disconnectChannel(storeId: string, channelId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/channels/${channelId}`
    );
  }

  /**
   * Check if a room type is currently syncing
   */
  isRoomTypeSyncing(roomTypeId: string): boolean {
    return this.syncingRoomTypes().has(roomTypeId);
  }

  /**
   * Clear all loading states
   */
  clearLoadingStates(): void {
    this.syncingStore.set(false);
    this.syncingRoomTypes.set(new Set());
    this.pushingAvailability.set(false);
    this.connectingChannel.set(null);
  }
}
