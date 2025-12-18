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
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { GuestDetailsComponent } from './components/guest-details/guest-details.component';
import { StayDetailsComponent } from './components/stay-details/stay-details.component';
import { RoomSharersComponent } from './components/room-sharers/room-sharers.component';
import { RoomDetailsComponent } from './components/room-details/room-details.component';
import { PaymentInfo } from './components/payment-info/payment-info.component';
import { SpecialRequestsComponent } from './components/special-requests/special-requests.component';
import { ReservationFormService } from '../../../../../shared/services/reservation-form.service';

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
  private quickReservationQuery = signal(
    this.route.snapshot.queryParamMap.get('quickReservation')
  );

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

  public currency = computed(
    () =>
      this.storeStore.selectedStore()?.currency ||
      this.storeStore.selectedStore()?.currencyCode ||
      '$'
  );

  constructor() {
    this.reservationFormService.setForm(this.reservationForm);
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
     return this.reservation.hasValue() ? this.reservation.value()!.rooms.map((room) => room.room._id) : [];
      
    }
    
  });

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
    createdBy: [
      !this.isEditing() ? this.currentUser()?._id : '',
      [Validators.required],
    ],
    paymentInfo: this.fb.group({
      method: ['cash', [Validators.required]],
      status: ['pending', [Validators.required]],
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
          }
          return reservation;
        })
      ),
  });

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

  onGuestSelected(guest: Guest) {
    this.selectedGuest.set(guest);
    this.reservationForm.patchValue({
      guest: guest._id,
    });
    if (this.isSingleBooking()) {
      if (this.getPrimaryGuest()) {
        this.getPrimaryGuest()?.patchValue({
          guest: guest._id,
          meta: guest,
          guestType: 'adult',
          checkInDate: this.checkIn(),
          checkOutDate: this.checkOut(),
        });
      }
    }
    this.snackBar.open(
      `Guest ${guest?.firstName || guest?.companyName} ${
        guest?.lastName || guest?.contactPersonLastName
      } selected`,
      'Close',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  onDeleteGuest() {
    // I don't want to delete the primary guest if there are other guests in sharers with assigned IDs
    const primaryGuest = this.getPrimaryGuest();
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

  public onSelectedGuestChange(guest: Guest | null): void {
    if (guest) {
      this.selectedGuest.set(guest);
    }
  }

  /**
   * Populate the reservation form with existing reservation data for editing
   */
  private populateForm(reservation: Reservation): void {
    // Set basic reservation details
    this.reservationForm.patchValue({
      bookingType: reservation.bookingType,
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

    // Populate sharers FormArray
    const sharersArray = this.getSharersFormArray();
    sharersArray.clear();
    
    if (reservation.sharers && reservation.sharers.length > 0) {
      reservation.sharers.forEach((sharer: any) => {
        const sharerForm = this.fb.group({
          guest: [sharer.guest._id || sharer.guest, [Validators.required]],
          meta: [sharer.guest, []],
          guestType: [sharer.guestType || 'adult', [Validators.required]],
          checkInDate: [new Date(sharer.checkInDate), [Validators.required]],
          checkOutDate: [new Date(sharer.checkOutDate), [Validators.required]],
          ageGrade: [sharer.ageGrade || '', []],
        });
        sharersArray.push(sharerForm);
      });
    }

    // Populate rooms FormArray
    const roomsArray = this.getRoomsFormArray();
    roomsArray.clear();
    
    if (reservation.rooms && reservation.rooms.length > 0) {
      reservation.rooms.forEach((room: any) => {
        // Extract assigned guest ID and name
        let assignedGuestId = '';
        let assignedGuestName = '';
        
        if (room.assignedGuest) {
          // If assignedGuest is an object with _id property
          if (typeof room.assignedGuest === 'object' && room.assignedGuest._id) {
            assignedGuestId = room.assignedGuest._id;
            assignedGuestName = `${room.assignedGuest.firstName || ''} ${room.assignedGuest.lastName || ''}`.trim();
          } else if (typeof room.assignedGuest === 'string') {
            // If assignedGuest is just an ID string
            assignedGuestId = room.assignedGuest;
          }
        }

        const roomForm = this.fb.group({
          room: [room.room._id || room.room, [Validators.required]],
          roomNumber: [room.room?.roomNumber || '', []],
          roomType: [room.roomType, []],
          assignedGuest: [assignedGuestId, []],
          assignedGuestName: [assignedGuestName, []],
          stayPeriod: this.fb.group({
            from: [new Date(room.stayPeriod?.from), [Validators.required]],
            to: [new Date(room.stayPeriod?.to), [Validators.required]],
            numberOfNights: [room.stayPeriod?.numberOfNights || 1, [Validators.required, Validators.min(1)]],
          }),
          guests: this.fb.group({
            adults: [room.guests?.adults || 1, [Validators.required, Validators.min(1)]],
            children: [room.guests?.children || 0, [Validators.required, Validators.min(0)]],
          }),
          pricing: this.fb.group({
            pricePerNight: [room.pricing?.pricePerNight || 0, [Validators.required, Validators.min(0)]],
            totalPrice: [room.pricing?.totalPrice || 0, [Validators.required, Validators.min(0)]],
            discount: [room.pricing?.discount || 0, [Validators.min(0)]],
            discountType: [room.pricing?.discountType || 'percentage', []],
            subtotal: [room.pricing?.subtotal || 0, [Validators.min(0)]],
            taxes: [room.pricing?.taxes || 0, [Validators.min(0)]],
            fees: this.fb.group({
              serviceFee: [room.pricing?.fees?.serviceFee || 0, [Validators.min(0)]],
              cleaningFee: [room.pricing?.fees?.cleaningFee || 0, [Validators.min(0)]],
              resortFee: [room.pricing?.fees?.resortFee || 0, [Validators.min(0)]],
              other: [room.pricing?.fees?.other || 0, [Validators.min(0)]],
            }),
            total: [room.pricing?.total || 0, [Validators.min(0)]],
          }),
          notes: [room.notes || '', []],
        });
        roomsArray.push(roomForm);
      });
    }

    // Trigger change detection
    this.cdr.markForCheck();
  }

  onSubmit() {
    if (this.reservationForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
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

    // const reservationData: CreateReservationDto = {
    //   store: store._id,
    //   createdBy: currentUser?._id || '',
    //   guest: guest._id, // Use selected guest ID
    //   numberOfNights: formData.numberOfNights!,
    //   checkInDate: formData.checkInDate ? new Date(formData.checkInDate) : new Date(),
    //   checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate) : new Date(),
    //   rooms: (formData.rooms && formData.rooms.length > 0 ? formData.rooms : []) as any, // Include rooms from FormArray
    //   pricing: {
    //     subtotal: formData.pricing?.subtotal || 0,
    //     taxes: formData.pricing?.taxes || 0,
    //     discounts: formData.pricing?.discounts || 0,
    //     total: this.totalAmount(),
    //     paid: formData.pricing?.paid || 0,
    //     fees: {
    //       serviceFee: 0,
    //       cleaningFee: 0,
    //       resortFee: 0,
    //       other: 0,
    //     },
    //     balance: formData.pricing?.balance || 0,
    //   },
    //   paymentInfo: {
    //     method: formData.paymentInfo.method || 'cash',
    //     status: formData.paymentInfo.status || 'pending',
    //   },
    //   bookingSource: (formData.bookingSource || 'walk_in') as any,
    //   specialRequests: formData.specialRequests || '',
    //   internalNotes: formData.internalNotes || '',
    // };

    if (this.isEditing()) {
      this.updateReservation(formData);
    } else {
      this.createReservation(formData);
    }
  }

  private createReservation(data: any) {
    this.reservationService
      .createReservation(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.snackBar.open('Reservation created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.router.navigate(['/reservations']);
        },
        error: (error) => {
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
          this.snackBar.open('Reservation updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.router.navigate(['/reservations']);
        },
        error: (error) => {
          console.error('Error updating reservation:', error);
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

  onCancel() {
    this.location.back();
  }

  clearError() {}
}
