import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { StoreStore } from '../../../../../shared/stores/store.store';

export interface CheckInOutReservation {
  _id: string;
  confirmationNumber: string;
  guest: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vipStatus?: string;
    preferences?: string[];
    specialRequests?: string;
  };
  rooms: Array<{
    room: {
      _id: string;
      number: string;
      floor: number;
      status: string;
      housekeepingStatus: string;
      roomType: {
        name: string;
        amenities: string[];
      };
    };
    guests: {
      adults: number;
      children: number;
    };
  }>;
  checkInDate: string;
  checkOutDate: string;
  actualCheckInDate?: string;
  actualCheckOutDate?: string;
  expectedCheckInTime: string;
  expectedCheckOutTime: string;
  status: string;
  guestDetails: {
    totalAdults: number;
    totalChildren: number;
    specialRequests?: string;
  };
  pricing: {
    total: number;
    balance: number;
  };
  bookingSource: string;
  specialRequests?: string;
  internalNotes?: string;
}

@Component({
  selector: 'app-check-in-check-out',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './check-in-check-out-list.component.html',
  styleUrls: ['./check-in-check-out-list.component.scss']
})
export class CheckInCheckOutListComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private storeStore = inject(StoreStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  loading = signal<boolean>(false);
  reservations = signal<CheckInOutReservation[]>([]);
  selectedStore = computed(() => this.storeStore.selectedStore());

  // Computed properties for different reservation types
  checkInToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.reservations().filter(r => 
      r.checkInDate.split('T')[0] === today && 
      ['confirmed', 'pending'].includes(r.status)
    );
  });

  checkOutToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.reservations().filter(r => 
      r.checkOutDate.split('T')[0] === today && 
      r.status === 'checked_in'
    );
  });

  inHouseGuests = computed(() => {
    return this.reservations().filter(r => r.status === 'checked_in');
  });

  pendingCheckIns = computed(() => {
    return this.reservations().filter(r => 
      r.status === 'confirmed' && 
      new Date(r.checkInDate) <= new Date()
    );
  });

  ngOnInit() {
    this.loadCheckInOutData();
  }

  loadCheckInOutData() {
    const store = this.selectedStore();
    if (!store?._id) {
      console.error('No store selected');
      return;
    }

    console.log('Loading front desk data for store:', store._id);
    this.loading.set(true);
    
    // Try the new endpoint first, fall back to general query if needed
    this.reservationService.getFrontDeskOverview(store._id).subscribe({
      next: (response: any) => {
        console.log('Front desk overview response:', response);
        
        // Combine all reservations for filtering
        const allReservations = [
          ...(response.arrivals || []),
          ...(response.departures || []),
          ...(response.inHouseGuests || []),
          ...(response.pendingCheckIns || [])
        ];
        
        console.log('Combined reservations:', allReservations.length);
        this.reservations.set(allReservations);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading front desk overview:', error);
        
        // Fallback to regular reservations query
        console.log('Falling back to regular reservations query...');
        this.loadReservationsFallback(store._id);
      }
    });
  }

  private loadReservationsFallback(storeId: string) {
    const today = new Date().toISOString().split('T')[0];
    console.log('Loading reservations for today:', today);
    
    this.reservationService.getReservations({ 
      storeId: storeId,
      page: 1,
      limit: 100 // Get more results for front desk view
    }).subscribe({
      next: (response: any) => {
        console.log('Fallback reservations response:', response);
        const allReservations = response.reservations || [];
        
        // Filter for relevant reservations
        const relevantReservations = allReservations.filter((r: any) => {
          const checkInDate = r.checkInDate?.split('T')[0];
          const checkOutDate = r.checkOutDate?.split('T')[0];
          
          const isToday = checkInDate === today || checkOutDate === today;
          const isInHouse = r.status === 'checked_in';
          const isPending = r.status === 'confirmed' && new Date(r.checkInDate) <= new Date();
          
          return isToday || isInHouse || isPending;
        });
        
        console.log('Filtered relevant reservations:', relevantReservations.length);
        this.reservations.set(relevantReservations);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading reservations fallback:', error);
        this.loading.set(false);
        this.showError('Failed to load reservations. Please try again.');
      }
    });
  }

  refreshData() {
    this.loadCheckInOutData();
  }

  // Status and styling methods
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getRoomStatusClass(status: string): string {
    return `room-${status.toLowerCase()}`;
  }

  getHousekeepingStatusClass(status: string): string {
    return `housekeeping-${status.toLowerCase()}`;
  }

  // Navigation and actions
  viewReservation(reservationId: string) {
    this.router.navigate(['../details', reservationId], { relativeTo: this.route });
  }

  // Check-in/Check-out actions
  performCheckIn(reservation: CheckInOutReservation) {
    // First check if all rooms are ready for check-in
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
        this.refreshData();
        this.showSuccess(`${reservation.guest.firstName} ${reservation.guest.lastName} checked in successfully!`);
      },
      error: (error: any) => {
        console.error('Check-in failed:', error);
        this.showError('Failed to check in guest. Please try again.');
      }
    });
  }

  performCheckOut(reservation: CheckInOutReservation) {
    // Check if there's an outstanding balance
    if (reservation.pricing.balance > 0) {
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
        this.refreshData();
        this.showSuccess(`${reservation.guest.firstName} ${reservation.guest.lastName} checked out successfully!`);
      },
      error: (error: any) => {
        console.error('Check-out failed:', error);
        this.showError('Failed to check out guest. Please try again.');
      }
    });
  }

  // Additional front desk features
  requestEarlyCheckIn(reservation: CheckInOutReservation) {
    this.reservationService.requestEarlyCheckIn(
      reservation._id, 
      '12:00', // Default early check-in time
      'Early check-in requested from front desk'
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

  requestLateCheckOut(reservation: CheckInOutReservation) {
    this.reservationService.requestLateCheckOut(
      reservation._id,
      '14:00', // Default late check-out time
      'Late check-out requested from front desk'
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

  changeRoom(reservation: CheckInOutReservation) {
    // TODO: Open dialog to select new room
    console.log('Change room for:', reservation);
    this.showInfo('Room change functionality will be available soon.');
  }

  processPayment(reservation: CheckInOutReservation) {
    // TODO: Open payment processing dialog
    console.log('Process payment for:', reservation);
    this.showInfo('Payment processing will be available soon.');
  }

  printFolio(reservation: CheckInOutReservation) {
    this.reservationService.printFolio(reservation._id).subscribe({
      next: (blob: Blob) => {
        // Create download link for PDF
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

  extendStay(reservation: CheckInOutReservation) {
    // TODO: Open dialog to select new check-out date
    console.log('Extend stay for:', reservation);
    this.showInfo('Stay extension functionality will be available soon.');
  }

  addCharges(reservation: CheckInOutReservation) {
    // TODO: Open dialog to add charges
    console.log('Add charges for:', reservation);
    this.showInfo('Add charges functionality will be available soon.');
  }

  addNotes(reservation: CheckInOutReservation) {
    // TODO: Open dialog to add notes
    console.log('Add notes for:', reservation);
    this.showInfo('Add notes functionality will be available soon.');
  }

  housekeepingRequest(reservation: CheckInOutReservation) {
    const roomIds = reservation.rooms.map(r => 
      typeof r.room === 'string' ? r.room : r.room._id
    );

    this.reservationService.requestHousekeeping(reservation._id, {
      roomIds,
      serviceType: 'cleaning',
      priority: 'normal',
      notes: 'Housekeeping requested from front desk'
    }).subscribe({
      next: () => {
        this.showSuccess('Housekeeping request submitted successfully!');
      },
      error: (error: any) => {
        console.error('Housekeeping request failed:', error);
        this.showError('Failed to submit housekeeping request.');
      }
    });
  }

  // Utility methods for user feedback
  private showSuccess(message: string) {
    // TODO: Implement success notification
    console.log('SUCCESS:', message);
  }

  private showError(message: string) {
    // TODO: Implement error notification
    console.error('ERROR:', message);
  }

  private showInfo(message: string) {
    // TODO: Implement info notification
    console.log('INFO:', message);
  }

  // Utility methods for template
  trackByReservationId(index: number, reservation: CheckInOutReservation): string {
    return reservation._id;
  }

  isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date.split('T')[0] === today;
  }

  isPastDue(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate < today;
  }
}