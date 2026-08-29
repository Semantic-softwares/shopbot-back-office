import { Component, inject, input, output, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { SocketService } from '../../services/socket.service';
import { FirebasePushService } from '../../services/firebase-push.service';
import { HotelNotificationService, HotelNotification } from '../../services/hotel-notification.service';
import { StoreStore } from '../../stores/store.store';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private firebasePushService = inject(FirebasePushService);
  private notificationService = inject(HotelNotificationService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  private socketSub?: Subscription;

  // Inputs
  showMenuButton = input(true);
  showBackButton = input(false);
  title = input<string>('');

  // Outputs
  menuToggle = output<void>();

  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  /** Self-toggled "I'm on duty" — gates who gets alerted about new table orders. */
  protected readonly isOnDuty = computed(() => this.currentUser()?.isOnDuty ?? false);
  protected readonly togglingDuty = signal(false);

  toggleDuty(): void {
    const next = !this.isOnDuty();
    this.togglingDuty.set(true);

    // Kick off push registration BEFORE the duty call, not in its success
    // handler. Asking for notification permission is a purely local browser
    // action with no dependency on the server, and coupling it to the response
    // meant a slow or failed /merchants/me/duty request (a cold Heroku dyno
    // returning 504, say) left the user with no permission prompt at all and
    // nothing on screen to explain why.
    if (next) {
      void this.enablePushNotifications();
    }

    // The retry inside toggleDuty() can take ~10s when the server is waking
    // from idle. Without this the button just sits there looking broken.
    const waking = setTimeout(
      () => this.snackBar.open('Waking the server, one moment…', '', { duration: 8000 }),
      2500,
    );

    this.authService.toggleDuty(next).subscribe({
      next: () => {
        clearTimeout(waking);
        this.togglingDuty.set(false);
        this.snackBar.open(next ? 'You\'re on duty — you\'ll be alerted about new table orders' : 'You\'re off duty', 'Close', { duration: 3000 });
      },
      error: (err) => {
        clearTimeout(waking);
        this.togglingDuty.set(false);
        // A gateway timeout that survived the retries is a different problem
        // from being signed out, so say which one it is.
        const timedOut = err?.status === 504 || err?.status === 502 || err?.status === 0;
        this.snackBar.open(
          timedOut
            ? 'The server did not respond in time. It may be waking up — try once more in a few seconds.'
            : 'Could not update duty status — please sign out and back in.',
          'Close',
          { duration: 6000 },
        );
      },
    });
  }

  /**
   * Current browser notification permission, so the toolbar can actually show
   * whether alerts will arrive. Previously nothing on screen reflected this,
   * so a blocked or never-requested permission was invisible.
   */
  protected readonly pushPermission = signal<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  protected readonly pushTooltip = computed(() => {
    switch (this.pushPermission()) {
      case 'granted': return 'Table order alerts are on';
      case 'denied': return 'Alerts are blocked — enable notifications for this site in your browser settings';
      case 'unsupported': return 'This browser does not support notifications';
      default: return 'Tap to turn on table order alerts';
    }
  });

  /** Also callable straight from the toolbar, so alerts can be enabled without touching duty. */
  protected async enablePushNotifications(): Promise<void> {
    await this.firebasePushService.requestPermissionAndRegister();
    if (typeof Notification !== 'undefined') {
      this.pushPermission.set(Notification.permission);
    }
    if (this.pushPermission() === 'denied') {
      this.snackBar.open(
        'Alerts are blocked for this site. Enable notifications in your browser settings to be told about new table orders.',
        'Close',
        { duration: 7000 },
      );
    }
  }

  /** User initials for avatar (e.g. "AO" from "Alex Onozor") */
  public userInitials = computed(() => {
    const name = this.currentUser()?.name || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });

  // Notification state
  protected unreadCount = signal<number>(0);
  protected notifications = signal<HotelNotification[]>([]);
  protected isLoadingNotifications = signal<boolean>(false);

  protected readonly storeId = computed(() => this.storeStore.selectedStore()?._id || '');
  protected readonly badgeHidden = computed(() => this.unreadCount() === 0);
  protected readonly badgeText = computed(() => {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  });

  ngOnInit(): void {
    // Load initial unread count
    this.loadUnreadCount();

    // Someone already on duty when the app loads (duty persists server-side
    // across sessions) would otherwise never be asked for push permission —
    // the toggle only asks on the off→on transition, and their next click
    // turns duty OFF. Ask here too so an already-on-duty session still ends up
    // with a registered token.
    if (this.isOnDuty()) {
      this.firebasePushService.requestPermissionAndRegister();
    }

    // Subscribe to real-time hotel notifications from socket
    this.socketSub = this.socketService.hotelNotification$.subscribe((data) => {
      const notification = data?.notification as HotelNotification;
      if (notification) {
        // Increment unread count
        this.unreadCount.update((c) => c + 1);

        // Prepend to notifications list if dropdown was loaded
        if (this.notifications().length > 0) {
          this.notifications.update((list) => [notification, ...list].slice(0, 20));
        }

        // Toast snackbar
        this.snackBar.open(
          `🏨 ${notification.title}`,
          'View',
          {
            duration: 6000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          },
        ).onAction().subscribe(() => {
          this.navigateToNotification(notification);
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  /** Load unread count from API */
  private loadUnreadCount(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.notificationService.getUnreadCount(storeId).subscribe({
      next: (res) => this.unreadCount.set(res.count),
      error: () => {},
    });
  }

  /** Load recent notifications when dropdown opens */
  protected onNotificationMenuOpened(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.isLoadingNotifications.set(true);
    this.notificationService.getNotifications(storeId, { limit: 15 }).subscribe({
      next: (res) => {
        this.notifications.set(res.data);
        this.isLoadingNotifications.set(false);
      },
      error: () => this.isLoadingNotifications.set(false),
    });
  }

  /** Mark all notifications as read */
  protected markAllAsRead(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.notificationService.markAllAsRead(storeId).subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
      },
      error: () => {},
    });
  }

  /** Mark a single notification as read and navigate */
  protected onNotificationClick(notification: HotelNotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          this.unreadCount.update((c) => Math.max(0, c - 1));
          this.notifications.update((list) =>
            list.map((n) => n._id === notification._id ? { ...n, isRead: true } : n),
          );
        },
      });
    }
    this.navigateToNotification(notification);
  }

  /** Navigate based on notification type */
  private navigateToNotification(notification: HotelNotification): void {
    switch (notification.eventType) {
      case 'guest_message':
      case 'message_thread_created':
        // Navigate to the specific thread if referenceId is available
        if (notification.referenceId) {
          this.router.navigate(['/menu/hms/channel-management/messaging', notification.referenceId]);
        } else {
          this.router.navigate(['/menu/hms/channel-management/messaging']);
        }
        break;
      case 'booking_new':
      case 'booking_modification':
      case 'booking_cancellation':
        if (notification.referenceId) {
          this.router.navigate(['/menu/hms/channel-management/live-booking', notification.referenceId, 'details']);
        } else {
          this.router.navigate(['/menu/hms/front-desk/reservations']);
        }
        break;
      case 'maintenance_invoice_generated':
        if (notification.referenceId) {
          this.router.navigate(['/menu/ems/accounting/invoices', notification.referenceId]);
        } else {
          this.router.navigate(['/menu/ems/accounting/invoices']);
        }
        break;
      default:
        this.router.navigate(['/menu/hms']);
    }
  }

  /** Get icon for notification event type */
  protected getNotificationIcon(eventType: string): string {
    const icons: Record<string, string> = {
      guest_message: 'chat',
      message_thread_created: 'forum',
      booking_new: 'hotel',
      booking_modification: 'edit_calendar',
      booking_cancellation: 'event_busy',
      channel_connected: 'link',
      channel_disconnected: 'link_off',
      availability_updated: 'event_available',
      rate_updated: 'attach_money',
      maintenance_invoice_generated: 'receipt_long',
      system: 'info',
    };
    return icons[eventType] || 'notifications';
  }

  /** Format relative time for notification */
  protected formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  }

  goBack(): void {
    window.history.back();
  }

  goToProfile(): void {
    this.router.navigate(['/menu']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}