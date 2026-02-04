import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GuestService } from '../../../../../../shared/services/guest.service';
import { ReservationService } from '../../../../../../shared/services/reservation.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { HotelStore } from '../../../../../../shared/stores/hotel.store';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoomChangeDialogComponent, RoomChangeDialogData, RoomChangeResult } from '../../room-change-dialog/room-change-dialog.component';

interface ReservationPreviewData {
  reservation: any;
  room?: { name?: string; id?: string };
}

@Component({
  selector: 'app-reservation-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule, MatChipsModule, MatListModule],
  templateUrl: './reservation-preview-dialog.component.html',
})
export class ReservationPreviewDialogComponent {
  private dialogRef = inject(MatDialogRef<ReservationPreviewDialogComponent>);
  public data = inject<ReservationPreviewData>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private guestService = inject(GuestService);
  private reservationService = inject(ReservationService);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);
  private hotelStore = inject(HotelStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public reservation = signal(this.data.reservation);

  private roomTypesLoader = effect(() => {
    if (this.hotelStore.roomTypes().length === 0) {
      void this.hotelStore.loadRoomTypes();
    }
  });

  /** Get the specific room assignment based on room id passed, or first room */
  public roomAssignment = computed(() => {
    const rooms = this.reservation()?.rooms || [];
    if (this.data.room?.id) {
      return rooms.find((rr: any) => rr?.room?._id === this.data.room?.id) || rooms[0];
    }
    return rooms[0];
  });

  /** Whether any room is assigned */
  public hasRoomAssignment = computed(() => {
    const rooms = this.reservation()?.rooms || [];
    return rooms.some((rr: any) => rr?.room?._id);
  });

  /** OTA unassigned booking flag */
  public isOtaUnassigned = computed(() => {
    const res = this.reservation();
    const rooms = res?.rooms || [];
    if (!res?.channex?.bookingId) return false;
    if (!rooms.length) return true;
    return rooms.every((rr: any) => !rr?.room?._id);
  });

  /** Get the assigned guest from room assignment, fallback to reservation guest */
  public assignedGuest = computed(() => {
    const rr = this.roomAssignment();
    return rr?.assignedGuest || this.reservation()?.guest;
  });

  /** Guest name from assigned guest or reservation guest */
  public guestName = computed(() => {
    const guest = this.assignedGuest();
    return this.guestService.getGuestName(guest);
  });

  public openReservation(): void {
    this.close();
    // Navigate from reservations/view/calendar to reservations/edit/:id
    const res = this.reservation();
    const bookingId = res?.channex?.bookingId;
    if (bookingId && this.isOtaUnassigned()) {
      this.router.navigate(['/menu', 'hms', 'channel-management', 'live-booking', bookingId, 'details']);
      return;
    }
    this.router.navigate(['/menu', 'hms', 'front-desk', 'reservations', 'edit', this.reservation()?._id]);

  }

  /** Room check-in from stayPeriod or reservation checkInDate */
  public roomCheckIn = computed(() => {
    const rr = this.roomAssignment();
    return rr?.stayPeriod?.from || this.reservation()?.checkInDate;
  });

  /** Room check-out from stayPeriod or reservation checkOutDate */
  public roomCheckOut = computed(() => {
    const rr = this.roomAssignment();
    return rr?.stayPeriod?.to || this.reservation()?.checkOutDate;
  });

  /** Room type name */
  public roomTypeName = computed(() => {
    const rr = this.roomAssignment();
    const roomType = rr?.room?.roomType || rr?.roomType;
    if (typeof roomType === 'object' && roomType?.name) return roomType.name;
    if (typeof roomType === 'string') return 'Unassigned';
    return this.isOtaUnassigned() ? 'Unassigned' : '—';
  });

  /** Room number */
  public roomNumber = computed(() => {
    const rr = this.roomAssignment();
    return rr?.room?.roomNumber || (this.isOtaUnassigned() ? 'Unassigned' : '—');
  });

  /** Room name (e.g., "JIMMY CARTER") */
  public roomName = computed(() => {
    const rr = this.roomAssignment();
    return rr?.room?.name || (this.isOtaUnassigned() ? 'Unassigned' : '—');
  });

  private getChannexBookingPayload(): any {
    const raw = this.reservation()?.channex?.rawWebhookData;
    if (!raw) return null;
    return raw?.data || raw;
  }

  public otaRooms = computed<any[]>(() => {
    const raw = this.getChannexBookingPayload();
    const attributes = raw?.attributes || raw?.data?.attributes || raw;
    const rooms = attributes?.rooms || raw?.rooms || [];
    return Array.isArray(rooms) ? rooms : [];
  });

  public otaRoomTypes = computed<any[]>(() => {
    const raw = this.getChannexBookingPayload();
    const relationships = raw?.relationships || raw?.data?.relationships || raw;
    const types = relationships?.room_types?.data || raw?.room_types || [];
    return Array.isArray(types) ? types : [types];
  });

  private roomTypesById = computed(() => {
    const types = this.hotelStore.roomTypes();
    const map = new Map<string, string>();
    for (const type of types || []) {
      if (type?._id) map.set(type._id, type.name || 'Room');
    }
    return map;
  });

  public getOtaRoomTypeName(room: any, index: number): string {
    const pmsRoomTypeId = this.reservation()?.rooms?.[index]?.roomType;
    const pmsName = pmsRoomTypeId ? this.roomTypesById().get(pmsRoomTypeId) : undefined;
    if (pmsName) return pmsName;

    const roomTypeId = room?.room_type_id || room?.room_type?.id || room?.room_type?.room_type_id;
    if (!roomTypeId) return 'Room';
    const types = this.otaRoomTypes();
    const roomType = types.find((type: any) => (type?.id || type?.attributes?.id) === roomTypeId);
    return roomType?.attributes?.title || roomType?.attributes?.name || 'Room';
  }

  public getOtaRoomPrice(room: any): number {
    const raw = room?.amount ?? room?.total_price ?? room?.price ?? room?.rate ?? 0;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  public getOtaRoomCheckIn(room: any): string | Date | undefined {
    return room?.checkin_date || room?.check_in || room?.arrival_date || this.reservation()?.checkInDate;
  }

  public getOtaRoomCheckOut(room: any): string | Date | undefined {
    return room?.checkout_date || room?.check_out || room?.departure_date || this.reservation()?.checkOutDate;
  }

  public getRoomTypeLabel(room: any): string {
    const roomType = room?.room?.roomType || room?.roomType;
    if (typeof roomType === 'object' && roomType?.name) return roomType.name as string;
    if (typeof roomType === 'string' && roomType.length > 0) return roomType;
    return this.isOtaUnassigned() ? 'Unassigned' : '—';
  }

  public getRoomPrice(room: any): number {
    const raw = room?.pricing?.total ?? room?.pricing?.amount ?? room?.pricing?.price ?? room?.total ?? 0;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  public getRoomCheckIn(room: any): string | Date | undefined {
    return room?.stayPeriod?.from || this.reservation()?.checkInDate;
  }

  public getRoomCheckOut(room: any): string | Date | undefined {
    return room?.stayPeriod?.to || this.reservation()?.checkOutDate;
  }

  /** Number of guests in this room (adults + children) */
  public roomGuestsCount = computed(() => {
    const rr = this.roomAssignment();
    const guests = rr?.guests || {};
    const adults = Number(guests.adults || 0);
    const children = Number(guests.children || 0);
    return adults + children || 1;
  });

  /** Room total from rooms.pricing.total */
  public roomTotal = computed(() => {
    const rr = this.roomAssignment();
    return rr?.pricing?.total || 0;
  });

  /** Amount paid from reservation */
  public amountPaid = computed(() => {
    const pricing = this.reservation()?.pricing;
    return pricing?.paid || 0;
  });

  /** Booking currency (prefer Channex currency) */
  public bookingCurrency = computed(() => {
    const res = this.reservation();
    const channexCurrency = res?.channex?.rawWebhookData?.attributes?.currency;
    return channexCurrency || this.storeStore.selectedStore()?.currency || 'USD';
  });

  /** Booking amount (prefer Channex amount) */
  public bookingAmount = computed(() => {
    const res = this.reservation();
    const channexAmount = res?.channex?.rawWebhookData?.attributes?.amount;
    const parsed = channexAmount ? Number(channexAmount) : undefined;
    if (typeof parsed === 'number' && !Number.isNaN(parsed)) return parsed;
    return res?.pricing?.total || 0;
  });

  /** Booking balance (booking amount - amount paid) */
  public bookingBalance = computed(() => {
    return Math.max(0, this.bookingAmount() - this.amountPaid());
  });

  /** Balance = Room Total - Amount Paid */
  public balanceAmount = computed(() => {
    return Math.max(0, this.roomTotal() - this.amountPaid());
  });

  /** Booking total from reservation pricing */
  public bookingTotal = computed(() => {
    const pricing = this.reservation()?.pricing;
    return pricing?.total || 0;
  });

  /** Booking source */
  public bookingSource = computed(() => {
    return this.reservation()?.bookingSource || '—';
  });

  /** Reservation type (single, group, etc.) */
  public reservationType = computed(() => {
    return this.reservation()?.bookingType || this.reservation()?.reservationType || '—';
  });

  /** Confirmation number */
  public confirmationNumber = computed(() => {
    return this.reservation()?.confirmationNumber || this.reservation()?._id || '—';
  });

  /** Payment method */
  public paymentMethod = computed(() => {
    return this.reservation()?.paymentInfo?.method || '—';
  });

  /** Check if room change is allowed based on status */
  public canChangeRooms = computed(() => {
    const status = this.reservation()?.status;
    return status && !['checked_out', 'cancelled', 'no_show'].includes(status);
  });

  /** Open room change dialog */
  openRoomChangeDialog() {
    const reservation = this.reservation();
    
    if (!reservation || !this.canChangeRooms()) {
      this.snackBar.open('Cannot change rooms for this reservation', 'Close', { duration: 3000 });
      return;
    }

    const changeDialogRef = this.dialog.open(RoomChangeDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        reservationId: reservation._id,
        currentRooms: reservation.rooms,
        checkInDate: new Date(reservation.checkInDate).toISOString(),
        checkOutDate: new Date(reservation.checkOutDate).toISOString(),
        numberOfNights: reservation.numberOfNights,
        currency: this.storeStore.selectedStore()?.currency || 'USD',
        actualCheckInDate: reservation.actualCheckInDate 
          ? new Date(reservation.actualCheckInDate).toISOString() 
          : undefined,
        reservationStatus: reservation.status
      } as RoomChangeDialogData
    });

    changeDialogRef.afterClosed().subscribe(async (result: RoomChangeResult) => {
      if (result) {
        try {
          const response = await this.reservationService.changeRooms(reservation._id, result).toPromise();
          if (response?.success) {
            this.snackBar.open('Room changed successfully', 'Close', { duration: 3000 });
            this.reservation.set(response.data);
          }
        } catch (error: any) {
          console.error('Error changing rooms:', error);
          const errorMessage = error?.error?.error || error?.error?.message || error?.message || 'Failed to change rooms';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  statusLabel = computed(() => {
    return (this.reservation()?.status || 'reserved').replace('_', ' ');
  });

  statusClass = computed(() => {
    const status = this.reservation()?.status || 'reserved';
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      checked_in: 'bg-green-100 text-green-800 border border-green-200',
      checked_out: 'bg-gray-100 text-gray-800 border border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      no_show: 'bg-orange-100 text-orange-800 border border-orange-200',
      reserved: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    };
    return map[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  });
}
