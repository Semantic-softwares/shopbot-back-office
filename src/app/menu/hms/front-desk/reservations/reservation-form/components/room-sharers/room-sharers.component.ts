import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  OnInit,
  model,
  untracked,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { GuestFormModalComponent } from '../../../../../../../shared/components/guest-form-modal/guest-form-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Guest } from '../../../../../../../shared/models/reservation.model';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { BreakDownTotal } from '../break-down-total/break-down-total';
import { PriceEditDialogComponent } from '../price-edit-dialog/price-edit-dialog.component';
import { RoomsService } from '../../../../../../../shared/services/rooms.service';
import { distinctUntilChanged, tap, of } from 'rxjs';
import { Room } from '../../../../../../../shared/models/room.model';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';

@Component({
  selector: 'app-room-sharers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    BreakDownTotal,
    PriceEditDialogComponent,
  ],
  templateUrl: './room-sharers.component.html',
  styleUrl: './room-sharers.component.scss',
})
export class RoomSharersComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // Inputs
  private reservationFormService = inject(ReservationFormService);
  public reservationForm = toSignal<FormGroup | null>(
    this.reservationFormService.form$,
    { initialValue: null }
  );
  private checkInDate = toSignal<Date | null>(
    this.reservationForm()!.get('checkInDate')!.valueChanges,
    { initialValue: this.reservationForm()!.get('checkInDate')!.value }
  );
  private checkOutDate = toSignal<Date | null>(
    this.reservationForm()!.get('checkOutDate')!.valueChanges,
    { initialValue: this.reservationForm()!.get('checkOutDate')!.value }
  );

  private numberOfAdults = toSignal<number | null>(
    this.reservationForm()!.get('numberOfAdults')!.valueChanges,
    { initialValue: this.reservationForm()!.get('numberOfAdults')!.value }
  );

  private numberOfChildren = toSignal<number | null>(
    this.reservationForm()!.get('numberOfChildren')!.valueChanges,
    { initialValue: this.reservationForm()!.get('numberOfChildren')!.value }
  );

  quickReservation = input<any>(null);
  selectedGuest = model<Guest | null>(null);
  isEditing = input<boolean>(false);

  // Outputs
  sharerAdded = output<any>();
  sharerEdited = output<any>();
  sharerDeleted = output<any>();
  sharersArrayUpdated = output<FormArray>();

  // Signals for reservation date limits
  reservationMinDate = signal<Date | null>(null);
  reservationMaxDate = signal<Date | null>(null);
  private dialog = inject(MatDialog);
  private roomService = inject(RoomsService);

  // Track for list rows
  trackByIndex(index: number) {
    return index;
  }

  // Room availability resource
  public roomsResource = rxResource({
    params: () => ({ 
      roomId: this.isEditing() ? null : (this.quickReservation()?.selectedRoom || this.reservationForm()!.get('rooms')?.value[0]?.room),
      isEditing: this.isEditing()
    }),
    stream: ({ params }) => {
      // Skip loading room data if we're editing (data already populated from form)
      if (params.isEditing || !params.roomId) {
        return of(null);
      }
      return this.getRoom(params.roomId).pipe(
        tap((room) => {
          // use the single room data to build a rooms array
          const roomsArray = this.getRoomsFormArray();
          if (roomsArray && room) {
            const roomGroup = this.createRoomFormGroup(room);
            roomsArray.clear();
            roomsArray.push(roomGroup);
          }
        })
      );
    },
  });




   ngAfterViewInit() {
      // Update reservation date limits for sharers
      this.reservationMinDate.set(this.checkInDate()!);
      this.reservationMaxDate.set(this.checkOutDate()!);

      const roomsArray = this.reservationForm()!.get('rooms') as FormArray;
      const sharersArray = this.reservationForm()!.get('sharers') as FormArray;

      // Listen to check-in and check-out date changes
      const checkInSub = this.reservationForm()?.get('checkInDate')?.valueChanges.subscribe((date) => {
        this.reservationMinDate.set(date);
        
        // Update rooms stay period
        for (let i = 0; i < roomsArray.length; i++) {
          roomsArray.at(i)?.patchValue({
            stayPeriod: {
              from: date,
            }
          }, { emitEvent: false });
        }

        // Update sharers dates
        const sharersArray = this.reservationForm()!.get('sharers') as FormArray;
        if (sharersArray) {
          for (let i = 0; i < sharersArray.length; i++) {
            sharersArray.at(i)?.patchValue({ checkInDate: date }, { emitEvent: false });
          }
        }
      });

      const checkOutSub = this.reservationForm()?.get('checkOutDate')?.valueChanges.subscribe((date) => {
        this.reservationMaxDate.set(date);
        
        // Calculate nights from current reservation dates
        const checkIn = this.reservationForm()?.get('checkInDate')?.value;
        const diffTime = Math.abs(date.getTime() - checkIn.getTime());
        const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Update rooms stay period and pricing
        for (let i = 0; i < roomsArray.length; i++) {
          const roomControl = roomsArray.at(i);
          const pricing = roomControl?.get('pricing') as FormGroup;
          const pricePerNight = pricing?.get('pricePerNight')?.value || 0;
          const totalPrice = pricePerNight * nightsCount;

          roomControl?.patchValue({
            stayPeriod: {
              to: date,
              numberOfNights: nightsCount,
            },
            pricing: {
              totalPrice: totalPrice,
              subtotal: totalPrice,
              total: totalPrice,
            }
          }, { emitEvent: true }); // Emit event so breakdown listens to changes
        }

        // Update sharers dates ONLY if this is a direct reservation date change
        const sharersArray = this.reservationForm()!.get('sharers') as FormArray;
        if (sharersArray) {
          for (let i = 0; i < sharersArray.length; i++) {
            sharersArray.at(i)?.patchValue({ checkOutDate: date }, { emitEvent: false });
          }
        }
      });

      // Listen to room nights changes to update pricing (for room-specific changes)
      roomsArray?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      ).subscribe(() => {
        // Update pricing based on each room's individual numberOfNights
        for (let i = 0; i < roomsArray.length; i++) {
          const roomControl = roomsArray.at(i);
          const pricing = roomControl?.get('pricing') as FormGroup;
          const stayPeriod = roomControl?.get('stayPeriod') as FormGroup;
          
          const pricePerNight = pricing?.get('pricePerNight')?.value || 0;
          const numberOfNights = stayPeriod?.get('numberOfNights')?.value || 0;
          const totalPrice = pricePerNight * numberOfNights;

          roomControl?.patchValue({
            pricing: {
              totalPrice: totalPrice,
              subtotal: totalPrice,
              total: totalPrice,
            }
          }, { emitEvent: true }); // Emit event so breakdown listens
        }
      });
    }

  numberOfNights = computed(() => {
    const checkIn = this.checkInDate();
    const checkOut = this.checkOutDate();
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  });

  createRoomFormGroup(room: Room, roomData?: any) {
    // Determine the room price: use priceOverride if available, otherwise use room type base price
    let roomPrice = roomData?.pricing?.pricePerNight || 0;
    if (!roomPrice) {
      if (room.priceOverride) {
        roomPrice = room.priceOverride;
      } else if (
        typeof room.roomType === 'object' &&
        room.roomType?.basePrice
      ) {
        roomPrice = room.roomType.basePrice;
      }
    }

    // Calculate initial number of nights

    // Calculate initial total price based on price per night and number of nights
    const initialTotalPrice = roomPrice * this.numberOfNights();

    return this.fb.group({
      room: [roomData?.room || room._id || '', [Validators.required]], // Room ID
      roomNumber: [roomData?.roomNumber || room.roomNumber || ''], // Store room number for display
      assignedGuest: [roomData?.assignedGuest || ''], // Guest ID (required for group)
      assignedGuestName: [roomData?.assignedGuestName || ''], // Guest display name (for display only)
      roomType: [
        roomData?.roomType ||
          (typeof room.roomType === 'string'
            ? room.roomType
            : room.roomType?._id) ||
          '',
        [Validators.required],
      ], // Room Type ID

      // Stay period for this room
      stayPeriod: this.fb.group({
        from: [this.checkInDate(), [Validators.required]],
        to: [this.checkOutDate(), [Validators.required]],
        numberOfNights: [
          roomData?.stayPeriod?.numberOfNights || this.numberOfNights(),
          [Validators.required, Validators.min(1)],
        ],
      }),

      // Guest distribution for this room
      guests: this.fb.group({
        adults: [
          roomData?.guests?.adults || 1,
          [Validators.required, Validators.min(1)],
        ],
        children: [
          roomData?.guests?.children || 0,
          [Validators.required, Validators.min(0)],
        ],
      }),

      // Per-room pricing
      pricing: this.fb.group({
        pricePerNight: [
          roomData?.pricing?.pricePerNight || roomPrice,
          [Validators.required, Validators.min(0)],
        ],
        totalPrice: [
          roomData?.pricing?.totalPrice || initialTotalPrice,
          [Validators.required, Validators.min(0)],
        ],
        discount: [roomData?.pricing?.discount || 0, [Validators.min(0)]],
        subtotal: [
          roomData?.pricing?.subtotal || initialTotalPrice,
          [Validators.min(0)],
        ],
        taxes: [roomData?.pricing?.taxes || 0, [Validators.min(0)]],
        discountType: [roomData?.pricing?.discountType || 'amount'], // 'amount' or 'percentage'
        fees: this.fb.group({
          serviceFee: [
            roomData?.pricing?.fees?.serviceFee || 0,
            [Validators.min(0)],
          ],
          cleaningFee: [
            roomData?.pricing?.fees?.cleaningFee || 0,
            [Validators.min(0)],
          ],
          resortFee: [
            roomData?.pricing?.fees?.resortFee || 0,
            [Validators.min(0)],
          ],
          other: [roomData?.pricing?.fees?.other || 0, [Validators.min(0)]],
        }),
        total: [
          roomData?.pricing?.total || initialTotalPrice,
          [Validators.min(0)],
        ],
      }),

      // Optional notes
      notes: [roomData?.notes || ''],
    });
  }

  getRoomsFormArray(): FormArray<any> {
    const form = this.reservationForm();
    if (form) {
      return form.get('rooms') as FormArray<any>;
    }
    return new FormArray<any>([]);
  }

  getRoom(roomId: string | null) {
    return this.roomService.getRoom(roomId!);
  }

  /**
   * Computed signal: Check if primary guest has been assigned
   */
  hasPrimaryGuest = computed(() => {
    const primaryGuest = this.selectedGuest();
    if (!primaryGuest) return false;
    const guestId = primaryGuest?._id;
    return guestId !== null && guestId !== undefined && guestId !== '';
  });

  ngOnInit() {
    // Initialize sharers FormArray when numberOfAdults or numberOfChildren change
    // Skip if we're editing (populateForm already populated the array)
    if (this.reservationForm() && !this.isEditing()) {
      const sharersArray = this.reservationForm()!.get('sharers') as FormArray;
      if (sharersArray) {
        // Only rebuild if the counts have changed
        const currentLength = sharersArray.length;
        const expectedLength =
          this.numberOfAdults()! + this.numberOfChildren()!;
        if (currentLength !== expectedLength) {
          // Clear and rebuild sharers array
          sharersArray.clear();

          // Add adult sharers
          for (let i = 0; i < this.numberOfAdults()!; i++) {
            const guestId =
              i === 0 && this.selectedGuest()
                ? this.selectedGuest()?._id
                : null;
            sharersArray.push(
              this.fb.group({
                guest: [guestId, [Validators.required]],
                guestType: ['individual'],
                ageGrade: ['adult'],
                checkInDate: [this.checkInDate()],
                checkOutDate: [this.checkOutDate()],
                meta: [null],
              })
            );
          }

          // Add child sharers
          for (let i = 0; i < this.numberOfChildren()!; i++) {
            sharersArray.push(
              this.fb.group({
                guest: [null, [Validators.required]],
                meta: [null],
                guestType: ['individual'],
                ageGrade: ['child'],
                checkInDate: [this.checkInDate()],
                checkOutDate: [this.checkOutDate()],
              })
            );
          }

          this.sharersArrayUpdated.emit(sharersArray);
        }
      }
    }
  }

  /**
   * Get the sharers FormArray
   */
  getSharersFormArray(): FormArray<any> {
    const form = this.reservationForm();
    if (form) {
      return form.get('sharers') as FormArray<any>;
    }
    return new FormArray<any>([]);
  }

  /**
   * Get primary guest (first sharer)
   */
  getPrimaryGuest() {
    const sharersArray = this.getSharersFormArray();
    if (sharersArray.length > 0) {
      return sharersArray.at(0);
    }
    return null;
  }

  /**
   * Get other sharers (all except first)
   */
  getOtherSharers() {
    const sharersArray = this.getSharersFormArray();
    if (sharersArray.length > 1) {
      return Array.from({ length: sharersArray.length - 1 }, (_, i) =>
        sharersArray.at(i + 1)
      );
    }
    return [];
  }

  /**
   * Add a new sharer (guest) to the list
   */
  public addSharer(guest: Guest, ageGrade: 'adult' | 'child'): void {
    const sharersArray = this.getSharersFormArray();
    const primaryGuest = this.getPrimaryGuest();
    
    // Check if primary guest is assigned
    const hasPrimaryGuest = primaryGuest?.value?.guest;

    if (!hasPrimaryGuest) {
      // If no primary guest, assign this guest to the primary position
      primaryGuest?.patchValue({
        guest: guest?._id,
        meta: guest,
        guestType: 'individual',
        ageGrade: ageGrade,
        checkInDate: this.reservationMinDate(),
        checkOutDate: this.reservationMaxDate(),
      });
      this.selectedGuest.set(guest);
    } else {
      // Otherwise, add as a new sharer
      sharersArray.push(
        this.fb.group({
          guest: [guest?._id],
          meta: guest,
          guestType: ['individual'],
          ageGrade: ageGrade,
          checkInDate: [this.reservationMinDate()],
          checkOutDate: [this.reservationMaxDate()],
        })
      );
    }
  }

  onCreateGuest() {
    const dialogRef = this.dialog.open(GuestFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: {
        bookingType: 'single',
        ageGrade: 'adult',
      },
    });

    dialogRef.afterClosed().subscribe((guest) => {
      if (guest) {
        this.addSharer(guest, 'adult');
      }
    });
  }

  /**
   * Edit an existing sharer
   */
  editSharer(index: number, ageGrade: 'adult' | 'child') {
    const sharersArray = this.getSharersFormArray();
    const sharer = sharersArray.at(index);
    if (!sharer) return;

    const primaryGuest = this.getPrimaryGuest();
    const hasPrimaryGuest = primaryGuest && primaryGuest.value.guest;

    // If editing non-primary sharer without a primary guest, assign to primary first
    if (index !== 0 && !hasPrimaryGuest) {
      index = 0;
    }

    // Open guest form modal for editing
    const dialogRef = this.dialog.open(GuestFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: {
        bookingType: 'single',
        guest: sharersArray.at(index)?.value.meta || null,
        ageGrade: ageGrade,
      },
    });

    dialogRef.afterClosed().subscribe((updatedGuest) => {
      if (updatedGuest) {
        this.updateSharerWithGuest(index, updatedGuest);
        this.sharerEdited.emit({ index, sharer: updatedGuest });
      }
    });
  }

  /**
   * Delete a sharer from the list
   */
  deleteSharer(index: number) {
    const sharersArray = this.getSharersFormArray();
    // Cannot delete primary guest
    if (index === 0) return;

    sharersArray.removeAt(index);
    this.sharerDeleted.emit({ index });
  }

  /**
   * Update a sharer with guest data (when selected from search)
   */
  updateSharerWithGuest(index: number, guest: any) {
    const sharersArray = this.getSharersFormArray();
    const sharer = sharersArray.at(index);
    if (!sharer) return;
    
    this.selectedGuest.set(guest);
    sharer.patchValue({
      guest: guest._id,
      meta: guest,
      guestType: 'adult',
    });

    // Also update the room's assigned guest if this is the primary guest (index 0)
    if (index === 0) {
      const roomsArray = this.getRoomsFormArray();
      if (roomsArray && roomsArray.length > 0) {
        const roomControl = roomsArray.at(0);
        if (roomControl) {
          roomControl.patchValue({
            assignedGuest: guest._id,
            assignedGuestName: `${guest.firstName || ''} ${guest.lastName || ''}`.trim(),
          });
        }
      }
    }
  }

  /**
   * Get sharer display name
   */
  getSharerName(control: any): string {
    const firstName = control.get('meta')?.value?.firstName;
    const lastName = control.get('meta')?.value?.lastName;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return 'Unassigned Guest';
  }

  /**
   * Safely cast control to FormGroup
   */
  asFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  /**
   * Get sharer type badge
   */
  getSharerTypeBadge(control: any): string {
    const index = this.getSharersFormArray().controls.indexOf(control);
    if (index === 0) return 'Primary Guest';
    const type = control.get('type')?.value;
    return type === 'adult' ? 'Adult' : 'Child';
  }

  /**
   * Get reservation minimum date (check-in)
   */
  getReservationMinDate(): Date | null {
    return this.reservationMinDate();
  }

  /**
   * Get reservation maximum date (check-out)
   */
  getReservationMaxDate(): Date | null {
    return this.reservationMaxDate();
  }

  /**
   * Calculate nights between check-in and check-out
   */
  calculateNights(checkInDate: any, checkOutDate: any): number {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate).getTime();
    const checkOut = new Date(checkOutDate).getTime();
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  }

  /**
   * Event handler for guest home button
   */
  onSharerHome(index: number) {
    // TODO: Navigate to guest details or open guest home view
  }

  /**
   * Event handler for guest check-in
   */
  onGuestCheckIn() {
    this.sharerAdded.emit({ action: 'check_in' });
  }

  /**
   * Event handler for generate guest service
   */
  onGenerateGuestService() {
    this.sharerAdded.emit({ action: 'generate_service' });
  }

  /**
   * Event handler for adding infants
   */
  onAddInfants() {
    const dialogRef = this.dialog.open(GuestFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: {
        bookingType: 'single',
        ageGrade: 'child',
      },
    });

    dialogRef.afterClosed().subscribe((guest) => {
      if (guest) {
        this.addSharer(guest, 'child');
      }
    });
    this.sharerAdded.emit({ action: 'add_infants' });
  }

 
  onEditRoomPricing() {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray || roomsArray.length === 0) return;

    const dialogRef = this.dialog.open(PriceEditDialogComponent, {
      width: '800px',
      disableClose: false,
      data: {
        roomIndex: 0, // Single room in room-sharers
      },
    });

    dialogRef.afterClosed().subscribe((updatedPricing) => {
      if (updatedPricing) {
        const roomControl = roomsArray.at(0);
        const pricingGroup = roomControl?.get('pricing') as FormGroup;
        if (pricingGroup) {
          pricingGroup.patchValue(updatedPricing, { emitEvent: true });
        }
      }
    });
  }
}

