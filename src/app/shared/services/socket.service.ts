import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private sessionStorage = inject(SessionStorageService);

  connect(storeId: string): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.sessionStorage.getAuthToken();
    this.socket = io(environment.apiUrl, {
      auth: { token },
      query: { storeId },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      // Join store room
      this.socket?.emit('joinStore', storeId);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket.IO error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinStation(stationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinStation', stationId);
      console.log(`Joined station room: ${stationId}`);
    }
  }

  leaveStation(stationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveStation', stationId);
      console.log(`Left station room: ${stationId}`);
    }
  }

  on<T = any>(event: string): Observable<T> {
    return new Observable((observer) => {
      let handler: ((data: T) => void) | null = null;

      // Wait for socket to be available and then attach listener
      const checkAndListen = () => {
        if (!this.socket) {
          console.log(`⏳ [SOCKET] Waiting for connection to listen to '${event}'`);
          setTimeout(checkAndListen, 100);
          return;
        }

        console.log(`🎧 [SOCKET] Now listening to event: '${event}'`);

        handler = (data: T) => {
          console.log(`📨 [SOCKET] Event '${event}' received:`, data);
          observer.next(data);
        };

        this.socket.on(event, handler);
      };

      checkAndListen();

      // Cleanup on unsubscribe
      return () => {
        if (handler) {
          console.log(`🔇 [SOCKET] Stopped listening to event: '${event}'`);
          this.socket?.off(event, handler);
        }
      };
    });
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
