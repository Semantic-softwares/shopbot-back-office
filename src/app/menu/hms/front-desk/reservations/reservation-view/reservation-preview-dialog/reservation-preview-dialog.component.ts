import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { GuestService } from '../../../../../../shared/services/guest.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface ReservationPreviewData {
  reservation: any;
  room?: { name?: string; id?: string };
}

@Component({
  selector: 'app-reservation-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule, MatChipsModule, MatListModule, RouterLink],
  templateUrl: './reservation-preview-dialog.component.html',
})
export class ReservationPreviewDialogComponent {
  private dialogRef = inject(MatDialogRef<ReservationPreviewDialogComponent>);
  public data = inject<ReservationPreviewData>(MAT_DIALOG_DATA);
  private guestService = inject(GuestService);
  public storeStore = inject(StoreStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public reservation = signal(this.data.reservation);

  /** Get the specific room assignment based on room id passed, or first room */
  public roomAssignment = computed(() => {
    const rooms = this.reservation()?.rooms || [];
    if (this.data.room?.id) {
      return rooms.find((rr: any) => rr?.room?._id === this.data.room?.id) || rooms[0];
    }
    return rooms[0];
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
    this.router.navigate(['../../../edit', this.reservation()?._id], { relativeTo: this.route });
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
    const roomType = rr?.room?.roomType;
    if (typeof roomType === 'object' && roomType?.name) {
      return roomType.name;
    }
    return '—';
  });

  /** Room number */
  public roomNumber = computed(() => {
    const rr = this.roomAssignment();
    return rr?.room?.roomNumber || '—';
  });

  /** Room name (e.g., "JIMMY CARTER") */
  public roomName = computed(() => {
    const rr = this.roomAssignment();
    return rr?.room?.name || '—';
  });

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
