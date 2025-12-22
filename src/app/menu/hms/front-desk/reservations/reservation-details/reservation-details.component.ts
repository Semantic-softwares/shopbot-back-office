import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReservationService } from '../../../../../shared/services/reservation.service';
import { ExtensionPaymentDialogComponent, ExtensionPaymentData, ExtensionPaymentResult } from '../extension-payment-dialog/extension-payment-dialog.component';
import { BluetoothPrinterService } from '../../../../../shared/services/bluetooth-printer.service';
import { Reservation } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { CheckInConfirmationDialogComponent, CheckInDialogData } from '../check-in-confirmation-dialog/check-in-confirmation-dialog.component';
import { PaymentUpdateDialogComponent, PaymentUpdateDialogData } from '../payment-update-dialog/payment-update-dialog.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogData, PinAuthorizationDialogResult } from '../pin-authorization-dialog/pin-authorization-dialog.component';
import { ExtensionDialogComponent, ExtensionDialogData, ExtensionDialogResult } from '../extension-dialog/extension-dialog.component';
import { PricingUpdateDialogComponent, PricingUpdateDialogData, PricingUpdateDialogResult } from '../pricing-update-dialog/pricing-update-dialog.component';
import { RoomChangeDialogComponent, RoomChangeDialogData, RoomChangeResult } from '../room-change-dialog/room-change-dialog.component';

@Component({
  selector: 'app-reservation-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './reservation-details.component.html',
  styleUrls: ['./reservation-details.component.scss']
})
export class ReservationDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private reservationService = inject(ReservationService);
  private bluetoothPrinterService = inject(BluetoothPrinterService);
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // State signals
  reservation = signal<Reservation | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  statusUpdating = signal(false);
  printerConnected = signal(false);
  printing = signal(false);
  exportingPDF = signal(false);

  // Available status options
  statusOptions = [
    { value: 'pending', label: 'Pending', icon: 'schedule', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmed', icon: 'check_circle', color: '#10b981' },
    { value: 'checked_in', label: 'Checked In', icon: 'login', color: '#3b82f6' },
    { value: 'checked_out', label: 'Checked Out', icon: 'logout', color: '#6b7280' },
    { value: 'cancelled', label: 'Cancelled', icon: 'cancel', color: '#ef4444' },
    { value: 'no_show', label: 'No Show', icon: 'person_off', color: '#f97316' }
  ];

  // Computed properties for display
  roomDetails = computed(() => {
    const res = this.reservation();
    if (!res || !res.rooms) return [];

    return res.rooms.map((room: any) => {
      const roomData = typeof room.room === 'string' ? 
        { roomNumber: room.room, roomType: 'Unknown' } : 
        room.room;
      return {
        name: roomData.name || 'N/A',
        roomNumber: roomData.roomNumber || 'Unknown',
        roomType: typeof roomData.roomType === 'object' ? (roomData.roomType as any)?.name || 'Unknown' : 'Unknown',
        adults: room.guests?.adults || 0,
        children: room.guests?.children || 0,
        rate: roomData.priceOverride || 0
      };
    });
  });

  transactionHistory = computed(() => {
    const res = this.reservation();
    if (!res || !res.paymentInfo?.transactions) return [];
    return res.paymentInfo.transactions;
  });

  // Guest information computed properties
  guestName = computed(() => {
    const res = this.reservation();
    if (!res || !res.guest) return 'Unknown Guest';
    const guest = res.guest as any;
    return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Unknown Guest';
  });

  guestEmail = computed(() => {
    const res = this.reservation();
    return (res?.guest as any)?.email || 'No email provided';
  });

  guestPhone = computed(() => {
    const res = this.reservation();
    return (res?.guest as any)?.phone || 'No phone provided';
  });

  hasAdditionalGuests = computed(() => {
    const res = this.reservation();
    return res?.additionalGuests && res.additionalGuests.length > 0;
  });

  // Helper method to get guest name from guest object
  getGuestName(guest: any): string {
    if (!guest) return 'Unknown Guest';
    return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Unknown Guest';
  }

  hasCancellation = computed(() => {
    const res = this.reservation();
    return res?.cancellation?.isCancelled;
  });

  hasRefundAmount = computed(() => {
    const res = this.reservation();
    return res?.cancellation?.refundAmount && res.cancellation.refundAmount > 0;
  });

  hasCancellationFee = computed(() => {
    const res = this.reservation();
    return res?.cancellation?.cancellationFee && res.cancellation.cancellationFee > 0;
  });

  getRefundAmount = computed(() => {
    const res = this.reservation();
    return res?.cancellation?.refundAmount || 0;
  });

  getCancellationFee = computed(() => {
    const res = this.reservation();
    return res?.cancellation?.cancellationFee || 0;
  });

  // Payment status options
  paymentStatusOptions = [
    { value: 'pending', label: 'Pending', icon: 'schedule', color: '#f59e0b' },
    { value: 'paid', label: 'Paid', icon: 'check_circle', color: '#10b981' },
    { value: 'partial', label: 'Partial', icon: 'donut_small', color: '#3b82f6' },
    { value: 'refunded', label: 'Refunded', icon: 'undo', color: '#6b7280' }
  ];

  getAvailablePaymentStatusOptions = computed(() => {
    const reservation = this.reservation();
    if (!reservation) return [];
    
    const currentStatus = reservation.paymentInfo?.status || 'pending';
    return this.paymentStatusOptions.filter(option => option.value !== currentStatus);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReservation(id);
    } else {
      this.error.set('No reservation ID provided');
    }

    // Check if printer is already connected
    this.printerConnected.set(this.bluetoothPrinterService.isConnected());
  }

  private async loadReservation(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const storeId = (this.storeStore.selectedStore() as any)?._id;
      if (!storeId) {
        throw new Error('No store selected');
      }

      this.reservationService.getReservationById(id).subscribe({
        next: (reservation) => {
          this.reservation.set(reservation);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading reservation:', error);
          this.error.set('Failed to load reservation details');
          this.loading.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading reservation:', error);
      this.error.set('Failed to load reservation details');
      this.loading.set(false);
    }
  }

  // Navigation methods
  goBack(): void {
    this.location.back();
  }

  editReservation(): void {
    if (this.reservation()) {
      this.router.navigate(['/menu/hms/front-desk/reservations/edit', this.reservation()!._id]);
    }
  }

  // Status check methods
  canEdit(): boolean {
    const reservation = this.reservation();
    return reservation?.status !== 'cancelled' && 
           reservation?.status !== 'checked_out' && 
           reservation?.status !== 'no_show' &&
           reservation?.status !== 'checked_in' &&
           !reservation?.actualCheckInDate;
  }

  canDelete(): boolean {
    const reservation = this.reservation();
    // Allow deletion only for pending, cancelled, or no_show reservations
    // Don't allow deletion for confirmed, checked_in, or checked_out reservations
    return reservation ? ['pending', 'cancelled', 'no_show'].includes(reservation.status) : false;
  }

  deleteReservation() {
    const reservation = this.reservation();
    if (!reservation) return;

    const selectedStore = this.storeStore.selectedStore();
    if (!selectedStore?._id) {
      this.snackBar.open('No store selected', 'Close', { duration: 3000 });
      return;
    }

    const dialogData: PinAuthorizationDialogData = {
      storeId: selectedStore._id,
      actionDescription: `delete reservation ${reservation.confirmationNumber}`,
      reservationId: reservation._id
    };

    const dialogRef = this.dialog.open(PinAuthorizationDialogComponent, {
      data: dialogData,
      width: '500px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: PinAuthorizationDialogResult) => {
      if (result?.authorized && result.pin) {
        this.performReservationDeletion(reservation, result.pin);
      }
    });
  }

  private performReservationDeletion(reservation: any, pin: string) {
    this.statusUpdating.set(true);

    this.reservationService.deleteReservationWithPin(reservation._id, pin).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Reservation ${reservation.confirmationNumber} deleted successfully`, 
          'Close', 
          { duration: 5000 }
        );
        
        // Navigate back to reservations list
        this.router.navigate(['/dashboard/hms/front-desk/reservations']);
      },
      error: (error) => {
        console.error('Error deleting reservation:', error);
        this.snackBar.open(
          error.message || 'Failed to delete reservation', 
          'Close', 
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      },
      complete: () => {
        this.statusUpdating.set(false);
      }
    });
  }

  canCheckIn(): boolean {
    const reservation = this.reservation();
    // Only allow check-in if reservation is confirmed
    return reservation?.status === 'confirmed';
  }

  canCheckOut(): boolean {
    const reservation = this.reservation();
    // Only allow check-out if guest is already checked in
    return reservation?.status === 'checked_in';
  }

  canCancel(): boolean {
    const reservation = this.reservation();
    // Can cancel if not already in final status
    return reservation?.status !== 'cancelled' && 
           reservation?.status !== 'checked_out' && 
           reservation?.status !== 'no_show';
  }

  canRequestExtension(): boolean {
    const reservation = this.reservation();
    // Only allow extension requests for checked-in guests
    return reservation?.status === 'checked_in';
  }

  isCheckedOut(): boolean {
    const reservation = this.reservation();
    return reservation?.status === 'checked_out';
  }

  canEditPricing(): boolean {
    // Disable pricing edits for checked-out reservations
    return !this.isCheckedOut() && !this.loading();
  }

  canEditPaymentInfo(): boolean {
    // Disable payment info edits for checked-out reservations
    return !this.isCheckedOut() && !this.statusUpdating();
  }

  // Action methods
  async checkInReservation(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    if (!this.canCheckIn()) {
      this.snackBar.open('Guests can only be checked in when reservation status is "Confirmed"', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      // Call the status update method which will handle the API call
      await this.updateReservationStatus('checked_in');
    } catch (error) {
      console.error('Error checking in reservation:', error);
      this.snackBar.open('Failed to check in reservation', 'Close', { duration: 3000 });
    }
  }

  async checkOutReservation(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    if (!this.canCheckOut()) {
      this.snackBar.open('Guests can only be checked out when reservation status is "Checked In"', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      // Call the status update method which will handle the API call
      await this.updateReservationStatus('checked_out');
    } catch (error) {
      console.error('Error checking out reservation:', error);
      this.snackBar.open('Failed to check out reservation', 'Close', { duration: 3000 });
    }
  }

  async cancelReservation(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation || !this.canCancel()) return;

    try {
      // TODO: Implement cancellation API call
      this.snackBar.open('Cancellation functionality coming soon', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      this.snackBar.open('Failed to cancel reservation', 'Close', { duration: 3000 });
    }
  }

  async requestExtension(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation || !this.canRequestExtension()) {
      this.snackBar.open('Extensions can only be requested for checked-in guests', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogData: ExtensionDialogData = {
      reservation,
      currentCheckOutDate: new Date(reservation.checkOutDate)
    };

    const dialogRef = this.dialog.open(ExtensionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result: ExtensionDialogResult) => {
      if (result?.success && result.extension) {
        try {
          // Reload the reservation to show the new extension request
          await this.loadReservation(reservation._id);
          
          this.snackBar.open(
            'Extension request submitted successfully. Awaiting approval.', 
            'Close', 
            { duration: 5000 }
          );
        } catch (error) {
          console.error('Error reloading reservation after extension request:', error);
          this.snackBar.open(
            'Extension request submitted, but failed to refresh data. Please refresh the page.', 
            'Close', 
            { duration: 5000 }
          );
        }
      }
    });
  }

  // Update reservation status
  async updateReservationStatus(newStatus: string): Promise<void> {
    const reservation = this.reservation();
    if (!reservation || reservation.status === newStatus) return;

    // Special handling for reopen - requires PIN authorization
    if (newStatus === 'reopen') {
      this.reopenReservation();
      return;
    }

    // Special handling for check-in - show room readiness dialog
    if (newStatus === 'checked_in') {
      this.showCheckInDialog(reservation);
      return;
    }

    // Special handling for check-out - use enhanced check-out
    if (newStatus === 'checked_out') {
      this.performCheckOut();
      return;
    }

    // Validate business rules for status transitions
    if (!this.isValidStatusTransition(reservation.status, newStatus)) {
      this.snackBar.open(this.getStatusTransitionError(reservation.status, newStatus), 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Confirm status change for critical statuses
    if (newStatus === 'cancelled' || newStatus === 'no_show') {
      const confirmed = confirm(`Are you sure you want to change the status to ${newStatus}?`);
      if (!confirmed) return;
    }

    await this.performStatusUpdate(newStatus);
  }

  // Payment management methods
  updatePaymentStatus(newStatus: string): void {
    const reservation = this.reservation();
    if (!reservation) return;

    // Prevent editing payment info for checked-out reservations
    if (this.isCheckedOut()) {
      this.snackBar.open('Cannot update payment status for checked-out reservations', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (newStatus === 'paid') {
      this.showPaymentDialog(reservation);
    } else {
      // For other status changes, update directly
      this.performPaymentStatusUpdate(newStatus);
    }
  }

  showPaymentDialog(reservation: Reservation): void {
    // Prevent editing payment info for checked-out reservations
    if (this.isCheckedOut()) {
      this.snackBar.open('Cannot edit payment information for checked-out reservations', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    const dialogData: PaymentUpdateDialogData = { 
      reservation,
      isCheckoutFlow: false // Regular payment update, not checkout flow
    };
    
    const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        // Reload the reservation to get updated payment/transaction info
        this.loadReservation(reservation._id);
      }
    });
  }

  private async processPayment(paymentData: {
    status: 'pending' | 'partial' | 'paid';
    method: string;
    reference?: string;
    notes?: string;
  }): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      // Update payment info through the service
      await this.reservationService.updatePaymentInfo(reservation._id, paymentData).toPromise();

      // Reload the reservation to get updated payment info
      const updatedReservation = await this.reservationService.getReservationById(reservation._id).toPromise();
      if (updatedReservation) {
        this.reservation.set(updatedReservation);
      }

      this.snackBar.open(
        'Payment information updated successfully', 
        'Close', 
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('Error updating payment info:', error);
      
      let errorMessage = 'Failed to update payment information';
      if (error?.error?.error) {
        errorMessage = error.error.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  private async performPaymentStatusUpdate(newStatus: string): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      // Update payment status through the service
      const updatedReservation = await this.reservationService.updateReservation(
        reservation._id, 
        { 
          paymentInfo: {
            ...reservation.paymentInfo,
            status: newStatus as any
          }
        }
      ).toPromise();

      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        this.snackBar.open(`Payment status updated to ${newStatus}`, 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment status';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Show check-in confirmation dialog
  private showCheckInDialog(reservation: Reservation): void {
    const dialogData: CheckInDialogData = { reservation };
    
    const dialogRef = this.dialog.open(CheckInConfirmationDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.performCheckIn(result);
      }
    });
  }

  // Perform the actual check-in process
  private async performCheckIn(checkInData: any): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      // Use the enhanced check-in method that handles room status
      const updatedReservation = await this.reservationService.checkInReservationWithRooms(
        reservation._id
      ).toPromise();

      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        this.snackBar.open(
          'Guest checked in successfully! Room status updated to occupied.', 
          'Close', 
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in guest';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Perform the actual check-out process
  private async performCheckOut(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    // Check if payment is required before checkout
    if (this.requiresPaymentBeforeCheckout(reservation)) {
      this.showPaymentRequiredDialog(reservation);
      return;
    }

    this.statusUpdating.set(true);

    try {
      // Use the enhanced check-out method that handles room status
      const updatedReservation = await this.reservationService.checkOutReservationWithRooms(
        reservation._id
      ).toPromise();

      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        this.snackBar.open(
          'Guest checked out successfully! Room status updated to cleaning.', 
          'Close', 
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to check out guest';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Check if payment is required before checkout
  private requiresPaymentBeforeCheckout(reservation: Reservation): boolean {
    const hasOutstandingBalance = reservation.pricing.balance > 0;
    const paymentNotPaid = reservation.paymentInfo?.status !== 'paid';
    
    return hasOutstandingBalance && paymentNotPaid;
  }

  // Show payment required dialog before checkout
  private showPaymentRequiredDialog(reservation: Reservation): void {
    const dialogData: PaymentUpdateDialogData = { 
      reservation,
      isCheckoutFlow: true // Add this flag to indicate checkout flow
    };
    
    const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && result.paymentData) {
        if (result.paymentData.amount !== undefined) {
          // Amount-based payment (checkout flow)
          this.processPaymentAndCheckout(result.paymentData as any);
        } else {
          console.error('Expected amount-based payment data for checkout flow');
        }
      }
    });
  }

  // Process payment and then proceed with checkout
  private async processPaymentAndCheckout(paymentData: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
  }): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      // First, process the payment
      await this.reservationService.processPayment(reservation._id, {
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference || `PAY-${Date.now()}`
      }).toPromise();

      // Reload the reservation to get updated payment info
      const updatedReservation = await this.reservationService.getReservationById(reservation._id).toPromise();
      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        
        this.snackBar.open(
          `Payment of ${this.formatCurrency(paymentData.amount)} recorded successfully`, 
          'Close', 
          { duration: 3000 }
        );

        // Check if payment clears the balance, then proceed with checkout
        if (updatedReservation.pricing.balance <= 0 || updatedReservation.paymentInfo?.status === 'paid') {
          // Wait a moment for user to see payment success message
          setTimeout(() => {
            this.proceedWithCheckout();
          }, 1500);
        } else {
          this.snackBar.open(
            'Payment recorded, but outstanding balance remains. Please complete payment before checkout.', 
            'Close', 
            { duration: 5000, panelClass: ['warning-snackbar'] }
          );
        }
      }
    } catch (error) {
      console.error('Error processing payment for checkout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Proceed with actual checkout after payment is cleared
  private async proceedWithCheckout(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      // Use the enhanced check-out method that handles room status
      const updatedReservation = await this.reservationService.checkOutReservationWithRooms(
        reservation._id
      ).toPromise();

      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        this.snackBar.open(
          'Guest checked out successfully! Room status updated to cleaning.', 
          'Close', 
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error during checkout after payment:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete checkout';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Perform regular status updates (non-check-in)
  private async performStatusUpdate(newStatus: string): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      const updatedReservation = await this.reservationService.updateReservationStatus(
        reservation._id, 
        newStatus
      ).toPromise();

      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        this.snackBar.open(`Status updated to ${newStatus}`, 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      
      // Show specific error message from backend or fallback to generic message
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Reopen cancelled reservation with PIN authorization
  async reopenReservation(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    if (reservation.status !== 'cancelled' && reservation.status !== 'checked_out') {
      this.snackBar.open('Only cancelled reservations can be reopened', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.snackBar.open('Store information not available', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Open PIN authorization dialog
    const dialogRef = this.dialog.open(PinAuthorizationDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        storeId: storeId,
        actionDescription: 'reopen this cancelled reservation',
        reservationId: reservation._id
      } as PinAuthorizationDialogData
    });

    dialogRef.afterClosed().subscribe(async (result: PinAuthorizationDialogResult) => {
      if (result && result.authorized && result.pin) {
        this.statusUpdating.set(true);

        try {
          const updatedReservation = await this.reservationService.reopenReservation(
            reservation._id,
            result.pin
          ).toPromise();

          if (updatedReservation) {
            this.reservation.set(updatedReservation);
            this.snackBar.open('Reservation reopened successfully', 'Close', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        } catch (error) {
          console.error('Error reopening reservation:', error);
          
          // The service already extracts the error message and throws it as error.message
          let errorMessage = 'Failed to reopen reservation';
          if (error instanceof Error && error.message) {
            errorMessage = error.message;
          } else if (error && typeof error === 'object' && (error as any).message) {
            errorMessage = (error as any).message;
          }
          
          this.snackBar.open(errorMessage, 'Close', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } finally {
          this.statusUpdating.set(false);
        }
      }
    });
  }

  // Get available status options for current reservation
  getAvailableStatusOptions() {
    const currentStatus = this.reservation()?.status;
    const standardOptions = this.statusOptions.filter(option => 
      option.value !== currentStatus && 
      this.isValidStatusTransition(currentStatus || '', option.value)
    );

    // Add reopen option for cancelled reservations
    if (currentStatus === 'cancelled') {
      standardOptions.push({
        value: 'reopen',
        label: 'Reopen Reservation',
        color: '#10b981',
        icon: 'refresh'
      });
    }

    return standardOptions;
  }

  // Business rule validation for status transitions
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled', 'no_show'],
      'confirmed': ['checked_in', 'cancelled', 'no_show'],
      'checked_in': ['checked_out'],
      'checked_out': [], // Final status - no transitions allowed
      'cancelled': [], // Final status - no transitions allowed
      'no_show': [] // Final status - no transitions allowed
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Get error message for invalid status transitions
  private getStatusTransitionError(currentStatus: string, newStatus: string): string {
    switch (newStatus) {
      case 'checked_in':
        return 'Guests can only be checked in when reservation status is "Confirmed"';
      case 'checked_out':
        return 'Guests can only be checked out when reservation status is "Checked In"';
      case 'confirmed':
        return currentStatus === 'checked_in' ? 'Cannot change back to confirmed after check-in' : 
               currentStatus === 'checked_out' ? 'Cannot change back to confirmed after check-out' :
               'Invalid status transition';
      default:
        return `Cannot change status from "${currentStatus}" to "${newStatus}"`;
    }
  }

  // Utility methods for display
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': '#f59e0b',
      'confirmed': '#10b981',
      'checked_in': '#3b82f6',
      'checked_out': '#6b7280',
      'cancelled': '#ef4444',
      'no_show': '#f97316'
    };
    return statusColors[status] || '#6b7280';
  }

  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      'pending': 'schedule',
      'confirmed': 'check_circle',
      'checked_in': 'login',
      'checked_out': 'logout',
      'cancelled': 'cancel',
      'no_show': 'person_off'
    };
    return statusIcons[status] || 'help';
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Email functionality
  async sendReservationEmail(emailType: 'details' | 'confirmation' | 'checkin' = 'details'): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    // Check if guest has email
    const guestEmail = this.guestEmail();
    if (!guestEmail || guestEmail === 'No email provided') {
      this.snackBar.open('No email address available for this guest', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.statusUpdating.set(true);

    try {
      const result = await this.reservationService.sendReservationEmail(reservation._id, {
        emailType: emailType
      }).toPromise();

      if (result?.success) {
        this.snackBar.open(
          result.message || `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} email sent successfully to ${guestEmail}`, 
          'Close', 
          { duration: 5000 }
        );
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      console.error('Error sending reservation email:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reservation email';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  // Bluetooth printing functionality
  async connectToPrinter(): Promise<void> {
    if (!this.bluetoothPrinterService.isBluetoothSupported()) {
      this.snackBar.open('Web Bluetooth is not supported in this browser', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      this.statusUpdating.set(true);
      await this.bluetoothPrinterService.connectToPrinter();
      this.printerConnected.set(true);
      
      const deviceInfo = this.bluetoothPrinterService.getConnectedDeviceInfo();
      this.snackBar.open(
        `Connected to printer: ${deviceInfo?.name || 'Unknown Printer'}`, 
        'Close', 
        { duration: 3000 }
      );
    } catch (error) {
      console.error('Error connecting to printer:', error);
      this.printerConnected.set(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to printer';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  async disconnectFromPrinter(): Promise<void> {
    try {
      await this.bluetoothPrinterService.disconnectPrinter();
      this.printerConnected.set(false);
      this.snackBar.open('Disconnected from printer', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
      this.snackBar.open('Failed to disconnect from printer', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async printReservation(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    // Check if printer is connected
    if (!this.bluetoothPrinterService.isConnected()) {
      // Ask user if they want to connect
      const connectFirst = confirm('Printer not connected. Would you like to connect to a printer first?');
      if (connectFirst) {
        try {
          await this.connectToPrinter();
          if (!this.bluetoothPrinterService.isConnected()) {
            return; // User cancelled or connection failed
          }
        } catch (error) {
          return; // Connection failed
        }
      } else {
        return; // User chose not to connect
      }
    }

    this.printing.set(true);

    try {
      const store = this.storeStore.selectedStore();
      await this.bluetoothPrinterService.printReservation(reservation, store);
      
      this.snackBar.open('Reservation printed successfully', 'Close', { 
        duration: 3000 
      });
    } catch (error) {
      console.error('Error printing reservation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to print reservation';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      
      // If printing failed due to connection issue, update connection status
      if (errorMessage.includes('not connected')) {
        this.printerConnected.set(false);
      }
    } finally {
      this.printing.set(false);
    }
  }

  async testPrint(): Promise<void> {
    if (!this.bluetoothPrinterService.isConnected()) {
      this.snackBar.open('Please connect to a printer first', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.printing.set(true);

    try {
      await this.bluetoothPrinterService.testPrint();
      this.snackBar.open('Test print completed successfully', 'Close', { 
        duration: 3000 
      });
    } catch (error) {
      console.error('Error during test print:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Test print failed';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.printing.set(false);
    }
  }

  // PDF Export functionality
  async exportReservationToPDF(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    this.exportingPDF.set(true);

    try {
      const pdfBlob = await this.reservationService.exportReservationToPDF(reservation._id).toPromise();
      
      if (pdfBlob) {
        // Create download link for PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservation-${reservation.confirmationNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open(
          `Reservation details exported to PDF successfully!`, 
          'Close', 
          { duration: 3000 }
        );
      }
    } catch (error) {
      console.error('Error exporting reservation to PDF:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to export reservation to PDF';
      this.snackBar.open(errorMessage, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.exportingPDF.set(false);
    }
  }

  openPricingUpdateDialog(): void {
    const currentReservation = this.reservation();
    if (!currentReservation) return;

    // Prevent editing pricing for checked-out reservations
    if (this.isCheckedOut()) {
      this.snackBar.open('Cannot edit pricing for checked-out reservations', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const selectedStore = this.storeStore.selectedStore();
    if (!selectedStore?._id) {
      this.snackBar.open('No store selected', 'Close', { duration: 3000 });
      return;
    }

    // First, request PIN authorization
    const pinDialogData: PinAuthorizationDialogData = {
      storeId: selectedStore._id,
      actionDescription: `update pricing for reservation ${currentReservation.confirmationNumber}`,
      reservationId: currentReservation._id
    };

    const pinDialogRef = this.dialog.open(PinAuthorizationDialogComponent, {
      data: pinDialogData,
      width: '500px',
      maxWidth: '90vw',
      disableClose: true
    });

    pinDialogRef.afterClosed().subscribe((pinResult: PinAuthorizationDialogResult) => {
      if (pinResult?.authorized && pinResult.pin) {
        // PIN authorized, proceed to open pricing dialog
        this.proceedWithPricingUpdate(currentReservation);
      }
    });
  }

  private proceedWithPricingUpdate(reservation: Reservation): void {
    const dialogData: PricingUpdateDialogData = {
      reservation: reservation
    };

    const dialogRef = this.dialog.open(PricingUpdateDialogComponent, {
      data: dialogData,
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      panelClass: 'pricing-update-dialog'
    });

    dialogRef.afterClosed().subscribe((result: PricingUpdateDialogResult) => {
      if (result?.success && result.updatedReservation) {
        // Update the local reservation data
        this.reservation.set(result.updatedReservation);
        this.snackBar.open(
          'Pricing updated successfully!', 
          'Close', 
          { 
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
      }
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount && amount !== 0) return 'N/A';
    const store = this.storeStore.selectedStore() as any;
    const currency = store?.currencyCode || store?.currency || 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      // Fallback to USD if currency code is invalid
      console.warn(`Invalid currency code: ${currency}, falling back to USD`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  }

  // Extension-related methods
  hasExtensions(): boolean {
    const reservation = this.reservation();
    return !!(reservation?.extensions && reservation.extensions.length > 0);
  }

  getExtensions(): any[] {
    const reservation = this.reservation();
    return reservation?.extensions || [];
  }

  hasActiveExtension(): boolean {
    const reservation = this.reservation();
    return !!(reservation?.currentExtension?.isActive);
  }

  getTotalExtensionCost(): number {
    const reservation = this.reservation();
    if (reservation?.currentExtension?.isActive && reservation.currentExtension?.totalExtensionCost) {
      return reservation.currentExtension.totalExtensionCost;
    }
    
    // Fallback: calculate from approved extensions
    const approvedExtensions = this.getExtensions().filter(ext => ext.status === 'approved');
    return approvedExtensions.reduce((total, ext) => total + (ext.additionalCost || 0), 0);
  }

  getTotalExtensionNights(): number {
    const reservation = this.reservation();
    if (reservation?.currentExtension?.isActive && reservation.currentExtension?.totalExtensionNights) {
      return reservation.currentExtension.totalExtensionNights;
    }
    
    // Fallback: calculate from approved extensions
    const approvedExtensions = this.getExtensions().filter(ext => ext.status === 'approved');
    return approvedExtensions.reduce((total, ext) => total + (ext.additionalNights || 0), 0);
  }

  getFinalTotal(): number {
    const reservation = this.reservation();
    // The pricing.total already includes approved extension costs (updated by backend)
    return reservation?.pricing?.total || 0;
  }

  formatExtensionDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  }

  // Extension processing state
  processingExtension = signal<string | null>(null);
  processingAction = signal<'approve' | 'reject' | null>(null);

  // Extension approval/rejection methods
  async approveExtension(extensionId: string): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    // Find the extension to get details for the payment dialog
    const extension = reservation.extensions?.find(ext => ext._id === extensionId);
    if (!extension) {
      this.snackBar.open('Extension not found', 'Close', { duration: 3000 });
      return;
    }

    // Open payment dialog
    const dialogData: ExtensionPaymentData = {
      extensionId,
      reservationId: reservation._id,
      extensionCost: extension.additionalCost,
      currency: this.storeStore.selectedStore()?.currency || 'USD',
      additionalNights: extension.additionalNights
    };

    const dialogRef = this.dialog.open(ExtensionPaymentDialogComponent, {
      data: dialogData,
      width: '500px',
      disableClose: true
    });

    const result = await dialogRef.afterClosed().toPromise() as ExtensionPaymentResult | null;
    if (!result) {
      return; // User cancelled
    }

    this.processingExtension.set(extensionId);
    this.processingAction.set('approve');

    try {
      const response = await this.reservationService.approveExtension(
        reservation._id,
        extensionId,
        'Extension approved from reservation details',
        result // Include payment information
      ).toPromise();

      if (response?.reservation) {
        this.reservation.set(response.reservation);
        this.snackBar.open(
          'Extension approved successfully with payment information!',
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      }
    } catch (error: any) {
      console.error('Error approving extension:', error);
      this.snackBar.open(
        error.message || 'Failed to approve extension',
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    } finally {
      this.processingExtension.set(null);
      this.processingAction.set(null);
    }
  }

  async rejectExtension(extensionId: string): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) return;

    // For now, use a simple prompt. In production, you might want a proper dialog
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    this.processingExtension.set(extensionId);
    this.processingAction.set('reject');

    try {
      const response = await this.reservationService.rejectExtension(
        reservation._id,
        extensionId,
        rejectionReason,
        'Extension rejected from reservation details'
      ).toPromise();

      if (response?.reservation) {
        this.reservation.set(response.reservation);
        this.snackBar.open(
          'Extension rejected successfully!',
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      }
    } catch (error: any) {
      console.error('Error rejecting extension:', error);
      this.snackBar.open(
        error.message || 'Failed to reject extension',
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    } finally {
      this.processingExtension.set(null);
      this.processingAction.set(null);
    }
  }

  /**
   * Open room change dialog
   */
  async openRoomChangeDialog() {
    const reservation = this.reservation();
    
    if (!reservation || this.isCheckedOut()) {
      this.snackBar.open('Cannot change rooms for checked-out reservations', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(RoomChangeDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        reservationId: reservation._id,
        currentRooms: reservation.rooms,
        checkInDate: new Date(reservation.checkInDate).toISOString(),
        checkOutDate: new Date(reservation.checkOutDate).toISOString(),
        numberOfNights: reservation.numberOfNights,
        currency: this.storeStore.selectedStore()?.currency || 'USD'
      } as RoomChangeDialogData
    });

    dialogRef.afterClosed().subscribe(async (result: RoomChangeResult) => {
      if (result) {
        await this.processRoomChange(result);
      }
    });
  }

  /**
   * Process room change result
   */
  private async processRoomChange(changeResult: RoomChangeResult) {
    const reservation = this.reservation();
    if (!reservation) return;

    try {
      this.loading.set(true);

      // If additional payment required, open payment dialog first
      if (changeResult.pricingAdjustment.requiresPayment) {
        const currency = this.storeStore.selectedStore()?.currency || 'USD';
        const paymentDialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
          width: '500px',
          disableClose: true,
          data: {
            reservation: reservation,
            amount: changeResult.pricingAdjustment.difference,
            title: 'Room Change - Additional Payment Required',
            description: `Additional payment of ${currency}${changeResult.pricingAdjustment.difference.toLocaleString()} required for room upgrade`,
            isCheckoutFlow: false
          } as PaymentUpdateDialogData
        });

        const paymentResult = await paymentDialogRef.afterClosed().toPromise();
        if (!paymentResult) {
          this.snackBar.open('Room change cancelled - payment not processed', 'Close', { duration: 3000 });
          return;
        }
      }

      // Process room change
      const response = await this.reservationService.changeRooms(reservation._id, changeResult).toPromise();
      
      if (response.success) {
        this.reservation.set(response.data);
        this.snackBar.open('Rooms changed successfully', 'Close', { duration: 3000 });
        await this.loadReservation(reservation._id); // Reload to get fresh data
      }
    } catch (error: any) {
      console.error('Error processing room change:', error);
      this.snackBar.open('Failed to change rooms', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }
}