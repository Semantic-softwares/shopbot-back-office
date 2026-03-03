import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoomsService } from '../../../../../shared/services/rooms.service';

export interface AssignRoomDialogData {
  bookingId: string;
  rooms: any[]; // OTA rooms from booking
  roomTypes: any[]; // Room types from booking relationships
  currency: string; // Booking currency (from OTA, e.g. 'EUR')
  storeCurrency: string; // Store's local currency (e.g. 'NGN')
  storeTax: number; // Store's tax percentage
  storeId: string;
}

export interface RoomAssignment {
  otaRoomIndex: number;
  roomId: string;
  guests: Array<{
    name: string;
    surname: string;
    email?: string;
    phone?: string;
    country?: string;
  }>;
}

@Component({
  selector: 'app-assign-room-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './assign-room-dialog.component.html',
  styleUrl: './assign-room-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignRoomDialogComponent {
  private dialogRef = inject(MatDialogRef<AssignRoomDialogComponent>);
  public data = inject<AssignRoomDialogData>(MAT_DIALOG_DATA);
  private roomsService = inject(RoomsService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // State
  loadingRooms = signal(false);
  availableRoomsLoading = signal(true);
  submitting = signal(false);

  // Available rooms by room type ID
  availableRoomsByType = signal<Map<string, any[]>>(new Map());

  // Form for room selections - one control per OTA room
  assignmentForm = this.fb.group({});

  // Currency conversion
  private currencySymbolToCode: Record<string, string> = {
    '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
    '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '₱': 'PHP', '฿': 'THB',
    'R$': 'BRL', 'R': 'ZAR', 'RM': 'MYR', 'kr': 'SEK', 'Fr': 'CHF',
  };

  /** Normalize a currency symbol or code to an ISO 3-letter code */
  private normalizeCurrency(value: string): string {
    if (!value) return 'USD';
    const trimmed = value.trim();
    return this.currencySymbolToCode[trimmed] || trimmed.toUpperCase();
  }

  /** Whether the booking currency differs from the store currency */
  protected needsConversion = computed(() => {
    const bookingCcy = this.normalizeCurrency(this.data.currency);
    const storeCcy = this.normalizeCurrency(this.data.storeCurrency);
    return bookingCcy !== storeCcy;
  });

  protected bookingCurrencyCode = computed(() => this.normalizeCurrency(this.data.currency));
  protected storeCurrencyCode = computed(() => this.normalizeCurrency(this.data.storeCurrency));

  /** Conversion rate form control (only used when currencies differ) */
  protected conversionRateControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0.0001),
  ]);

  /** Reactive signal that tracks the conversion rate entered by the user */
  protected conversionRate = signal<number>(0);

  /** Booking subtotal (sum of all room amounts) */
  protected bookingSubtotal = computed(() => {
    return (this.data.rooms || []).reduce((sum: number, room: any) => sum + (Number(room.amount) || 0), 0);
  });

  /** Booking tax amount */
  protected bookingTax = computed(() => {
    return (this.data.rooms || []).reduce((sum: number, room: any) => sum + (Number(room.taxes) || 0), 0);
  });

  /** Booking total */
  protected bookingTotal = computed(() => this.bookingSubtotal() + this.bookingTax());

  /** Local currency subtotal */
  protected localSubtotal = computed(() =>
    Math.round(this.bookingSubtotal() * this.conversionRate() * 100) / 100,
  );

  /** Local currency tax */
  protected localTax = computed(() =>
    Math.round(this.bookingTax() * this.conversionRate() * 100) / 100,
  );

  /** Local currency total */
  protected localTotal = computed(() =>
    Math.round(this.bookingTotal() * this.conversionRate() * 100) / 100,
  );

  /** Convert a single room amount to local currency */
  protected toLocal(amount: number): number {
    return Math.round(amount * this.conversionRate() * 100) / 100;
  }

  constructor() {
    // Initialize form with one field per OTA room
    this.initializeForm();
    // Load available rooms on component init
    this.loadAvailableRooms();

    // Keep conversionRate signal in sync with the form control
    this.conversionRateControl.valueChanges.subscribe((val) => {
      this.conversionRate.set(val && val > 0 ? val : 0);
    });
  }

  /**
   * Initialize form with one control per OTA room
   */
  private initializeForm(): void {
    const formControls: { [key: string]: any } = {};
    this.data.rooms.forEach((_, index) => {
      formControls[`room_${index}`] = ['', Validators.required];
    });
    this.assignmentForm = this.fb.group(formControls);
  }

  /**
   * Load available rooms from the backend — one request per OTA room type.
   * Each OTA room has its own room_type_id (Channex UUID) and date range,
   * so we query per room type to get only the rooms of that type that are
   * free for the requested period.
   */
  private loadAvailableRooms(): void {
    this.availableRoomsLoading.set(true);

    const otaRooms = this.data.rooms || [];
    if (otaRooms.length === 0) {
      this.availableRoomsLoading.set(false);
      return;
    }

    // Collect unique room type IDs with their date ranges
    const uniqueTypes = new Map<string, { checkIn: string; checkOut: string }>();
    for (const room of otaRooms) {
      const typeId = room.room_type_id;
      if (typeId && !uniqueTypes.has(typeId)) {
        uniqueTypes.set(typeId, {
          checkIn: room.checkin_date || new Date().toISOString(),
          checkOut: room.checkout_date || new Date().toISOString(),
        });
      }
    }

    const groupedRooms = new Map<string, any[]>();
    let pending = uniqueTypes.size;

    if (pending === 0) {
      this.availableRoomsLoading.set(false);
      return;
    }

    uniqueTypes.forEach((dates, channexRoomTypeId) => {
      // Look up the Channex room type name from booking relationships for fallback matching
      const channexType = (this.data.roomTypes || []).find(
        (t: any) => (t.id || t.attributes?.id) === channexRoomTypeId
      );
      const roomTypeName = channexType?.attributes?.title || '';

      this.roomsService.getAvailableRoomsByChannexType({
        storeId: this.data.storeId,
        channexRoomTypeId,
        checkInDate: dates.checkIn,
        checkOutDate: dates.checkOut,
        roomTypeName: roomTypeName || undefined,
      }).subscribe({
        next: (rooms: any[]) => {
          groupedRooms.set(channexRoomTypeId, rooms);
        },
        error: (err) => {
          console.error(`Failed to load rooms for type ${channexRoomTypeId}:`, err);
          groupedRooms.set(channexRoomTypeId, []);
        },
        complete: () => {
          pending--;
          if (pending <= 0) {
            this.availableRoomsByType.set(groupedRooms);
            this.availableRoomsLoading.set(false);
          }
        },
      });
    });
  }

  /**
   * Get available rooms for a specific room type
   */
  getAvailableRoomsForType(roomTypeId: string): any[] {
    return this.availableRoomsByType().get(roomTypeId) || [];
  }

  /**
   * Get room type name by matching room_type_id with booking relationships data
   */
  getRoomTypeName(roomTypeId: string): string {
    const types = this.data.roomTypes || [];
    if (!types || types.length === 0) return 'Room';

    const roomType = types.find((type: any) => {
      return (type.id || type.attributes?.id) === roomTypeId;
    });

    return roomType?.attributes?.title || 'Room';
  }

  /**
   * Format guest names for display
   */
  formatGuestNames(guests: any[]): string {
    if (!guests || guests.length === 0) return 'No guest info';
    return guests.map(g => `${g.name} ${g.surname}`.trim()).join(', ');
  }

  /**
   * Check if form is valid (includes conversion rate when currencies differ)
   */
  isFormValid(): boolean {
    if (!this.assignmentForm.valid) return false;
    if (this.needsConversion() && this.conversionRateControl.invalid) return false;
    return true;
  }

  /**
   * Submit the room assignments
   */
  submit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.submitting.set(true);

    // Build room mapping payload
    const roomMappings: RoomAssignment[] = [];

    this.data.rooms.forEach((otaRoom: any, index: number) => {
      const selectedRoomId = this.assignmentForm.get(`room_${index}`)?.value;
      if (selectedRoomId) {
        // Map guest data with all available fields from OTA
        const guests = (otaRoom.guests || []).map((g: any) => ({
          name: g.name || '',
          surname: g.surname || '',
          email: g.email || '',
          phone: g.phone || '',
          country: g.country_code || g.country || '',
        }));

        roomMappings.push({
          otaRoomIndex: index,
          roomId: selectedRoomId,
          guests,
        });
      }
    });

    // Build currency conversion payload if needed
    const currencyConversion = this.needsConversion()
      ? {
          bookingCurrency: this.bookingCurrencyCode(),
          storeCurrency: this.storeCurrencyCode(),
          conversionRate: this.conversionRate(),
        }
      : undefined;

    // Call backend to assign rooms
    this.roomsService.assignRoomsToBooking(this.data.bookingId, roomMappings, currencyConversion).subscribe({
      next: (result: any) => {
        this.submitting.set(false);
        this.dialogRef.close({ success: true, assignments: roomMappings, result });
      },
      error: (err) => {
        console.error('Failed to assign rooms:', err);
        this.submitting.set(false);
        this.snackBar.open(
          err?.error?.message || 'Failed to assign rooms. Please try again.',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  /**
   * Close dialog without making changes
   */
  cancel(): void {
    this.dialogRef.close(null);
  }
}
