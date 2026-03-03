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