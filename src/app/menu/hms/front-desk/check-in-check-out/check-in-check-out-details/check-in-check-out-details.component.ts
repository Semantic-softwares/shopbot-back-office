import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { Reservation } from '../../../../../shared/models/reservation.model';

@Component({
  selector: 'app-check-in-check-out-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
  ],
  templateUrl: './check-in-check-out-details.component.html',
  styleUrls: ['./check-in-check-out-details.component.scss']
})
export class CheckInCheckOutDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);
  private storeStore = inject(StoreStore);

  // Signals
  loading = signal<boolean>(false);
  reservation = signal<Reservation | null>(null);
  selectedStore = computed(() => this.storeStore.selectedStore());
  reservationId = signal<string>('');

  // Computed properties
  isCheckInToday = computed(() => {
    const res = this.reservation();
    if (!res) return false;
    const today = new Date().toISOString().split('T')[0];
    const checkInDate = new Date(res.checkInDate).toISOString().split('T')[0];
    return checkInDate === today;
  });

  isCheckOutToday = computed(() => {
    const res = this.reservation();
    if (!res) return false;
    const today = new Date().toISOString().split('T')[0];
    const checkOutDate = new Date(res.checkOutDate).toISOString().split('T')[0];
    return checkOutDate === today;
  });

  canCheckIn = computed(() => {
    const res = this.reservation();
    return res?.status === 'confirmed' && this.isCheckInToday();
  });

  canCheckOut = computed(() => {
    const res = this.reservation();
    return res?.status === 'checked_in' && (this.isCheckOutToday() || this.isPastDueCheckOut());
  });

  hasOutstandingBalance = computed(() => {
    const res = this.reservation();
    return res && res.pricing?.balance > 0;
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.reservationId.set(id);
        this.loadReservationDetails(id);
      }
    });
  }

  loadReservationDetails(id: string) {
    this.loading.set(true);
    this.reservationService.getReservationById(id).subscribe({
      next: (reservation: Reservation | null) => {
        if (reservation) {
          this.reservation.set(reservation);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading reservation details:', error);
        this.loading.set(false);
        this.showError('Failed to load reservation details.');
      }
    });
  }

  // Check-in/Check-out actions
  performCheckIn() {
    const reservation = this.reservation();
    if (!reservation) return;

    const roomReadiness = {
      isClean: true,
      isMaintained: true,
      amenitiesReady: true
    };

    this.reservationService.checkInReservationWithRooms(reservation._id, {
      actualCheckInTime: new Date(),
      roomReadiness
    }).subscribe({
      next: (updatedReservation: any) => {
        console.log('Check-in successful:', updatedReservation);
        this.loadReservationDetails(reservation._id);
        const guest = typeof reservation.guest === 'string' ? { firstName: 'Guest', lastName: '' } : reservation.guest;
        this.showSuccess(`${guest.firstName} ${guest.lastName} checked in successfully!`);
      },
      error: (error: any) => {
        console.error('Check-in failed:', error);
        this.showError('Failed to check in guest. Please try again.');
      }
    });
  }

  performCheckOut() {
    const reservation = this.reservation();
    if (!reservation) return;

    if (this.hasOutstandingBalance()) {
      this.showError('Cannot check out guest with outstanding balance. Please settle payment first.');
      return;
    }

    this.reservationService.checkOutReservationWithRooms(reservation._id, {
      actualCheckOutTime: new Date(),
      roomCondition: {
        cleaningRequired: true
      }
    }).subscribe({
      next: (updatedReservation: any) => {
        console.log('Check-out successful:', updatedReservation);
        this.loadReservationDetails(reservation._id);
        const guest = typeof reservation.guest === 'string' ? { firstName: 'Guest', lastName: '' } : reservation.guest;
        this.showSuccess(`${guest.firstName} ${guest.lastName} checked out successfully!`);
      },
      error: (error: any) => {
        console.error('Check-out failed:', error);
        this.showError('Failed to check out guest. Please try again.');
      }
    });
  }

  // Additional actions
  requestEarlyCheckIn() {
    const reservation = this.reservation();
    if (!reservation) return;

    this.reservationService.requestEarlyCheckIn(
      reservation._id,
      '12:00',
      'Early check-in requested from front desk details'
    ).subscribe({
      next: () => {
        this.showSuccess('Early check-in request submitted successfully!');
      },
      error: (error: any) => {
        console.error('Early check-in request failed:', error);
        this.showError('Failed to submit early check-in request.');
      }
    });
  }

  requestLateCheckOut() {
    const reservation = this.reservation();
    if (!reservation) return;

    this.reservationService.requestLateCheckOut(
      reservation._id,
      '14:00',
      'Late check-out requested from front desk details'
    ).subscribe({
      next: () => {
        this.showSuccess('Late check-out request submitted successfully!');
      },
      error: (error: any) => {
        console.error('Late check-out request failed:', error);
        this.showError('Failed to submit late check-out request.');
      }
    });
  }

  processPayment() {
    const reservation = this.reservation();
    if (!reservation) return;
    
    console.log('Process payment for:', reservation);
    this.showInfo('Payment processing will be available soon.');
  }

  printFolio() {
    const reservation = this.reservation();
    if (!reservation) return;

    this.reservationService.printFolio(reservation._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `folio-${reservation.confirmationNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess('Folio downloaded successfully!');
      },
      error: (error: any) => {
        console.error('Failed to print folio:', error);
        this.showError('Failed to generate folio.');
      }
    });
  }

  // Navigation
  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  editReservation() {
    const reservation = this.reservation();
    if (!reservation) return;
    this.router.navigate(['/menu/reservations/edit', reservation._id]);
  }

  // Utility methods
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'checked_in': 'bg-green-100 text-green-800',
      'checked_out': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_show': 'bg-red-100 text-red-800'
    };
    return statusClasses[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  getRoomStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'available': 'bg-green-100 text-green-800',
      'occupied': 'bg-red-100 text-red-800',
      'cleaning': 'bg-yellow-100 text-yellow-800',
      'maintenance': 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  isPastDueCheckOut(): boolean {
    const reservation = this.reservation();
    if (!reservation) return false;
    const today = new Date();
    const checkOutDate = new Date(reservation.checkOutDate);
    return checkOutDate < today;
  }

  isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date.split('T')[0] === today;
  }

  getRoomTypeName(room: any): string {
    // Handle both object and string roomType
    if (typeof room.roomType === 'object' && room.roomType?.name) {
      return room.roomType.name;
    }
    // If roomType is a string, return it directly
    if (typeof room.roomType === 'string') {
      return room.roomType;
    }
    return 'Unknown Room Type';
  }

  // User feedback methods
  private showSuccess(message: string) {
    console.log('SUCCESS:', message);
    // TODO: Implement with MatSnackBar
  }

  private showError(message: string) {
    console.error('ERROR:', message);
    // TODO: Implement with MatSnackBar
  }

  private showInfo(message: string) {
    console.log('INFO:', message);
    // TODO: Implement with MatSnackBar
  }
}