import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from "@angular/material/divider";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ReservationService } from '../../../../../../shared/services/reservation.service';
import { Reservation, ReservationStatus } from '../../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { CheckInConfirmationDialogComponent, CheckInDialogData } from '../../check-in-confirmation-dialog/check-in-confirmation-dialog.component';
import { PaymentUpdateDialogComponent, PaymentUpdateDialogData } from '../../payment-update-dialog/payment-update-dialog.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogData, PinAuthorizationDialogResult } from '../../pin-authorization-dialog/pin-authorization-dialog.component';
import { QuickReservationModalComponent, QuickReservationData } from '../../quick-reservation-modal/quick-reservation-modal.component';
import { GetGuestNamePipe } from "../../../../../../shared/pipes/get-guest-name.pipe";
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    GetGuestNamePipe,
    PageHeaderComponent
],
  templateUrl: './reservations-list.component.html'
})
export class ReservationsListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  
  statusUpdating = signal<Set<string>>(new Set());
  
  // Filter signals
  searchFilter = signal<string>('');
  statusFilter = signal<string>('');
  dateFromFilter = signal<Date | null>(null);
  dateToFilter = signal<Date | null>(null);
  sortByFilter = signal<string>('createdAt');
  sortOrderFilter = signal<string>('desc');
  
  // Filter form
  filterForm = this.fb.group({
    search: [''],
    status: [''],
    dateRange: this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null]
    }),
    sortBy: ['createdAt'],
    sortOrder: ['desc']
  });

  // Computed statistics for dashboard cards
  confirmedCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'confirmed').length;
  });

  checkedInCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'checked_in').length;
  });

  pendingCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'pending').length;
  });

  cancelledCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'cancelled').length;
  });

  totalRevenue = computed(() => {
    return this.reservations.value()?.reservations.reduce((sum, r) => sum + this.getEffectiveTotal(r), 0);
  });

  totalReservations = computed(() => this.reservations.value()?.total || 0);

  // Create a computed signal for filter parameters
  private filterParams = computed(() => {
    const selectedStore = this.storeStore.selectedStore();
    
    const params: any = {
      storeId: selectedStore?._id,
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortByFilter(),
      sortOrder: this.sortOrderFilter()
    };

    // Add search parameter
    if (this.searchFilter() && this.searchFilter().trim()) {
      params.search = this.searchFilter().trim();
    }

    // Add status filter
    if (this.statusFilter() && this.statusFilter().trim()) {
      params.status = this.statusFilter().trim();
    }

    // Add date filters
    if (this.dateFromFilter()) {
      params.dateFrom = new Date(this.dateFromFilter()!).toISOString().split('T')[0];
    }

    if (this.dateToFilter()) {
      params.dateTo = new Date(this.dateToFilter()!).toISOString().split('T')[0];
    }
    
    return params;
  });

  // Table configuration
  displayedColumns = ['confirmationNumber', 'guest', 'rooms', 'stayPeriod', 'nights', 'status', 'total', 'actions'];

  // Status options
  statusOptions: { value: ReservationStatus | '', label: string, color: string }[] = [
    { value: '', label: 'All Statuses', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'orange' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue' },
    { value: 'checked_in', label: 'Checked In', color: 'green' },
    { value: 'checked_out', label: 'Checked Out', color: 'purple' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'no_show', label: 'No Show', color: 'gray' }
  ];

  constructor() {
    // Set up reactive loading based on filter changes
    

    // Sync form changes to signals
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((formValues) => {
      console.log('Form values changed:', formValues);
      
      // Reset to first page when filters change
      this.currentPage.set(1);
      
      // Update filter signals
      this.searchFilter.set(formValues.search || '');
      this.statusFilter.set(formValues.status || '');
      this.dateFromFilter.set(formValues.dateRange?.start || null);
      this.dateToFilter.set(formValues.dateRange?.end || null);
      this.sortByFilter.set(formValues.sortBy || 'createdAt');
      this.sortOrderFilter.set(formValues.sortOrder || 'desc');
    });
  }

  // private loadReservationsInternal() {
  //   this.loading.set(true);
  //   this.error.set(null);
    
  //   const params = this.filterParams();
  //   console.log('Loading reservations with params:', params);
    
  //   this.reservationService.getReservations(params).subscribe({
  //     next: (response) => {
  //       console.log('Reservations response:', response);
  //       this.reservations.set(response.reservations);
  //       this.totalReservations.set(response.total);
  //       this.loading.set(false);
  //     },
  //     error: (error) => {
  //       console.error('Error loading reservations:', error);
  //       this.error.set(error.message || 'Failed to load reservations');
  //       this.loading.set(false);
  //       this.reservations.set([]);
  //       this.totalReservations.set(0);
  //     }
  //   });
  // }

  public reservations = rxResource({
    params: () => ({ params: this.filterParams() }),
    stream: ({ params }) => this.reservationService.getReservations(params.params),
  });

  private loadReservations() {
    // this.loadReservationsInternal();
  }

  onPageChange(event: any) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadReservations();
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      status: '',
      dateRange: {
        start: null,
        end: null
      },
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    // Also reset the signals
    this.searchFilter.set('');
    this.statusFilter.set('');
    this.dateFromFilter.set(null);
    this.dateToFilter.set(null);
    this.sortByFilter.set('createdAt');
    this.sortOrderFilter.set('desc');
    this.currentPage.set(1);
  }

  refreshReservations() {
    this.loadReservations();
  }

  getStatusColor(status: ReservationStatus): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption?.color || 'gray';
  }

  getGuestName(reservation: Reservation): string {
    if (typeof reservation.guest === 'object' && reservation.guest !== null) {
      return reservation.guest.firstName + ' ' + reservation.guest.lastName;
    }
    return String(reservation.guest);
  }

  getRoomNumbers(reservation: Reservation): string {
    return reservation.rooms.map(r => 
      typeof r.room === 'string' ? r.room : r.room.roomNumber
    ).join(', ');
  }

  reloadData() {
    this.reservations.reload();
  }

  // Navigation methods
  createReservation() {
    const dialogRef = this.dialog.open(QuickReservationModalComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: QuickReservationData | undefined) => {
      if (result) {
        // Navigate to the full reservation form with the quick reservation data
        this.router.navigate(['../create'], { 
          relativeTo: this.route.parent,
          queryParams: { quickReservation: JSON.stringify(result) }
        });
       
      }
    });
  }

  viewReservation(reservation: Reservation) {
    this.router.navigate(['../edit', reservation._id], { relativeTo: this.route.parent });
  }

  editReservation(reservation: Reservation) {
    this.router.navigate(['../edit', reservation._id], { relativeTo: this.route.parent });
  }

  // Action methods
  checkInReservation(reservation: Reservation) {
    if (reservation.status !== 'confirmed') return;
    
    this.reservationService.checkInReservation(reservation._id).subscribe({
      next: () => {
        this.refreshReservations();
      },
      error: (error) => {
        console.error('Error checking in reservation:', error);
      }
    });
  }

  checkOutReservation(reservation: Reservation) {
    if (reservation.status !== 'checked_in') return;
    
    this.reservationService.checkOutReservation(reservation._id).subscribe({
      next: () => {
        this.refreshReservations();
      },
      error: (error) => {
        console.error('Error checking out reservation:', error);
      }
    });
  }

  cancelReservation(reservation: Reservation) {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    this.reservationService.cancelReservation(reservation._id, reason).subscribe({
      next: () => {
        this.refreshReservations();
      },
      error: (error) => {
        console.error('Error cancelling reservation:', error);
      }
    });
  }

  canCheckIn(reservation: Reservation): boolean {
    return reservation.status === 'confirmed' && 
           new Date(reservation.checkInDate) <= new Date();
  }

  canCheckOut(reservation: Reservation): boolean {
    return reservation.status === 'checked_in';
  }

  canCancel(reservation: Reservation): boolean {
    return ['pending', 'confirmed'].includes(reservation.status);
  }

  canEdit(reservation: Reservation): boolean {
    return reservation.status !== 'cancelled' && 
           reservation.status !== 'checked_out' && 
           reservation.status !== 'no_show' &&
           reservation.status !== 'checked_in' &&
           !reservation.actualCheckInDate;
  }

  canDelete(reservation: Reservation): boolean {
    // Allow deletion only for pending, cancelled, or no_show reservations
    // Don't allow deletion for confirmed, checked_in, or checked_out reservations
    return ['pending', 'cancelled', 'no_show'].includes(reservation.status);
  }

  deleteReservation(reservation: Reservation) {
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

  private performReservationDeletion(reservation: Reservation, pin: string) {
    // Add to updating set to show loading state
    const updatingSet = new Set(this.statusUpdating());
    updatingSet.add(reservation._id);
    this.statusUpdating.set(updatingSet);

    this.reservationService.deleteReservationWithPin(reservation._id, pin).subscribe({
      next: (response) => {
        // Remove from local list
        const currentReservations = this.reservations.value()?.reservations || [];
        const updatedReservations = currentReservations.filter(r => r._id !== reservation._id);
        
        // Update total count
        // this.totalReservations.set(this.totalReservations() - 1);
        
        this.snackBar.open(
          `Reservation ${reservation.confirmationNumber} deleted successfully`, 
          'Close', 
          { duration: 5000 }
        );
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
        // Remove from updating set
        const updatingSet = new Set(this.statusUpdating());
        updatingSet.delete(reservation._id);
        this.statusUpdating.set(updatingSet);
      }
    });
  }

  // Status management methods (similar to reservation details)
  // Available status options for dropdowns
  allStatusOptions = [
    { value: 'pending', label: 'Pending', icon: 'schedule', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmed', icon: 'check_circle', color: '#10b981' },
    { value: 'checked_in', label: 'Checked In', icon: 'login', color: '#3b82f6' },
    { value: 'checked_out', label: 'Checked Out', icon: 'logout', color: '#6b7280' },
    { value: 'cancelled', label: 'Cancelled', icon: 'cancel', color: '#ef4444' },
    { value: 'no_show', label: 'No Show', icon: 'person_off', color: '#f97316' }
  ];

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

  // Get available status options for a specific reservation
  // getAvailableStatusOptions(reservation: Reservation) {
  //   const currentStatus = reservation.status;
  //   return this.allStatusOptions.filter(option => 
  //     option.value !== currentStatus && 
  //     this.isValidStatusTransition(currentStatus, option.value)
  //   );
  // }

  // Update reservation status
  // async updateReservationStatus(reservation: Reservation, newStatus: string): Promise<void> {
  //   if (reservation.status === newStatus) return;

  //   // Special handling for check-in - show room readiness dialog
  //   if (newStatus === 'checked_in') {
  //     this.showCheckInDialog(reservation);
  //     return;
  //   }

  //   // Special handling for check-out - handle room status updates
  //   if (newStatus === 'checked_out') {
  //     await this.performCheckOut(reservation);
  //     return;
  //   }

  //   // Validate business rules for status transitions
  //   if (!this.isValidStatusTransition(reservation.status, newStatus)) {
  //     this.snackBar.open(this.getStatusTransitionError(reservation.status, newStatus), 'Close', { 
  //       duration: 5000,
  //       panelClass: ['error-snackbar']
  //     });
  //     return;
  //   }

  //   // Confirm status change for critical statuses
  //   if (newStatus === 'cancelled' || newStatus === 'no_show') {
  //     const confirmed = confirm(`Are you sure you want to change the status to ${newStatus}?`);
  //     if (!confirmed) return;
  //   }

  //   await this.performStatusUpdate(reservation, newStatus);
  // }

  // Show check-in confirmation dialog
  // private showCheckInDialog(reservation: Reservation): void {
  //   const dialogData: CheckInDialogData = { reservation };
    
  //   const dialogRef = this.dialog.open(CheckInConfirmationDialogComponent, {
  //     data: dialogData,
  //     width: '600px',
  //     maxWidth: '90vw',
  //     disableClose: true
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result?.confirmed) {
  //       this.performCheckIn(reservation, result);
  //     }
  //   });
  // }

  // Perform the actual check-in process
  // private async performCheckIn(reservation: Reservation, checkInData: any): Promise<void> {
  //   // Add reservation ID to updating set
  //   const updatingSet = new Set(this.statusUpdating());
  //   updatingSet.add(reservation._id);
  //   this.statusUpdating.set(updatingSet);

  //   try {
  //     // Use the enhanced check-in method that handles room status
  //     const updatedReservation = await this.reservationService.checkInReservationWithRooms(
  //       reservation._id
  //     ).toPromise();

  //     if (updatedReservation) {
  //       // Update the reservation in the local list
  //       const currentReservations = this.reservations();
  //       const updatedReservations = currentReservations.map(r => 
  //         r._id === reservation._id ? updatedReservation : r
  //       );
  //       this.reservations.set(updatedReservations);
        
  //       this.snackBar.open(
  //         `Guest checked in successfully! Room status updated to occupied.`, 
  //         'Close', 
  //         { duration: 5000 }
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error during check-in:', error);
      
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to check in guest';
  //     this.snackBar.open(errorMessage, 'Close', { 
  //       duration: 5000,
  //       panelClass: ['error-snackbar']
  //     });
  //   } finally {
  //     // Remove reservation ID from updating set
  //     const updatingSet = new Set(this.statusUpdating());
  //     updatingSet.delete(reservation._id);
  //     this.statusUpdating.set(updatingSet);
  //   }
  // }

  // Perform the actual check-out process
  // private async performCheckOut(reservation: Reservation): Promise<void> {
  //   // Check if payment is required before checkout
  //   if (this.requiresPaymentBeforeCheckout(reservation)) {
  //     this.showPaymentRequiredDialog(reservation);
  //     return;
  //   }

  //   // Add reservation ID to updating set
  //   const updatingSet = new Set(this.statusUpdating());
  //   updatingSet.add(reservation._id);
  //   this.statusUpdating.set(updatingSet);

  //   try {
  //     // Use the enhanced check-out method that handles room status
  //     const updatedReservation = await this.reservationService.checkOutReservationWithRooms(
  //       reservation._id
  //     ).toPromise();

  //     if (updatedReservation) {
  //       // Update the reservation in the local list
  //       const currentReservations = this.reservations();
  //       const updatedReservations = currentReservations.map(r => 
  //         r._id === reservation._id ? updatedReservation : r
  //       );
  //       this.reservations.set(updatedReservations);
        
  //       this.snackBar.open(
  //         `Guest checked out successfully! Room status updated to cleaning.`, 
  //         'Close', 
  //         { duration: 5000 }
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error during check-out:', error);
      
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to check out guest';
  //     this.snackBar.open(errorMessage, 'Close', { 
  //       duration: 5000,
  //       panelClass: ['error-snackbar']
  //     });
  //   } finally {
  //     // Remove reservation ID from updating set
  //     const updatingSet = new Set(this.statusUpdating());
  //     updatingSet.delete(reservation._id);
  //     this.statusUpdating.set(updatingSet);
  //   }
  // }

  // Check if payment is required before checkout
  private requiresPaymentBeforeCheckout(reservation: Reservation): boolean {
    const hasOutstandingBalance = reservation.pricing.balance > 0;
    const paymentNotPaid = reservation.paymentInfo?.status !== 'paid';
    
    return hasOutstandingBalance && paymentNotPaid;
  }

  // Show payment required dialog before checkout
  // private showPaymentRequiredDialog(reservation: Reservation): void {
  //   const dialogData: PaymentUpdateDialogData = { 
  //     reservation,
  //     isCheckoutFlow: true
  //   };
    
  //   const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
  //     data: dialogData,
  //     width: '600px',
  //     maxWidth: '90vw',
  //     disableClose: true
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result?.confirmed && result.paymentData) {
  //       if (result.paymentData.amount !== undefined) {
  //         // Amount-based payment (checkout flow)
  //         this.processPaymentAndCheckout(reservation, result.paymentData as any);
  //       } else {
  //         console.error('Expected amount-based payment data for checkout flow');
  //       }
  //     }
  //   });
  // }

  // Process payment and then proceed with checkout
  // private async processPaymentAndCheckout(reservation: Reservation, paymentData: {
  //   amount: number;
  //   method: string;
  //   reference?: string;
  //   notes?: string;
  // }): Promise<void> {
  //   // Add reservation ID to updating set
  //   const updatingSet = new Set(this.statusUpdating());
  //   updatingSet.add(reservation._id);
  //   this.statusUpdating.set(updatingSet);

  //   try {
  //     // First, process the payment
  //     await this.reservationService.processPayment(reservation._id, {
  //       amount: paymentData.amount,
  //       method: paymentData.method,
  //       reference: paymentData.reference || `PAY-${Date.now()}`
  //     }).toPromise();

  //     // Reload the reservation to get updated payment info
  //     const updatedReservation = await this.reservationService.getReservationById(reservation._id).toPromise();
  //     if (updatedReservation) {
  //       // Update the reservation in the local list
  //       const currentReservations = this.reservations();
  //       const updatedReservations = currentReservations.map(r => 
  //         r._id === reservation._id ? updatedReservation : r
  //       );
  //       this.reservations.set(updatedReservations);
        
  //       this.snackBar.open(
  //         `Payment of ${this.formatCurrency(paymentData.amount)} recorded successfully`, 
  //         'Close', 
  //         { duration: 3000 }
  //       );

  //       // Check if payment clears the balance, then proceed with checkout
  //       if (updatedReservation.pricing.balance <= 0 || updatedReservation.paymentInfo?.status === 'paid') {
  //         // Wait a moment for user to see payment success message
  //         setTimeout(() => {
  //           this.proceedWithCheckout(updatedReservation);
  //         }, 1500);
  //       } else {
  //         this.snackBar.open(
  //           'Payment recorded, but outstanding balance remains. Please complete payment before checkout.', 
  //           'Close', 
  //           { duration: 5000, panelClass: ['warning-snackbar'] }
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error processing payment for checkout:', error);
      
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
  //     this.snackBar.open(errorMessage, 'Close', { 
  //       duration: 5000,
  //       panelClass: ['error-snackbar']
  //     });
  //   } finally {
  //     // Remove reservation ID from updating set
  //     const updatingSet = new Set(this.statusUpdating());
  //     updatingSet.delete(reservation._id);
  //     this.statusUpdating.set(updatingSet);
  //   }
  // }

  // Proceed with actual checkout after payment is cleared
  // private async proceedWithCheckout(reservation: Reservation): Promise<void> {
  //   // Add reservation ID to updating set
  //   const updatingSet = new Set(this.statusUpdating());
  //   updatingSet.add(reservation._id);
  //   this.statusUpdating.set(updatingSet);

  //   try {
  //     // Use the enhanced check-out method that handles room status
  //     const updatedReservation = await this.reservationService.checkOutReservationWithRooms(
  //       reservation._id
  //     ).toPromise();

  //     if (updatedReservation) {
  //       // Update the reservation in the local list
  //       const currentReservations = this.reservations();
  //       const updatedReservations = currentReservations.map(r => 
  //         r._id === reservation._id ? updatedReservation : r
  //       );
  //       this.reservations.set(updatedReservations);
        
  //       this.snackBar.open(
  //         'Guest checked out successfully! Room status updated to cleaning.', 
  //         'Close', 
  //         { duration: 5000 }
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error during checkout after payment:', error);
      
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to complete checkout';
  //     this.snackBar.open(errorMessage, 'Close', { 
  //       duration: 5000,
  //       panelClass: ['error-snackbar']
  //     });
  //   } finally {
  //     // Remove reservation ID from updating set
  //     const updatingSet = new Set(this.statusUpdating());
  //     updatingSet.delete(reservation._id);
  //     this.statusUpdating.set(updatingSet);
  //   }
  // }



  // Perform regular status updates (non-check-in)
  // private async performStatusUpdate(reservation: Reservation, newStatus: string): Promise<void> {

  //   // Add reservation ID to updating set
  //   const updatingSet = new Set(this.statusUpdating());
  //   updatingSet.add(reservation._id);
  //   this.statusUpdating.set(updatingSet);

  //   try {
  //     const updatedReservation = await this.reservationService.updateReservationStatus(
  //       reservation._id, 
  //       newStatus
  //     ).toPromise();

  //     if (updatedReservation) {
  //       // Update the reservation in the local list
  //       const currentReservations = this.reservations();
  //       const updatedReservations = currentReservations.map(r => 
  //         r._id === reservation._id ? updatedReservation : r
  //       );
  //       this.reservations.set(updatedReservations);
        
  //       this.snackBar.open(`Status updated to ${newStatus}`, 'Close', { duration: 3000 });
  //     }
  //   } catch (error) {
  //     console.error('Error updating reservation status:', error);
      
  //     // Show specific error message from backend or fallback to generic message
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
  //     this.snackBar.open(errorMessage, 'Close', { 
  //       duration: 5000,
  //       panelClass: ['error-snackbar']
  //     });
  //   } finally {
  //     // Remove reservation ID from updating set
  //     const updatingSet = new Set(this.statusUpdating());
  //     updatingSet.delete(reservation._id);
  //     this.statusUpdating.set(updatingSet);
  //   }
  // }

  // Check if a reservation is currently being updated
  isStatusUpdating(reservationId: string): boolean {
    return this.statusUpdating().has(reservationId);
  }

  // Get status color for display (same as reservation details)
  getStatusColorHex(status: string): string {
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

  // Get status icon (same as reservation details)
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

  clearError() {
    this.loadReservations();
  }

  // Export functionality
  exportReservations() {
    try {
      const csvData = this.generateCSV();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', this.generateExportFilename());
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.snackBar.open('Reservations exported successfully', 'Close', { 
          duration: 3000 
        });
      }
    } catch (error) {
      console.error('Error exporting reservations:', error);
      this.snackBar.open('Failed to export reservations', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private generateCSV(): string {
    const headers = [
      'Confirmation Number',
      'Guest Name', 
      'Email',
      'Phone',
      'Room Numbers',
      'Check-in Date',
      'Check-out Date',
      'Check-in Time',
      'Check-out Time',
      'Status',
      'Adults',
      'Children',
      'Nights',
      'Subtotal',
      'Taxes',
      'Total',
      'Balance',
      'Payment Status',
      'Created Date',
      'Special Requests/Notes'
    ];

    const csvRows = [headers.join(',')];

    this.reservations.value()?.reservations.forEach(reservation => {
      const row = [
        this.escapeCsvField(reservation.confirmationNumber || ''),
        this.escapeCsvField(this.getGuestName(reservation)),
        this.escapeCsvField(typeof reservation.guest !== 'string' ? reservation.guest?.email || '' : ''),
        this.escapeCsvField(typeof reservation.guest !== 'string' ? reservation.guest?.phone || '' : ''),
        this.escapeCsvField(this.getRoomNumbers(reservation)),
        this.formatDateForCSV(reservation.checkInDate),
        this.formatDateForCSV(this.getEffectiveCheckOutDate(reservation)),
        this.escapeCsvField(reservation.expectedCheckInTime || ''),
        this.escapeCsvField(reservation.expectedCheckOutTime || ''),
        this.escapeCsvField(reservation.status || ''),
        // reservation.guestDetails?.totalAdults || 0,
        // reservation.guestDetails?.totalChildren || 0,
        reservation.numberOfNights || 0,
        reservation.pricing?.subtotal || 0,
        reservation.pricing?.taxes || 0,
        this.getEffectiveTotal(reservation),
        reservation.pricing?.balance || 0,
        this.escapeCsvField(reservation.paymentInfo?.status || 'pending'),
        this.formatDateForCSV(reservation.createdAt),
        this.escapeCsvField(reservation.specialRequests || reservation.internalNotes || '')
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private escapeCsvField(field: any): string {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  private formatDateForCSV(date: string | Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private generateExportFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    let filename = `reservations_${dateStr}_${timeStr}`;
    
    // Add filter context to filename
    const formValue = this.filterForm.value;
    if (formValue.search) {
      filename += `_search-${formValue.search.replace(/[^a-zA-Z0-9]/g, '')}`;
    }
    if (formValue.status) {
      filename += `_${formValue.status}`;
    }
    if (formValue.dateRange?.start || formValue.dateRange?.end) {
      filename += '_filtered';
    }
    
    return `${filename}.csv`;
  }

  // Extension-related methods
  hasApprovedExtensions(reservation: Reservation): boolean {
    return !!(reservation.extensions && 
              reservation.extensions.some(ext => ext.status === 'approved'));
  }

  getEffectiveCheckOutDate(reservation: Reservation): string | Date {
    if (this.hasApprovedExtensions(reservation)) {
      // Find the latest approved extension checkout date
      const approvedExtensions = reservation.extensions?.filter(ext => ext.status === 'approved') || [];
      if (approvedExtensions.length > 0) {
        // Get the extension with the latest checkout date
        const latestExtension = approvedExtensions.reduce((latest, current) => {
          const latestDate = new Date(latest.newCheckOutDate);
          const currentDate = new Date(current.newCheckOutDate);
          return currentDate > latestDate ? current : latest;
        });
        return latestExtension.newCheckOutDate;
      }
    }
    return reservation.checkOutDate;
  }

  getExtensionNights(reservation: Reservation): number {
    if (reservation.extensions) {
      const approvedExtensions = reservation.extensions.filter(ext => ext.status === 'approved');
      return approvedExtensions.reduce((total, ext) => total + (ext.additionalNights || 0), 0);
    }
    return 0;
  }

  getApprovedExtensionCost(reservation: Reservation): number {
    if (reservation.extensions) {
      const approvedExtensions = reservation.extensions.filter(ext => ext.status === 'approved');
      return approvedExtensions.reduce((total, ext) => total + (ext.additionalCost || 0), 0);
    }
    return 0;
  }

  getEffectiveTotal(reservation: Reservation): number {
    // The pricing.total already includes approved extension costs (updated by backend)
    return reservation.pricing?.total || 0;
  }
}