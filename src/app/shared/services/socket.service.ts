import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionStorageService } from './session-storage.service';
import { PrintJobService } from './print-job.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private sessionStorage = inject(SessionStorageService);
  private printJobService = inject(PrintJobService);
  private snackBar = inject(MatSnackBar);
  private globalListenersSetup = false;

  /** Subject for hotel notifications — components can subscribe */
  private hotelNotificationSubject = new Subject<any>();
  readonly hotelNotification$ = this.hotelNotificationSubject.asObservable();

  /** Subject for real-time guest messages — messaging component subscribes */
  private hotelMessageSubject = new Subject<any>();
  readonly hotelMessage$ = this.hotelMessageSubject.asObservable();

  /** Audio element for notification sound */
  private notificationAudio: HTMLAudioElement | null = null;

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
      
      // Setup global listeners after socket is connected
      if (!this.globalListenersSetup) {
        this.setupGlobalPrintJobListeners();
        this.setupGlobalHotelNotificationListeners();
        this.globalListenersSetup = true;
      }
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

  /**
   * Setup global print job listeners
   * These are registered directly on the socket service to persist across component navigation
   */
  private setupGlobalPrintJobListeners(): void {
    console.log('🎧 [SOCKET SERVICE] Setting up global print job listeners');

    // Listen for new print jobs
    this.socket?.on('printJob:created', (data: any) => {
      console.log('========================================');
      console.log('📡 [GLOBAL SOCKET] printJob:created EVENT RECEIVED');
      console.log('Payload:', data);
      console.log('Order ID:', data.order?._id || data._id);
      console.log('========================================');

      this.snackBar.open(
        `📋 Print job created for Order #${data.orderNumber || data.order?._id || 'N/A'}`,
        'View',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        }
      );

      // Auto-print if conditions are met
      this.printJobService.handleAutoPrint(data).catch((err) => {
        console.error('❌ [AUTO-PRINT] Error:', err);
      });
    });

    // Listen for completed jobs
    this.socket?.on('printJob:completed', (data: any) => {
      console.log('✅ [GLOBAL SOCKET] printJob:completed EVENT RECEIVED');
      this.snackBar.open('✅ Print job completed successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    });

    // Listen for failed jobs
    this.socket?.on('printJob:failed', (data: any) => {
      console.log('❌ [GLOBAL SOCKET] printJob:failed EVENT RECEIVED');
      this.snackBar.open(
        `❌ Print job failed: ${data.error || 'Unknown error'}`,
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        }
      );
    });
  }

  /**
   * Global hotel notification listeners — registered ONCE when socket connects.
   * Pushes events to subjects so any component can subscribe without duplicates.
   */
  private setupGlobalHotelNotificationListeners(): void {
    console.log('🎧 [SOCKET SERVICE] Setting up global hotel notification listeners');

    // Generic hotel notification (all event types)
    this.socket?.on('hotel:notification', (data: any) => {
      console.log('🏨 [GLOBAL SOCKET] hotel:notification EVENT RECEIVED');
      console.log('Notification:', data?.notification?.title);

      this.hotelNotificationSubject.next(data);

      // Play notification sound
      this.playNotificationSound();
    });

    // Real-time message push (for chat window)
    this.socket?.on('hotel:message', (data: any) => {
      console.log('💬 [GLOBAL SOCKET] hotel:message EVENT RECEIVED');
      console.log('Thread:', data?.threadId, 'Sender:', data?.sender);

      this.hotelMessageSubject.next(data);

      // Play sound for incoming guest messages
      if (data?.sender === 'guest') {
        this.playNotificationSound();
      }
    });

    // Booking-specific events
    this.socket?.on('hotel:booking_new', (data: any) => {
      console.log('🆕 [GLOBAL SOCKET] hotel:booking_new EVENT RECEIVED');
      this.playNotificationSound();
    });

    this.socket?.on('hotel:booking_cancellation', (data: any) => {
      console.log('❌ [GLOBAL SOCKET] hotel:booking_cancellation EVENT RECEIVED');
      this.playNotificationSound();
    });
  }

  /**
   * Play a notification sound. Lazily creates the Audio element.
   * Falls back gracefully if the sound file is missing or audio is blocked.
   */
  private playNotificationSound(): void {
    try {
      if (!this.notificationAudio) {
        this.notificationAudio = new Audio('assets/sounds/notification.wav');
        this.notificationAudio.volume = 0.5;
      }
      this.notificationAudio.currentTime = 0;
      this.notificationAudio.play().catch((err) => {
        // Browser may block autoplay until user interaction
        console.warn('🔇 [SOUND] Could not play notification sound:', err.message);
      });
    } catch (err) {
      console.warn('🔇 [SOUND] Notification sound not available');
    }
  }
}
