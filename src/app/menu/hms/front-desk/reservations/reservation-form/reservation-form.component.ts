import {
  Component,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, of, tap, firstValueFrom } from 'rxjs';

import { ReservationService } from '../../../../../shared/services/reservation.service';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { GuestService } from '../../../../../shared/services/guest.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import {
  UpdateReservationDto,
  Reservation,
  Guest,
} from '../../../../../shared/models/reservation.model';
import { AvailableRoom } from '../../../../../shared/models/room.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { ReservationStatus } from '../../../../../shared/enums/reservation-status.enum';
import { toSignal, rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuestDetailsComponent } from './components/guest-details/guest-details.component';
import { StayDetailsComponent } from './components/stay-details/stay-details.component';
import { HistoricalEntryComponent, HistoricalEntryState } from './components/historical-entry/historical-entry.component';
import { RoomSharersComponent } from './components/room-sharers/room-sharers.component';
import { RoomDetailsComponent } from './components/room-details/room-details.component';
import { BreakDownTotal } from './components/break-down-total/break-down-total';
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
import { RoomChangeDialogComponent, RoomChangeDialogData, RoomChangeResult } from '../room-change-dialog/room-change-dialog.component';
import { RoomChangeHistoryComponent } from '../room-change-history/room-change-history.component';
import { ReservationTransactionsComponent } from '../reservation-transactions/reservation-transactions.component';
import { ReservationOrdersComponent } from '../reservation-orders/reservation-orders.component';
import { TrPipe } from '../../../../../shared/i18n/tr.pipe';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { STAY_COLORS, STAY_ICONS, StayStatus } from '../reservation-view/reservations-calendar/tape-chart.util';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [TrPipe, 
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
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule,
    GuestDetailsComponent,
    StayDetailsComponent,
    HistoricalEntryComponent,
    RouterLink,
    RoomSharersComponent,
    RoomDetailsComponent,
    BreakDownTotal,
    SpecialRequestsComponent,
    RoomChangeHistoryComponent,
    ReservationTransactionsComponent,
    ReservationOrdersComponent,
  ],
  templateUrl: './reservation-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  public storeStore = inject(StoreStore);
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
  public hasRestrictionIssues = signal(false);


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
  /** What the server says about the dates (past? already audited? may this person enter them?). */
  public historicalState = signal<HistoricalEntryState>({ isBackdated: false, canBackdate: true, unknown: false, closedNights: [] });
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
      // Read the loaded reservation (a signal) so this updates when it arrives; the form value alone would be cached stale.
      return this.reservation.value()?.bookingType ?? this.reservationForm.get('bookingType')?.value;
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
          $localize`Reservation details exported to PDF successfully!`, 
          $localize`Close`, 
          { duration: 3000 }
        );
      }
    } catch (error) {
      console.error('Error exporting reservation to PDF:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to export reservation to PDF';
      this.snackBar.open(errorMessage, $localize`Close`, { 
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
      balance: [0],
    }),

    // Only for a stay entered after its dates began: what happened, and why. Turned into `status` and `backdating` on save.
    historical: this.fb.group({
      outcome: ['checked_out'],
      reason: [''],
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

  protected checkIn = toSignal(
    this.reservationForm.get('checkInDate')!.valueChanges,
    { initialValue: this.reservationForm.get('checkInDate')!.value }
  );

  protected checkOut = toSignal(
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


  // ── Header, status and rail state ─────────────────────────────────────────

  /** True once the user has touched a control; cleared after a save or reload. */
  public formDirty = signal(false);
  private readonly watchDirty = this.reservationForm.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => this.formDirty.set(this.reservationForm.dirty));

  public status = computed(() => this.reservation.value()?.status ?? null);

  public statusMeta = computed(() => {
    const status = this.status();
    if (!status) return null;
    return {
      label: this.statusLabel(status),
      color: STAY_COLORS[status as StayStatus] ?? '#64748b',
      icon: STAY_ICONS[status as StayStatus] ?? 'event',
    };
  });

  /** Cancelled / no-show end the normal pending > confirmed > checked-in > checked-out path. */
  public isClosedOut = computed(() => this.status() === ReservationStatus.CANCELLED || this.status() === ReservationStatus.NO_SHOW);

  public lifecycle = computed(() => {
    const status = this.status();
    const path = ['pending', 'confirmed', 'checked_in', 'checked_out'];
    const current = path.indexOf(status === 'reserved' ? 'pending' : (status ?? ''));
    return path.map((key, index) => ({
      key,
      label: this.statusLabel(key === 'pending' && status === 'reserved' ? 'reserved' : key),
      state: current < 0 ? 'todo' : index < current ? 'done' : index === current ? 'current' : 'todo',
    }));
  });

  public statusLabel(status: string): string {
    switch (status) {
      case 'pending': return $localize`Pending`;
      case 'reserved': return $localize`Reserved`;
      case 'confirmed': return $localize`Confirmed`;
      case 'checked_in': return $localize`Checked in`;
      case 'checked_out': return $localize`Checked out`;
      case 'cancelled': return $localize`Cancelled`;
      case 'no_show': return $localize`No-show`;
      default: return status;
    }
  }

  /** Edit mode, finished loading, but the server had nothing (bad link, deleted, no access). */
  public loadFailed = computed(() => this.isEditing() && !this.reservation.isLoading() && this.reservation.hasValue() && !this.reservation.value());

  public guestName = computed(() => {
    const guest = this.selectedGuest() ?? this.reservation.value()?.guest;
    return guest ? this.guestService.getGuestName(guest as Guest) : '';
  });

  /** Where the booking came from, only when it is worth a chip (OTA / channel manager). */
  public channelName = computed(() => {
    const res = this.reservation.value();
    return res?.channex?.channelType || (res?.channex?.bookingId ? $localize`Channel manager` : '');
  });

  public headerFacts = computed(() => {
    const res = this.reservation.value();
    const ci = new Date(this.checkIn() as Date);
    const co = new Date(this.checkOut() as Date);
    const valid = !isNaN(ci.getTime()) && !isNaN(co.getTime());
    const rooms = (res?.rooms ?? [])
      .map((r: any) => r?.room?.roomNumber || r?.room?.name)
      .filter(Boolean) as string[];
    return {
      rooms,
      checkIn: valid ? ci : null,
      checkOut: valid ? co : null,
      nights: valid ? Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86_400_000)) : 0,
      adults: res?.numberOfAdults ?? 0,
      children: res?.numberOfChildren ?? 0,
    };
  });

  public balanceDue = computed(() => this.reservation.value()?.pricing?.balance ?? 0);

  public ordersCount = computed(() => ((this.reservation.value() as any)?.orders ?? []).length);

  /** Small screens keep the breakdown at the bottom; the balance strip at the top jumps to it. */
  scrollToSummary(): void {
    document.getElementById('rf-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

    // Reopen cancelled reservation with PIN authorization
    async reopenReservation(): Promise<void> {
      const reservation = this.reservation.value();
      if (!reservation) return;
  
      if (reservation.status !== ReservationStatus.CANCELLED && reservation.status !== ReservationStatus.CHECKED_OUT && reservation.status !== ReservationStatus.NO_SHOW) {
        this.snackBar.open($localize`Only cancelled, checked-out, or no-show reservations can be reopened`, $localize`Close`, {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }
  
      const storeId = this.storeStore.selectedStore()?._id;
      if (!storeId) {
        this.snackBar.open($localize`Store information not available`, $localize`Close`, {
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
              this.snackBar.open($localize`Reservation reopened successfully`, $localize`Close`, { 
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
            
            this.snackBar.open(errorMessage, $localize`Close`, { 
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
    const checkInDate = this.formatLocalDate(new Date(params.checkIn));
    const checkOutDate = this.formatLocalDate(new Date(params.checkOut));

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
  /** The guest dialog already saved the guest; keep the card and the form's snapshot of them in sync. */
  public onGuestEdited(guest: Guest): void {
    this.selectedGuest.set(guest);
    this.getPrimaryGuest()?.patchValue({ meta: guest });
    this.getPrimaryRoom()?.patchValue({ assignedGuestName: this.guestService.getGuestName(guest) });
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
      $localize`Guest ${this.guestService.getGuestName(guest)} selected`,
      $localize`Close`,
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
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
      createdBy: reservation?.createdBy?._id,
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
          title: $localize`Form Validation Errors`,
          message: $localize`Please fix the following errors before submitting:`
        } as ValidationErrorsDialogData,
        width: '500px',
        maxWidth: '90vw',
        disableClose: false,
      });

      return;
    }

    const guest = this.selectedGuest();
    if (!guest) {
      this.snackBar.open($localize`Please select a guest`, $localize`Close`, {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const historical = this.historicalState();
    const historicalGroup = this.reservationForm.get('historical') as FormGroup;
    if (!this.isEditing() && historical.isBackdated) {
      if (!historical.canBackdate) {
        this.snackBar.open($localize`You do not have permission to create backdated reservations. Ask a manager.`, $localize`Close`, { duration: 6000, panelClass: ['error-snackbar'] });
        return;
      }
      if (String(historicalGroup.get('reason')?.value ?? '').trim().length < 5) {
        historicalGroup.get('reason')?.markAsTouched();
        this.snackBar.open($localize`Say why this reservation is being entered for a past date.`, $localize`Close`, { duration: 5000, panelClass: ['error-snackbar'] });
        return;
      }
    }

    const formData: any = this.reservationForm.getRawValue();
    // The server decides what a historical entry means; the form only says what happened and why.
    if (!this.isEditing() && historical.isBackdated) {
      formData.status = formData.historical?.outcome || 'confirmed';
      formData.backdating = { reason: String(formData.historical?.reason ?? '').trim() };
    }
    delete formData.historical;

    // Normalize dates to YYYY-MM-DD strings to prevent timezone shift during JSON serialization.
    // Without this, Date objects serialize as ISO strings (e.g. "2026-03-03T23:00:00.000Z" for
    // March 4 in UTC+1), causing the backend to store the wrong calendar date.
    if (formData.checkInDate) {
      (formData as any).checkInDate = this.formatLocalDate(new Date(formData.checkInDate));
    }
    if (formData.checkOutDate) {
      (formData as any).checkOutDate = this.formatLocalDate(new Date(formData.checkOutDate));
    }

    // Clean rooms: convert empty-string ratePlanId to null (Mongoose can't cast '' to ObjectId)
    // Also normalize stayPeriod dates to YYYY-MM-DD strings
    if (formData.rooms && Array.isArray(formData.rooms)) {
      formData.rooms = formData.rooms.map((room: any) => ({
        ...room,
        ratePlanId: room.ratePlanId || null,
        stayPeriod: room.stayPeriod ? {
          from: room.stayPeriod.from ? this.formatLocalDate(new Date(room.stayPeriod.from)) : room.stayPeriod.from,
          to: room.stayPeriod.to ? this.formatLocalDate(new Date(room.stayPeriod.to)) : room.stayPeriod.to,
        } : room.stayPeriod,
      }));
    }

    // Debug: verify ratePlanId is being sent
    console.log('[ReservationForm] onSubmit rooms payload:', formData.rooms?.map((r: any) => ({
      room: r.room,
      roomType: r.roomType,
      ratePlanId: r.ratePlanId,
    })));

    const store = this.storeStore.selectedStore();

    if (!store?._id) {
      this.snackBar.open($localize`No store selected`, $localize`Close`, {
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
          const pending = (reservation as any)?.historicalCorrection;
          this.snackBar.open(
            pending ? $localize`Reservation recorded. The charges for days that were already closed are waiting for a manager's approval.` : $localize`Reservation created successfully`,
            $localize`Close`,
            { duration: pending ? 9000 : 3000, panelClass: ['success-snackbar'] },
          );
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
          // The server explains refusals (a room already taken, a past date without the right or a reason): say what it said.
          const serverMessage = error?.error?.message ?? error?.error?.error;
          this.snackBar.open(
            typeof serverMessage === 'string' && [400, 403, 409].includes(error?.status) ? serverMessage : $localize`Failed to create reservation. Please try again.`,
            $localize`Close`,
            {
              duration: 6000,
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
      .updateReservation(reservationId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.isSubmitted.set(false);
          this.snackBar.open($localize`Reservation updated successfully`, $localize`Close`, {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.reservationForm.markAsPristine();
          this.formDirty.set(false);
          this.reservation.reload();
        },
        error: (error) => {
          console.error('Error updating reservation:', error);
          this.isSubmitted.set(false);
          this.snackBar.open(
            $localize`Failed to update reservation. Please try again.`,
            $localize`Close`,
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
    this.snackBar.open($localize`Guest selection dialog will be implemented`, $localize`Close`, {
      duration: 3000,
    });
  }

  onEditSharer(event: any) {
    const { index, sharer } = event;
    // TODO: Open guest search/selection dialog for editing
    this.snackBar.open($localize`Editing sharer at index ${index}`, $localize`Close`, {
      duration: 3000,
    });
  }

  onDeleteSharer(event: any) {
    const { index } = event;
    this.snackBar.open($localize`Sharer at index ${index} deleted`, $localize`Close`, {
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
          $localize`Guest checked out successfully! Room status updated to cleaning.`,
          $localize`Close`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error during check-out:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to check out guest';
      this.snackBar.open(errorMessage, $localize`Close`, {
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
            $localize`✓ Payment completed! Checkout is now available.`,
            $localize`Close`,
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
            $localize`⚠️ Checkout Requires Full Payment - Outstanding balance: ${this.storeStore.selectedStore()?.currency} ${remainingBalance}. Please collect full payment before checkout.`,
            $localize`Continue Collecting`,
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
            $localize`⚠️ Checkout Requires Full Payment - Outstanding balance: 
            ${this.storeStore.selectedStore()?.currency} ${updatedReservation.pricing.balance}. Please collect full payment before checkout.`,
            $localize`Close`,
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
      const cancelling = newStatus === ReservationStatus.CANCELLED;
      const confirmed = await firstValueFrom(
        this.dialog
          .open(ConfirmDialogComponent, {
            width: '420px',
            maxWidth: '92vw',
            data: {
              title: cancelling ? $localize`Cancel this reservation?` : $localize`Mark this guest as a no-show?`,
              message: cancelling
                ? $localize`The reservation will be marked as cancelled. It can be re-opened later with a manager PIN.`
                : $localize`The reservation will be marked as a no-show.`,
              confirmText: cancelling ? $localize`Cancel reservation` : $localize`Mark no-show`,
              cancelText: $localize`Keep reservation`,
            },
          })
          .afterClosed()
      );
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
          $localize`Reservation status updated to ${newStatus}`,
          $localize`Close`,
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update reservation status';
      this.snackBar.open(errorMessage, $localize`Close`, {
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
          $localize`Guest checked in successfully! Room status updated to occupied.`,
          $localize`Close`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error during check-in:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to check in guest';
      this.snackBar.open(errorMessage, $localize`Close`, {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.statusUpdating.set(false);
    }
  }

  /** Check if room change is allowed based on status */
  canChangeRooms(): boolean {
    const reservation = this.reservation.value();
    if (!reservation) return false;
    const status = reservation.status;
    return status && !['checked_out', 'cancelled', 'no_show'].includes(status);
  }

  /** Open room change dialog */
  async openRoomChangeDialog(roomIndex?: number) {
    const reservationData = this.reservation.value();
    
    if (!reservationData || !this.canChangeRooms()) {
      this.snackBar.open($localize`Cannot change rooms for this reservation`, $localize`Close`, { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(RoomChangeDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        reservationId: reservationData._id,
        currentRooms: reservationData.rooms,
        currentRoomIndex: roomIndex,
        checkInDate: new Date(reservationData.checkInDate).toISOString(),
        checkOutDate: new Date(reservationData.checkOutDate).toISOString(),
        numberOfNights: reservationData.numberOfNights,
        currency: this.storeStore.selectedStore()?.currency || 'USD',
        actualCheckInDate: reservationData.actualCheckInDate 
          ? new Date(reservationData.actualCheckInDate).toISOString() 
          : undefined,
        reservationStatus: reservationData.status,
        storeId: this.storeStore.selectedStore()?._id || '',
      } as RoomChangeDialogData
    });

    dialogRef.afterClosed().subscribe(async (result: RoomChangeResult) => {
      if (result) {
        try {
          const response = await this.reservationService.changeRooms(reservationData._id, result).toPromise();
          if (response?.success) {
            this.snackBar.open($localize`Room changed successfully`, $localize`Close`, { duration: 3000 });
            // Reload the reservation data
            this.reservation.reload();
          }
        } catch (error: any) {
          console.error('Error changing rooms:', error);
          const errorMessage = error?.error?.error || error?.error?.message || error?.message || 'Failed to change rooms';
          this.snackBar.open(errorMessage, $localize`Close`, { duration: 5000 });
        }
      }
    });
  }

  onCancel() {
    this.location.back();
  }

  /** Try loading the reservation again after a failure. */
  retry() {
    this.reservation.reload();
  }

  /**
   * Format a Date to 'YYYY-MM-DD' using local time (not UTC).
   * Avoids timezone shift that toISOString() causes.
   */
  private formatLocalDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
