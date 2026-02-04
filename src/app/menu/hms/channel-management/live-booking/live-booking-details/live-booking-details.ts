import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, of } from 'rxjs';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { LiveBookingService } from '../../../../../shared/services/live-booking.service';
import { BookingEvent, Property } from '../../../../../shared/models/live-booking.model';
import { AssignRoomDialogComponent } from '../assign-room-dialog/assign-room-dialog.component';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-live-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatListModule,
    MatExpansionModule,
    PageHeaderComponent,
  ],
  templateUrl: './live-booking-details.html',
  styleUrl: './live-booking-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveBookingDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(LiveBookingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);

  bookingId = signal<string>('');
  selectedTabIndex = signal<number>(0);

  // Resource to load booking details
  bookingResource = rxResource({
    params: () => {
      const id = this.bookingId();
      return id ? { id } : null;
    },
    stream: ({ params }) => {
      if (!params) throw new Error('No booking ID');
      return this.bookingService.getBookingDetails(params.id);
    },
  });

  // Resource to load booking events (loaded on demand when Timeline tab is selected)
  bookingEventsResource = rxResource({
    params: () => {
      const id = this.bookingId();
      const tabIndex = this.selectedTabIndex();
      // Only load events when Timeline tab (index 1) is selected and we have a booking ID
      return id && tabIndex === 1 ? { id } : null;
    },
    stream: (opts: any) => {
      const params = opts.params;
      // If params are null, return empty observable
      if (!params) return of({ data: [] });
      return this.bookingService.getBookingEvents(params.id);
    },
  });

  // Extracted booking data
  booking = computed(() => {
    const data = this.bookingResource.value();
    if (!data?.data) return null;
    const booking = data.data.attributes || data.data;
    return booking;
  });

  // Extract raw data for relationships
  rawData = computed(() => {
    return this.bookingResource.value()?.data;
  });

  // Extract property from relationships
  property = computed(() => {
    const raw = this.rawData();
    if (!raw?.relationships?.property?.data) return null;
    const prop = raw.relationships.property.data;
    return prop as Property;
  });

  // Extract room types from relationships
  roomTypes = computed(() => {
    const raw = this.rawData();
    if (!raw?.relationships?.room_types?.data) return [];
    const types = raw.relationships.room_types.data;
    return Array.isArray(types) ? types : [types];
  });

  // Extract booking events (from dedicated endpoint when Timeline tab is selected)
  bookingEvents = computed(() => {
    try {
      // First try to get from dedicated events endpoint
      const eventsData = this.bookingEventsResource.value();
      if (eventsData?.data && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
        return (eventsData.data as BookingEvent[]).sort((a, b) => {
          const dateA = new Date(a.attributes.inserted_at).getTime();
          const dateB = new Date(b.attributes.inserted_at).getTime();
          return dateB - dateA; // Sort descending (newest first)
        });
      }
    } catch (error) {
      // If events endpoint fails, fall through to relationships data
    }
    
    // Fallback to relationships data if available
    const raw = this.rawData();
    if (!raw?.relationships?.events?.data) return [];
    return (raw.relationships.events.data as BookingEvent[]).sort((a, b) => {
      const dateA = new Date(a.attributes.inserted_at).getTime();
      const dateB = new Date(b.attributes.inserted_at).getTime();
      return dateB - dateA;
    });
  });

  customerName = computed(() => {
    const booking = this.booking();
    if (!booking?.customer) return 'N/A';
    const customer = booking.customer;
    return `${customer.name || ''} ${customer.surname || ''}`.trim() || 'N/A';
  });

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.bookingId.set(params['id']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/menu/hms/channel-management/live-booking']);
  }

  getStatusChip(status: string) {
    const statusMap: { [key: string]: { color: string; label: string } } = {
      new: { color: 'accent', label: 'New' },
      modified: { color: 'warn', label: 'Modified' },
      cancelled: { color: 'warn', label: 'Cancelled' },
    };
    return statusMap[status] || { color: 'primary', label: 'Unknown' };
  }

  getEventIcon(eventType: string): string {
    const iconMap: { [key: string]: string } = {
      'booking_created': 'add_circle',
      'booking_modified': 'edit',
      'booking_cancelled': 'cancel',
      'booking_confirmed': 'check_circle',
      'booking_webhook_sent': 'send',
      'booking_received_via_booking_find': 'search',
      'booking_received_via_booking_list': 'list',
    };
    return iconMap[eventType] || 'info';
  }

  getEventLabel(eventType: string): string {
    const labelMap: { [key: string]: string } = {
      'booking_created': 'Booking Created',
      'booking_modified': 'Booking Modified',
      'booking_cancelled': 'Booking Cancelled',
      'booking_confirmed': 'Booking Confirmed',
      'booking_webhook_sent': 'Webhook Sent',
      'booking_received_via_booking_find': 'Received via Booking Find',
      'booking_received_via_booking_list': 'Received via Booking List',
    };
    return labelMap[eventType] || eventType;
  }

  getPaymentStatus(booking: any): string {
    if (!booking) return 'Unknown';
    const paymentCollect = booking.payment_collect || 'property';
    const amount = parseFloat(booking.amount || 0);
    
    if (paymentCollect === 'ota' && amount > 0) {
      return 'Prepaid';
    }
    return paymentCollect === 'ota' ? 'Paid' : 'Pending';
  }

  formatCurrency(amount: any, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(parseFloat(amount) || 0);
    } catch {
      return `${currency} ${amount}`;
    }
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  formatDateTime(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  calculateNights(arrival: string, departure: string): number {
    try {
      const checkIn = new Date(arrival);
      const checkOut = new Date(departure);
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
    } catch {
      return 0;
    }
  }

  getTotalRoomPrice(booking: any): number {
    if (!booking?.rooms) return 0;
    return booking.rooms.reduce((sum: number, room: any) => sum + parseFloat(room.amount || 0), 0);
  }

  getTotalTaxes(booking: any): number {
    if (!booking?.rooms) return 0;
    return booking.rooms.reduce((sum: number, room: any) => {
      if (!room.taxes) return sum;
      return sum + room.taxes.reduce((roomSum: number, tax: any) => roomSum + parseFloat(tax.total_price || 0), 0);
    }, 0);
  }

  /**
   * Get room type name by matching room_type_id with relationships data
   */
  getRoomTypeName(roomTypeId: string): string {
    const types = this.roomTypes();
    if (!types || types.length === 0) return 'Room';
    
    const roomType = types.find((type: any) => {
      return (type.id || type.attributes?.id) === roomTypeId;
    });

    return roomType?.attributes?.title || 'Room';
  }

  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  /**
   * Check if booking has unassigned rooms
   */
  hasUnassignedRooms(): boolean {
    const booking = this.booking();
    if (!booking?.rooms) return false;
    return booking.rooms.some((room: any) => !room.room || !room.room._id);
  }

  /**
   * Open assign room dialog for OTA bookings without assigned rooms
   */
  openAssignRoomDialog(): void {
    const booking = this.booking();
    if (!booking || !booking.rooms) return;

    // Check if this is an OTA booking with unassigned rooms
    const isOtaUnassigned = booking.rooms.every((room: any) => !room.room || !room.room._id);
    if (!isOtaUnassigned) {
      this.snackBar.open('All rooms are already assigned', 'Close', { duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(AssignRoomDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        bookingId: this.bookingId(),
        rooms: booking.rooms || [],
        roomTypes: this.roomTypes(),
        currency: booking.currency || 'USD',
        storeId: this.storeStore.selectedStore()?._id || '',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.snackBar.open('Rooms assigned successfully', 'Close', { duration: 5000 });
        // Refresh booking details
        void this.bookingResource.reload();
      }
    });
  }
}
