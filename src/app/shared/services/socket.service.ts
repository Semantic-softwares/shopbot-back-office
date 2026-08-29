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

  /** Subject for hotel notifications — components can subscribe */
  private hotelNotificationSubject = new Subject<any>();
  readonly hotelNotification$ = this.hotelNotificationSubject.asObservable();

  /** Subject for real-time guest messages — messaging component subscribes */
  private hotelMessageSubject = new Subject<any>();
  readonly hotelMessage$ = this.hotelMessageSubject.asObservable();

  /**
   * A brand-new self-order table order for this on-duty staff member. Acts as
   * the single alert bus regardless of how the alert arrived — the socket
   * feeds it below, and FirebasePushService feeds it via
   * pushTableOrderAlert() for pushes that land while the tab is focused.
   * Consumers dedupe by orderId, so both transports firing is harmless.
   */
  private tableNewOrderSubject = new Subject<any>();
  readonly tableNewOrder$ = this.tableNewOrderSubject.asObservable();

  /** A table order was claimed by someone (possibly this staff member) — dismiss any matching pending alert. */
  private tableOrderClaimedSubject = new Subject<any>();
  readonly tableOrderClaimed$ = this.tableOrderClaimedSubject.asObservable();

  /**
   * An order moved between tables on some terminal — two table cards just
   * changed occupancy, so every other POS in the store needs to refetch.
   */
  private tableTransferredSubject = new Subject<any>();
  readonly tableTransferred$ = this.tableTransferredSubject.asObservable();

  /** Audio element for notification sound */
  private notificationAudio: HTMLAudioElement | null = null;

  /** Separate, loopable audio element for the incoming-table-order alert — kept
   * apart from the one-shot notificationAudio above so a looping alert never
   * gets silently reset by an unrelated one-shot sound sharing the same element. */
  private alertLoopAudio: HTMLAudioElement | null = null;

  /** Store this socket was opened for — lets a repeat connect() call be a no-op. */
  private currentStoreId: string | null = null;

  /** jobIds already toasted, so the backend's re-push sweep can't duplicate them. */
  private readonly toastedPrintJobIds = new Set<string>();

  connect(storeId: string): void {
    // Guard on the socket EXISTING, not on it being connected: `connected` is
    // still false during the handshake, so a second call landing in that
    // window (menu.component.ts calls this from both a constructor effect and
    // ngOnInit) would build a second socket and orphan the first — which then
    // keeps its own connect/disconnect lifecycle and fights the real one.
    if (this.socket) {
      if (this.currentStoreId === storeId) {
        return;
      }
      // Genuinely switching stores — tear the old one down first.
      this.disconnect();
    }

    const token = this.sessionStorage.getAuthToken();
    this.currentStoreId = storeId;

    // Bind everything to THIS instance rather than re-reading this.socket
    // inside the handlers, so a later reconnect can never make an old
    // socket's callback operate on a newer socket.
    const socket = io(environment.apiUrl, {
      auth: { token },
      query: { storeId },
      transports: ['websocket', 'polling'],
    });
    this.socket = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
      socket.emit('joinStore', storeId);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error: any) => {
      console.error('Socket.IO connect_error:', error?.message || error);
    });

    socket.on('error', (error: any) => {
      console.error('Socket.IO error:', error);
    });

    // Attached once per socket instance, immediately — not deferred into the
    // 'connect' handler behind a global flag, which previously could bind them
    // to a different socket than the one that fired the event.
    this.setupGlobalPrintJobListeners(socket);
    this.setupGlobalHotelNotificationListeners(socket);
    this.setupGlobalTableOrderListeners(socket);
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
  private setupGlobalPrintJobListeners(socket: Socket): void {
    console.log('🎧 [SOCKET SERVICE] Setting up global print job listeners');

    // Listen for new print jobs
    socket.on('printJob:created', (data: any) => {
      // The backend sweep re-emits any job a printer hasn't picked up, so the
      // SAME jobId arrives repeatedly (every 10s while it stays unclaimed).
      // Toast once per job — otherwise an unclaimed job buries the screen in
      // duplicate snackbars, which is what this listener used to do.
      const jobId = data?.jobId || data?.printJob?._id;
      if (jobId && this.toastedPrintJobIds.has(jobId)) {
        return;
      }
      if (jobId) {
        this.toastedPrintJobIds.add(jobId);
      }

      console.log('📡 [GLOBAL SOCKET] printJob:created', jobId);

      this.snackBar.open(
        `📋 Print job created for Order #${data.orderNumber || data.order?._id || 'N/A'}`,
        'View',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        }
      );
    });

    // Listen for completed jobs
    socket.on('printJob:completed', (data: any) => {
      console.log('✅ [GLOBAL SOCKET] printJob:completed EVENT RECEIVED');
      this.snackBar.open('✅ Print job completed successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    });

    // Listen for failed jobs
    socket.on('printJob:failed', (data: any) => {
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
  private setupGlobalHotelNotificationListeners(socket: Socket): void {
    console.log('🎧 [SOCKET SERVICE] Setting up global hotel notification listeners');

    // Generic hotel notification (all event types)
    socket.on('hotel:notification', (data: any) => {
      console.log('🏨 [GLOBAL SOCKET] hotel:notification EVENT RECEIVED');
      console.log('Notification:', data?.notification?.title);

      this.hotelNotificationSubject.next(data);

      // Play notification sound
      this.playNotificationSound();
    });

    // Real-time message push (for chat window)
    socket.on('hotel:message', (data: any) => {
      console.log('💬 [GLOBAL SOCKET] hotel:message EVENT RECEIVED');
      console.log('Thread:', data?.threadId, 'Sender:', data?.sender);

      this.hotelMessageSubject.next(data);

      // Play sound for incoming guest messages
      if (data?.sender === 'guest') {
        this.playNotificationSound();
      }
    });

    // Booking-specific events
    socket.on('hotel:booking_new', (data: any) => {
      console.log('🆕 [GLOBAL SOCKET] hotel:booking_new EVENT RECEIVED');
      this.playNotificationSound();
    });

    socket.on('hotel:booking_cancellation', (data: any) => {
      console.log('❌ [GLOBAL SOCKET] hotel:booking_cancellation EVENT RECEIVED');
      this.playNotificationSound();
    });
  }

  /**
   * Global incoming-table-order listeners. Deliberately no auto-sound here
   * (unlike hotel:notification's one-shot ping) — the alert queue component
   * owns the continuous/looping sound's lifecycle based on how many alerts
   * are currently pending, via playAlertLoop()/stopAlertLoop() below.
   */
  private setupGlobalTableOrderListeners(socket: Socket): void {
    console.log('🎧 [SOCKET SERVICE] Setting up global table-order listeners');

    socket.on('table:newOrder', (data: any) => {
      console.log('🔔 [GLOBAL SOCKET] table:newOrder EVENT RECEIVED', data);
      this.tableNewOrderSubject.next(data);
    });

    socket.on('table:orderClaimed', (data: any) => {
      console.log('✅ [GLOBAL SOCKET] table:orderClaimed EVENT RECEIVED', data);
      this.tableOrderClaimedSubject.next(data);
    });

    socket.on('table:transferred', (data: any) => {
      console.log('🔀 [GLOBAL SOCKET] table:transferred EVENT RECEIVED', data);
      this.tableTransferredSubject.next(data);
    });
  }

  /**
   * Feed a table-order alert that arrived over a transport other than the
   * socket — specifically an FCM push delivered while the tab is focused (see
   * FirebasePushService). Same bus as the socket path, so the toast and
   * looping sound behave identically whichever one gets there first.
   */
  pushTableOrderAlert(data: any): void {
    this.tableNewOrderSubject.next(data);
  }

  /** Start (or keep playing) the continuous incoming-order alert sound. Idempotent. */
  playAlertLoop(): void {
    this.alertLoopWanted = true;
    try {
      if (!this.alertLoopAudio) {
        this.alertLoopAudio = new Audio('assets/sounds/notification.wav');
        this.alertLoopAudio.loop = true;
        this.alertLoopAudio.volume = 0.6;
      }
      if (this.alertLoopAudio.paused) {
        this.alertLoopAudio.currentTime = 0;
        this.alertLoopAudio.play().catch((err) => {
          // Browsers block audio until the page has seen a user gesture. If
          // this is the first sound of the session and the user hasn't
          // clicked yet, retry once on their next interaction rather than
          // losing the alert's audio entirely.
          console.warn('🔇 [SOUND] Could not play alert loop:', err.message);
          this.retryAlertLoopOnNextGesture();
        });
      }
    } catch (err) {
      console.warn('🔇 [SOUND] Alert loop sound not available');
    }
  }

  private gestureRetryArmed = false;

  private retryAlertLoopOnNextGesture(): void {
    if (this.gestureRetryArmed) return;
    this.gestureRetryArmed = true;
    const retry = () => {
      this.gestureRetryArmed = false;
      // Only resume if an alert is still pending — the queue owner pauses this
      // when the last alert is dismissed, and we must not restart it after that.
      if (this.alertLoopAudio && this.alertLoopAudio.paused && this.alertLoopWanted) {
        this.alertLoopAudio.play().catch(() => {});
      }
    };
    document.addEventListener('click', retry, { once: true });
    document.addEventListener('keydown', retry, { once: true });
  }

  /** Whether a caller currently wants the loop playing — guards the gesture retry above. */
  private alertLoopWanted = false;

  /** Stop the continuous incoming-order alert sound — call once no alerts remain pending. */
  stopAlertLoop(): void {
    this.alertLoopWanted = false;
    this.alertLoopAudio?.pause();
    if (this.alertLoopAudio) {
      this.alertLoopAudio.currentTime = 0;
    }
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
