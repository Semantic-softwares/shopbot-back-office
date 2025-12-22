import {
  Component,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  input,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormGroup,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, of, tap } from 'rxjs';

import { ReservationService } from '../../../../../shared/services/reservation.service';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { GuestService } from '../../../../../shared/services/guest.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  Reservation,
  PaymentMethod,
  Guest,
} from '../../../../../shared/models/reservation.model';
import { AvailableRoom } from '../../../../../shared/models/room.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { ReservationStatus } from '../../../../../shared/enums/reservation-status.enum';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { GuestDetailsComponent } from './components/guest-details/guest-details.component';
import { StayDetailsComponent } from './components/stay-details/stay-details.component';
import { RoomSharersComponent } from './components/room-sharers/room-sharers.component';
import { RoomDetailsComponent } from './components/room-details/room-details.component';
import { PaymentInfo } from './components/payment-info/payment-info.component';
import { SpecialRequestsComponent } from './components/special-requests/special-requests.component';
import { ReservationFormService } from '../../../../../shared/services/reservation-form.service';
import {
  CheckInDialogData,
  CheckInConfirmationDialogComponent,
} from '../check-in-confirmation-dialog/check-in-confirmation-dialog.component';
import {
  PaymentUpdateDialogComponent,
  PaymentUpdateDialogData,
} from '../payment-update-dialog/payment-update-dialog.component';
import {
  ValidationErrorsDialogComponent,
  ValidationErrorsDialogData,
} from '../../../../../shared/components/validation-errors-dialog/validation-errors-dialog.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogData, PinAuthorizationDialogResult } from '../pin-authorization-dialog/pin-authorization-dialog.component';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    GuestDetailsComponent,
    StayDetailsComponent,
    RoomSharersComponent,
    RoomDetailsComponent,
    PaymentInfo,
    SpecialRequestsComponent,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss'],
})
export class ReservationFormComponent implements OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  private roomsService = inject(RoomsService);
  private guestService = inject(GuestService);
  private authService = inject(AuthService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();
  private reservationFormService = inject(ReservationFormService);
  private id = signal(this.route.snapshot.paramMap.get('id'));
  public isSubmitted = signal(false);
  private quickReservationQuery = signal(
    this.route.snapshot.queryParamMap.get('quickReservation')
  );
  public statusUpdating = signal(false);
  public exportingPDF = signal(false);


  // Expose enum to template
  ReservationStatus = ReservationStatus;

  public quickReservation = computed(() => {
    const qr = this.quickReservationQuery();
    if (qr) {
      return JSON.parse(qr);
    } else {
      return null;
    }
  });

  private currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  public selectedGuest = signal<Guest | null>(null);

  public isEditing = computed(() => !!this.id());
  private paymentRedirection = signal<boolean>(false);

  constructor() {
    this.reservationFormService.setForm(this.reservationForm); 
    this.route.queryParamMap.subscribe((params) => {
        const paymentRedirection = params.get('paymentRedirection');
        if (paymentRedirection) {
          this.paymentRedirection.set(!!paymentRedirection);
          
        }
      })
  }

  public bookingType = computed(() => {
    if (!this.isEditing()) {
      return this.quickReservation()?.bookingType;
    } else {
      return this.reservationForm.get('bookingType')?.value;
    }
  });

  public isSingleBooking = computed(() => {
    return this.bookingType() === 'single';
  });

  public selectedRoomIds = computed(() => {
    if (!this.isEditing()) {
      const qr = this.quickReservation();
      return qr?.selectedRoom || [];
    } else {
      return this.reservation.hasValue()
        ? this.reservation.value()!.rooms.map((room) => room.room._id)
        : [];
    }
  });

   // PDF Export functionality
  async exportReservationToPDF(): Promise<void> {
    const reservation = this.reservation.value();
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



  // Reservation form - Simple clean form
  public reservationForm = this.fb.group({
    // Booking type
    bookingType: [this.quickReservation()?.bookingType, [Validators.required]],

    // Guest Details
    guest: ['', [Validators.required]],
    store: [this.storeStore.selectedStore()?._id || '', [Validators.required]],
    // Stay Details
    checkInDate: [
      new Date(this.quickReservation()?.checkInDate),
      [Validators.required],
    ],
    checkOutDate: [
      new Date(this.quickReservation()?.checkOutDate),
      [Validators.required],
    ],
    numberOfNights: [1, [Validators.required, Validators.min(1)]],
    bookingSource: ['walk_in', [Validators.required]],
    createdBy: [this.currentUser()?._id, [Validators.required]],
    paymentInfo: this.fb.group({
      method: [{value: 'cash', disabled: true}, [Validators.required]],
      status: [{value: 'pending', disabled: true}, [Validators.required]],
    }),
    // Room Sharers
    numberOfAdults: [1, [Validators.required, Validators.min(1)]],
    numberOfChildren: [0, [Validators.required, Validators.min(0)]],

    pricing: this.fb.group({
      subtotal: [0, [Validators.required, Validators.min(0)]],
      taxes: [0, [Validators.min(0)]],
      fees: this.fb.group({
        serviceFee: [0, [Validators.min(0)]],
        cleaningFee: [0, [Validators.min(0)]],
        resortFee: [0, [Validators.min(0)]],
        other: [0, [Validators.min(0)]],
      }),
      discounts: [0, [Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      paid: [0, [Validators.min(0)]],
      balance: [0, [Validators.min(0)]],
    }),

    // Special requests and notes
    specialRequests: ['', []],
    internalNotes: ['', []],

    // Sharers FormArray - populated based on numberOfAdults + numberOfChildren
    sharers: this.fb.array([]),

    // Rooms FormArray - for group bookings and room assignment
    rooms: this.fb.array([]),
  });

 

  // Room availability resource
  public availableRoomsResource = rxResource({
    params: () => ({ checkIn: this.checkIn(), checkOut: this.checkOut() }),
    stream: ({ params }) =>
      this.getAvailableRooms({
        checkIn: params.checkIn!,
        checkOut: params.checkOut!,
      }),
  });

  private checkIn = toSignal(
    this.reservationForm.get('checkInDate')!.valueChanges,
    { initialValue: this.reservationForm.get('checkInDate')!.value }
  );

  private checkOut = toSignal(
    this.reservationForm.get('checkOutDate')!.valueChanges,
    { initialValue: this.reservationForm.get('checkOutDate')!.value }
  );

  // Reservation resource for editing
  public reservation = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) =>
      this.getReservation(params.id!).pipe(
        tap((reservation) => {
          if (reservation) {
            this.populateForm(reservation);
            if (this.paymentRedirection()) {
              this.showPaymentRequiredDialog(reservation);
            }
          }
          return reservation;
        })
      ),
  });

    // Reopen cancelled reservation with PIN authorization
    async reopenReservation(): Promise<void> {
      const reservation = this.reservation.value();
      if (!reservation) return;
  
      if (reservation.status !== ReservationStatus.CANCELLED && reservation.status !== ReservationStatus.CHECKED_OUT && reservation.status !== ReservationStatus.NO_SHOW) {
        this.snackBar.open('Only cancelled, checked-out, or no-show reservations can be reopened', 'Close', {
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
  

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get the sharers FormArray
   */
  getSharersFormArray() {
    return this.reservationForm.controls['sharers'] as FormArray;
  }

  /**
   * Get the rooms FormArray
   */
  getRoomsFormArray() {
    return this.reservationForm.controls['rooms'] as FormArray;
  }

  private getAvailableRooms(params: { checkIn: Date; checkOut: Date }) {
    const storeId = this.storeStore.selectedStore()?._id;
    const checkInDate = new Date(params.checkIn).toISOString().split('T')[0];
    const checkOutDate = new Date(params.checkOut).toISOString().split('T')[0];

    if (!checkInDate || !checkOutDate || !storeId) {
      return of<AvailableRoom[]>([]);
    }

    return this.roomsService.getAvailableRooms({
      storeId,
      checkInDate,
      checkOutDate,
    });
  }

  private getReservation(id: string) {
    return this.reservationService.getReservationById(id);
  }

  public totalAmount = computed(() => {
    const subtotal = this.reservationForm.get('subtotal')?.value || 0;
    const taxes = this.reservationForm.get('taxes')?.value || 0;
    const discount = this.reservationForm.get('discount')?.value || 0;
    const total = subtotal + taxes - discount;
    return Math.max(0, total);
  });

  // Guest Management Methods
  onAddGuest() {
    // TODO: Open guest creation dialog
    this.snackBar.open('Guest creation dialog will be implemented', 'Close', {
      duration: 3000,
    });
  }

  onEditGuest() {
    const guest = this.selectedGuest();
    if (!guest) return;

    // TODO: Open guest edit dialog with selected guest data
    this.snackBar.open('Guest edit dialog will be implemented', 'Close', {
      duration: 3000,
    });
  }

  public onGuestSelected(guest: Guest): void {
    this.selectedGuest.set(guest);
    this.reservationForm.patchValue({
      guest: guest._id,
    });
    if (this.isSingleBooking() && this.getPrimaryGuest()) {
        this.getPrimaryGuest()?.patchValue({
          guest: guest._id,
          meta: guest,
          guestType: 'adult',
          checkInDate: this.checkIn(),
          checkOutDate: this.checkOut(),
        });
        this.getPrimaryRoom()?.patchValue({
          assignedGuest: guest._id,
          assignedGuestName: this.guestService.getGuestName(guest),
        });
    }
    this.snackBar.open(
      `Guest ${this.guestService.getGuestName(guest)} selected`,
      'Close',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  // onGuestSelected(guest: Guest): void {
  // const bookingType = this.reservationForm.get('bookingType')?.value;
  
  // if (bookingType === 'single') {
  //   // In single mode, set the main guest
  //   this.reservationForm.patchValue({
  //     guest: guest._id,
  //   });

  //   // Also assign this guest to the first room if it exists
  //   const roomsArray = this.reservationForm.get('rooms') as FormArray;
  //   if (roomsArray && roomsArray.length > 0) {
  //     const firstRoom = roomsArray.at(0);
  //     firstRoom?.patchValue({
  //       assignedGuest: guest._id,
  //       assignedGuestName: this.guestService.getGuestName(guest),
  //     });
  //   }
  // } else if (bookingType === 'group') {
  //   // In group mode, set the main guest
  //   this.reservationForm.patchValue({
  //     guest: guest._id,
  //   });
  // }

  // this.snackBar.open(
  //     `Guest ${this.guestService.getGuestName(guest)} selected`,
  //     'Close',
  //     {
  //       duration: 2000,
  //       panelClass: ['success-snackbar'],
  //     }
  //   );
  // }

  onDeleteGuest() {
    // I don't want to delete the primary guest if there are other guests in sharers with assigned IDs
    const sharersArray = this.getSharersFormArray();

    // Check if there are other sharers (besides primary) that have guests assigned
    const hasOtherGuestsAssigned =
      sharersArray.length > 1 &&
      Array.from({ length: sharersArray.length - 1 }, (_, i) =>
        sharersArray.at(i + 1)
      ).some((sharer) => sharer?.get('guest')?.value);

    if (this.isSingleBooking() && hasOtherGuestsAssigned) {
      this.snackBar.open(
        'Cannot remove primary guest while there are other sharers assigned. Please remove sharers first.',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    this.selectedGuest.set(null);
    this.getPrimaryGuest()?.patchValue({
      guest: null,
      meta: null,
      guestType: null,
    });
    this.snackBar.open('Guest removed', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }

  public getPrimaryGuest() {
    if (this.getSharersFormArray().length > 0) {
      return this.getSharersFormArray().at(0);
    }
    return null;
  }

    public getPrimaryRoom() {
    if (this.getRoomsFormArray().length > 0) {
      return this.getRoomsFormArray().at(0);
    }
    return null;
  }

  public onSelectedGuestChange(guest: Guest | null): void {
    // if (guest) {
    //   this.selectedGuest.set(guest);
    // }
  }

  /**
   * Populate the reservation form with existing reservation data for editing
   */
  private populateForm(reservation: Reservation): void {
    // Set basic reservation details
    this.reservationForm.patchValue({
      bookingType: reservation?.bookingType || 'group',
      guest: reservation.guest._id,
      checkInDate: new Date(reservation.checkInDate),
      checkOutDate: new Date(reservation.checkOutDate),
      numberOfNights: reservation.numberOfNights,
      bookingSource: reservation.bookingSource,
      paymentInfo: {
        method: reservation.paymentInfo?.method || 'cash',
        status: reservation.paymentInfo?.status || 'pending',
      },
      numberOfAdults: reservation.numberOfAdults || 1,
      numberOfChildren: reservation.numberOfChildren || 0,
      pricing: {
        subtotal: reservation.pricing?.subtotal || 0,
        taxes: reservation.pricing?.taxes || 0,
        fees: {
          serviceFee: reservation.pricing?.fees?.serviceFee || 0,
          cleaningFee: reservation.pricing?.fees?.cleaningFee || 0,
          resortFee: reservation.pricing?.fees?.resortFee || 0,
          other: reservation.pricing?.fees?.other || 0,
        },
        discounts: reservation.pricing?.discounts || 0,
        total: reservation.pricing?.total || 0,
        paid: reservation.pricing?.paid || 0,
        balance: reservation.pricing?.balance || 0,
      },
      specialRequests: reservation.specialRequests || '',
      internalNotes: reservation.internalNotes || '',
    });

    // Set selected guest
    if (reservation.guest) {
      this.selectedGuest.set(reservation.guest as Guest);
    }
  }

  public payment(): void {
    if (this.isEditing()) {
      this.showPaymentRequiredDialog(this.reservation.value()!);
    } else {
      this.onSubmit(true);
    }

    
  }

  public onSubmit(payment?: boolean): void {
    if (this.reservationForm.invalid) {
      const invalidControls = this.getInvalidControls(this.reservationForm);
      
      this.dialog.open(ValidationErrorsDialogComponent, {
        data: {
          invalidControls,
          title: 'Form Validation Errors',
          message: 'Please fix the following errors before submitting:'
        } as ValidationErrorsDialogData,
        width: '500px',
        maxWidth: '90vw',
        disableClose: false,
      });

      return;
    }

    const guest = this.selectedGuest();
    if (!guest) {
      this.snackBar.open('Please select a guest', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const formData = this.reservationForm.getRawValue();
    const store = this.storeStore.selectedStore();

    if (!store?._id) {
      this.snackBar.open('No store selected', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }
    this.isSubmitted.set(true);
    if (this.isEditing()) {
      this.updateReservation(formData);
    } else {
      this.createReservation(formData, payment);
    }
  }

  private createReservation(data: any, payment?: boolean) {
    this.reservationService
      .createReservation(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.isSubmitted.set(false);
          this.snackBar.open('Reservation created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          // Redirect to edit the newly created reservation
             this.router.navigate(['../edit', reservation._id], { relativeTo: this.route }).then(() => {
              if (payment) {
                 this.showPaymentRequiredDialog(reservation);
              }
            });
          
        },
        error: (error) => {
          this.isSubmitted.set(false);
          console.error('Error creating reservation:', error);
          this.snackBar.open(
            'Failed to create reservation. Please try again.',
            'Close',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  private updateReservation(data: any) {
    const reservationId = this.id();
    if (!reservationId) return;

    this.reservationService
      .updateReservation(reservationId, this.reservationForm.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.isSubmitted.set(false);
          this.snackBar.open('Reservation updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
         this.reservation.reload();
        },
        error: (error) => {
          console.error('Error updating reservation:', error);
          this.isSubmitted.set(false);
          this.snackBar.open(
            'Failed to update reservation. Please try again.',
            'Close',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  // Room Sharers Methods
  onAddSharer() {
    // TODO: Open guest search/selection dialog
    this.snackBar.open('Guest selection dialog will be implemented', 'Close', {
      duration: 3000,
    });
  }

  onEditSharer(event: any) {
    const { index, sharer } = event;
    // TODO: Open guest search/selection dialog for editing
    this.snackBar.open(`Editing sharer at index ${index}`, 'Close', {
      duration: 3000,
    });
  }

  onDeleteSharer(event: any) {
    const { index } = event;
    this.snackBar.open(`Sharer at index ${index} deleted`, 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }

  // Perform the actual check-out process
  private async performCheckOut(): Promise<void> {
    const reservation = this.reservation.value();
    if (!reservation) return;

    // Check if payment is required before checkout
    if (this.requiresPaymentBeforeCheckout(reservation)) {
      this.showPaymentRequiredDialog(reservation);
      return;
    }

    this.statusUpdating.set(true);

    try {
      // Use the enhanced check-out method that handles room status
      const updatedReservation = await this.reservationService
        .checkOutReservationWithRooms(reservation._id)
        .toPromise();

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

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to check out guest';
      this.snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  private requiresPaymentBeforeCheckout(reservation: Reservation): boolean {
    const hasOutstandingBalance = reservation.pricing.balance > 0;
    const paymentNotPaid = reservation.paymentInfo?.status !== 'paid';

    return hasOutstandingBalance && paymentNotPaid;
  }

  // Show payment required dialog before checkout
  public showPaymentRequiredDialog(reservation: Reservation): void {
    const dialogData: PaymentUpdateDialogData = {
      reservation,
      isCheckoutFlow: true, // Add this flag to indicate checkout flow
    };

    const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.confirmed) {
        // Reload the reservation to get updated payment/transaction info
        this.reservation.reload();
        
        // Check if payment is fully cleared
        const updatedReservation = this.reservation.value();
        if (updatedReservation && updatedReservation.pricing.balance <= 0) {
          // Full payment cleared - show success message
          this.snackBar.open(
            '✓ Payment completed! Checkout is now available.',
            'Close',
            {
              duration: 5000,
              panelClass: ['success-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
        } else {
          // Partial payment made - show warning that full payment is required
          const remainingBalance = updatedReservation ? updatedReservation.pricing.balance : 0;
          this.snackBar.open(
            `⚠️ Checkout Requires Full Payment - Outstanding balance: ${this.storeStore.selectedStore()?.currency} ${remainingBalance}. Please collect full payment before checkout.`,
            'Continue Collecting',
            {
              duration: 0,
              panelClass: ['warning-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          ).onAction().subscribe(() => {
            // Allow user to process more payments
            this.showPaymentRequiredDialog(updatedReservation!);
          });
        }
      } else {
        // Show warning if dialog was closed without completing payment
        const updatedReservation = this.reservation.value();
        if (updatedReservation && this.requiresPaymentBeforeCheckout(updatedReservation)) {
          this.snackBar.open(
            `⚠️ Checkout Requires Full Payment - Outstanding balance: 
            ${this.storeStore.selectedStore()?.currency} ${updatedReservation.pricing.balance}. Please collect full payment before checkout.`,
            'Close',
            {
              duration: 5000,
              panelClass: ['warning-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
        }
      }
    });
  }

  getInvalidControls(
    form: FormGroup | FormArray,
    parentPath: string = ''
  ): string[] {
    const invalidControls: string[] = [];

    Object.keys(form.controls).forEach((controlName) => {
      const control = form.get(controlName);
      const controlPath = parentPath
        ? `${parentPath}.${controlName}`
        : controlName;

      if (!control) return;

      if (control instanceof FormGroup || control instanceof FormArray) {
        invalidControls.push(...this.getInvalidControls(control, controlPath));
      } else {
        if (control.invalid) {
          invalidControls.push(controlPath);
        }
      }
    });

    return invalidControls;
  }

  // Update reservation status
  async updateReservationStatus(newStatus: string): Promise<void> {
    const reservation = this.reservation.value();
    if (!reservation || reservation.status === newStatus) return;

    // Special handling for reopen - requires PIN authorization
    // if (newStatus === 'reopen') {
    //   this.reopenReservation();
    //   return;
    // }

    // Special handling for check-in - show room readiness dialog
    if (newStatus === ReservationStatus.CHECKED_IN) {
      this.showCheckInDialog(reservation);
      return;
    }

    // Special handling for check-out - use enhanced check-out
    if (newStatus === 'checked_out') {
      this.performCheckOut();
      return;
    }

    // Validate business rules for status transitions
    // if (!this.isValidStatusTransition(reservation.status, newStatus)) {
    //   this.snackBar.open(this.getStatusTransitionError(reservation.status, newStatus), 'Close', {
    //     duration: 5000,
    //     panelClass: ['error-snackbar']
    //   });
    //   return;
    // }

    // Confirm status change for critical statuses
    if (newStatus === ReservationStatus.CANCELLED || newStatus === ReservationStatus.NO_SHOW) {
      const confirmed = confirm(`Are you sure you want to change the status to ${newStatus}?`);
      if (!confirmed) return;
    }

    await this.performStatusUpdate(newStatus);
  }

  // Perform status update
  private async performStatusUpdate(newStatus: string): Promise<void> {
    const reservation = this.reservation.value();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      const updateData: UpdateReservationDto = {
        status: newStatus as any,
      };

      const updatedReservation = await this.reservationService
        .updateReservation(reservation._id, updateData)
        .toPromise();

      if (updatedReservation) {
        this.reservation.set(updatedReservation);
        this.snackBar.open(
          `Reservation status updated to ${newStatus}`,
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update reservation status';
      this.snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
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
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.confirmed) {
        this.performCheckIn(result);
      }
    });
  }

  private async performCheckIn(checkInData: any): Promise<void> {
    const reservation = this.reservation.value();
    if (!reservation) return;

    this.statusUpdating.set(true);

    try {
      // Use the enhanced check-in method that handles room status
      const updatedReservation = await this.reservationService
        .checkInReservationWithRooms(reservation._id, checkInData)
        .toPromise();

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

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to check in guest';
      this.snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  onCancel() {
    this.location.back();
  }

  clearError() {}


}
