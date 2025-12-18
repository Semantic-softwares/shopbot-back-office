import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDateRangeSelectionStrategy } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { RoomsService } from '../../../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { Room, RoomType } from '../../../../../../../shared/models/room.model';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { GuestFormModalComponent } from '../../../../../../../shared/components/guest-form-modal/guest-form-modal.component';
import { PriceEditDialogComponent } from '../price-edit-dialog/price-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { BreakDownTotal } from "../break-down-total/break-down-total";
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatListModule,
    CurrencyMaskModule,
    BreakDownTotal
],
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.scss',
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }],
})
export class RoomDetailsComponent implements OnInit {
  private roomsService = inject(RoomsService);
  public storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Inputs
  private reservationFormService = inject(ReservationFormService);
  public reservationForm = toSignal<FormGroup | null>(
    this.reservationFormService.form$,
    { initialValue: null }
  );
  selectedRoomIds = input<string[]>([]);

  // Outputs
  roomAssigned = output<any>();

  // Signals
  rooms = signal<Room[]>([]);
  roomTypes = signal<RoomType[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  assigningRoomId = signal<string | null>(null);
  filteredRooms = signal<Room[]>([]);
  assignedGuests = signal<Map<string, any>>(new Map()); // Store guest objects by ID

  // Computed properties
  totalRooms = computed(() => this.rooms().length);
  totalCapacity = computed(() => {
    return this.rooms().reduce((sum, room) => {
      const capacity = room.capacity;
      if (typeof capacity === 'object' && capacity !== null) {
        return (
          sum +
          ((capacity as any).adults || 0) +
          ((capacity as any).children || 0)
        );
      }
      return sum + ((capacity as unknown as number) || 0);
    }, 0);
  });

  // Check if we're in edit mode by seeing if rooms are already populated in the form
  isEditingRooms = computed(() => {
    const roomsArray = this.getRoomsFormArray();
    return roomsArray && roomsArray.length > 0;
  });

  price(index: number): number {  
    return this.getRoomsFormArray()!.at(index)!.get('pricing')!.get('total')?.value 
  }

  ngOnInit() {
    this.loadRoomTypes();
    // Only load rooms if not in edit mode (form is empty)
    // If editing, rooms are already populated by parent component
    if (!this.isEditingRooms()) {
      this.loadRooms();
    } else {
      // In edit mode, just load the room details for display (without overwriting form data)
      this.loadRoomDetailsForDisplay();
    }
  }

 



  /**
   * Load all room types
   */
  private loadRoomTypes() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      console.warn('No store selected');
      return;
    }

    this.roomsService.getRoomTypes(storeId).subscribe({
      next: (types) => {
        this.roomTypes.set(types);
      },
      error: (err) => {
        console.error('Error loading room types:', err);
      },
    });
  }

  /**
   * Load all store rooms for display in edit mode (allows users to change room assignments)
   * This loads all rooms without overwriting the already-populated form data
   */
  private loadRoomDetailsForDisplay() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.rooms.set([]);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Load all rooms for the store so users can change room assignments
    this.roomsService.getRooms(storeId).subscribe({
      next: (loadedRooms: Room[]) => {
        // Set rooms signal for display purposes only - don't touch the form
        this.rooms.set(loadedRooms);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading rooms for edit mode:', err);
        // Silently fail to avoid disrupting edit mode - form data is still valid
        this.isLoading.set(false);
      },
    });
  }

  onCreateRoom() {
    // build empty room form group
    const newRoomForm = this.createRoomFormGroup({} as Room);
    // add to rooms form array
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray) {
      const newIndex = roomsArray.length;
      roomsArray.push(newRoomForm);
      
      // Set up subscription for the new room's stay period
      const stayPeriodForm = newRoomForm.get('stayPeriod');
      if (stayPeriodForm) {
        stayPeriodForm.valueChanges.subscribe(() => {
          this.onStayPeriodChange(newIndex);
        });
      }

    }
  }

  /**
   * Load rooms by IDs from selectedRoomIds input
   */
  private loadRooms() {
    const roomIds = this.selectedRoomIds();
    if (!roomIds || roomIds.length === 0) {
      this.rooms.set([]);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.roomsService.getRoomsByIds(roomIds).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.populateRoomsFormArray(rooms);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading rooms:', err);
        this.error.set('Failed to load room details');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Populate the rooms FormArray with all loaded rooms
   */
  private populateRoomsFormArray(rooms: Room[]) {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return;

    // Clear existing rooms
    while (roomsArray.length > 0) {
      roomsArray.removeAt(0);
    }

    // Add each room as a form group
    rooms.forEach((room, index) => {
      const roomForm = this.createRoomFormGroup(room);
      roomsArray.push(roomForm);

      // Set up subscription for stay period changes
      const stayPeriodForm = roomForm.get('stayPeriod');
      if (stayPeriodForm) {
        stayPeriodForm.valueChanges.subscribe(() => {
          this.onStayPeriodChange(index);
        });
      }
    });

  }

  /**
   * Create a room form group based on the schema structure
   */
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

    // Get default dates from reservation form (check-in/out dates)
    const form = this.reservationForm();
    const defaultCheckIn =
      roomData?.stayPeriod?.from ||
      form?.get('checkInDate')?.value ||
      new Date();
    const defaultCheckOut =
      roomData?.stayPeriod?.to ||
      form?.get('checkOutDate')?.value ||
      new Date();

    // Calculate initial number of nights
    const initialNights = this.calculateNumberOfNights(defaultCheckIn, defaultCheckOut);

    // Calculate initial total price based on price per night and number of nights
    const initialTotalPrice = roomPrice * initialNights;

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
        from: [defaultCheckIn, [Validators.required]],
        to: [defaultCheckOut, [Validators.required]],
        numberOfNights: [
          roomData?.stayPeriod?.numberOfNights || initialNights,
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
        subtotal: [roomData?.pricing?.subtotal || initialTotalPrice, [Validators.min(0)]],
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
        total: [roomData?.pricing?.total || initialTotalPrice, [Validators.min(0)]],
      }),

      // Optional notes
      notes: [roomData?.notes || ''],
    });
  }

  /**
   * Assign a room to the rooms FormArray
   */
  assignRoom(room: Room) {
    this.assigningRoomId.set(room._id || null);
    const roomForm = this.createRoomFormGroup(room);
    const roomsArray = this.getRoomsFormArray();

    if (roomsArray) {
      const newIndex = roomsArray.length;
      roomsArray.push(roomForm);

      // Set up subscription for stay period changes
      const stayPeriodForm = roomForm.get('stayPeriod');
      if (stayPeriodForm) {
        stayPeriodForm.valueChanges.subscribe(() => {
          this.onStayPeriodChange(newIndex);
        });
      }


      this.roomAssigned.emit({
        room,
        formGroup: roomForm,
        index: newIndex,
      });
    }
  }

  /**
   * Remove a room from the rooms FormArray
   */
  removeRoom(index: number) {
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray) {
      roomsArray.removeAt(index);
    }
  }

  /**
   * Filter rooms by selected room type (without excluding already selected rooms)
   */
  filterRoomsByType(roomTypeId: string, currentIndex?: number): Room[] {
    console.log(roomTypeId, 'filterRoomsByType called');
    if (!roomTypeId) {
      return this.rooms();
    }

    return this.rooms().filter((room) => {
      const typeId =
        typeof room.roomType === 'string' ? room.roomType : room.roomType?._id;
      return typeId === roomTypeId;
    });
  }

  /**
   * Handle room type change and reset room selection
   */
  onRoomTypeChange(index: number, roomTypeId: string) {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return;

    // Reset the room selection to empty state when room type changes
    const currentRoom = roomsArray.at(index)?.get('room');
    currentRoom?.reset();
  }

  /**
   * Get the rooms FormArray from the parent form
   */
  getRoomsFormArray() {
    const form = this.reservationForm();
    if (form) {
      return form.controls['rooms'] as FormArray;
    }
    return null;
  }

  onAddOrChangeGuest(index: number) {
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
        // Store guest object by ID for later retrieval
        const guests = this.assignedGuests();
        guests.set(guest._id, guest);
        this.assignedGuests.set(guests);

        const roomsArray = this.getRoomsFormArray();
        if (roomsArray) {
          roomsArray.at(index).patchValue({
            assignedGuest: guest._id, // Store the ID
            assignedGuestName: this.getGuestDisplayName(guest), // Store the name for display
          });
        }
      }
    });
  }

  /**
   * Get guest display name from guest object
   */
  getGuestDisplayName(guest: any): string {
    if (guest.firstName && guest.lastName) {
      return `${guest.firstName} ${guest.lastName}`;
    } else if (guest.firstName) {
      return guest.firstName;
    } else if (guest.companyName) {
      return guest.companyName;
    }
    return 'Unknown Guest';
  }

  /**
   * Get guest name by ID
   */
  getGuestNameById(guestId: string): string {
    if (!guestId) return '';
    const guest = this.assignedGuests().get(guestId);
    if (guest) {
      return this.getGuestDisplayName(guest);
    }
    return guestId; // Fallback to ID if guest not found
  }

  /**
   * Open price edit dialog
   */
  onEditPrice(index: number) {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return;

    const roomControl = roomsArray.at(index);
    const pricingForm = roomControl?.get('pricing') as FormGroup;
    const stayPeriodForm = roomControl?.get('stayPeriod') as FormGroup;

    if (!pricingForm || !stayPeriodForm) return;

    const dialogRef = this.dialog.open(PriceEditDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        roomIndex: index,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        // The form has already been updated directly
        this.snackBar.open(
          'Price updated successfully',
          'Close',
          {
            duration: 2000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          }
        );
      }
    });
  }

  /**
   * Check if a room is already selected in another row
   */
  isRoomAlreadySelected(roomId: string, currentIndex: number): boolean {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return false;

    return roomsArray.controls.some((control, index) => {
      // Skip checking against the current row
      if (index === currentIndex) return false;
      return control.get('room')?.value === roomId;
    });
  }

  /**
   * Check if a room is available for selection (not selected in any other row)
   */
  isRoomAvailable(roomId: string, currentIndex: number): boolean {
    return !this.isRoomAlreadySelected(roomId, currentIndex);
  }

  /**
   * Get all selected room IDs except the current row
   */
  getSelectedRoomIds(excludeIndex: number): string[] {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return [];

    return roomsArray.controls
      .map((control, index) => {
        if (index === excludeIndex) return null;
        return control.get('room')?.value;
      })
      .filter((roomId): roomId is string => roomId !== null && roomId !== '');
  }

  /**
   * Handle room selection change with duplicate validation
   */
  onRoomChange(index: number, roomId: string) {
    if (this.isRoomAlreadySelected(roomId, index)) {
      // Reset the room selection
      const roomControl = this.getRoomsFormArray()?.at(index)?.get('room');
      roomControl?.reset();

      // Show error message using snackbar
      this.snackBar.open(
        'This room is already selected in another row',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        }
      );

      return;
    }

    // Update room details when room is selected
    const selectedRoom = this.rooms().find((r) => r._id === roomId);
    if (selectedRoom) {
      const roomsArray = this.getRoomsFormArray();
      if (roomsArray) {
        const roomControl = roomsArray.at(index);
        
        // Determine room price from priceOverride or room type base price
        let roomPrice = 0;
        if (selectedRoom.priceOverride) {
          roomPrice = selectedRoom.priceOverride;
        } else if (typeof selectedRoom.roomType === 'object' && selectedRoom.roomType?.basePrice) {
          roomPrice = selectedRoom.roomType.basePrice;
        }

        // Get the number of nights from stay period
        const stayPeriodForm = roomControl?.get('stayPeriod');
        const numberOfNights = stayPeriodForm?.get('numberOfNights')?.value || 1;
        
        // Calculate total price based on room price and number of nights
        const totalPrice = roomPrice * numberOfNights;

        // Update room details and pricing
        roomControl?.patchValue({
          roomNumber: selectedRoom.roomNumber || '',
          pricing: {
            pricePerNight: roomPrice,
            totalPrice: totalPrice,
            discount: 0,
            subtotal: totalPrice,
            taxes: 0,
            discountType: 'amount',
            fees: {
              serviceFee: 0,
              cleaningFee: 0,
              resortFee: 0,
              other: 0,
            },
            total: totalPrice,
          },
        });
      }
    }
  }

  /**
   * Track by form array index
   */
  trackByFormArrayIndex(index: number): number {
    return index;
  }

  /**
   * Get room type badge color
   */
  getRoomTypeBadgeColor(roomType: string | RoomType | undefined): string {
    const typeStr =
      typeof roomType === 'string'
        ? roomType
        : (roomType as any)?.name || 'standard';
    const colors: { [key: string]: string } = {
      deluxe: 'bg-blue-100 text-blue-700',
      suite: 'bg-purple-100 text-purple-700',
      standard: 'bg-gray-100 text-gray-700',
      luxury: 'bg-yellow-100 text-yellow-700',
      penthouse: 'bg-red-100 text-red-700',
    };
    return colors[typeStr.toLowerCase()] || 'bg-gray-100 text-gray-700';
  }

  /**
   * Get room status badge color
   */
  getRoomStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      available: 'text-green-600',
      occupied: 'text-red-600',
      maintenance: 'text-yellow-600',
      reserved: 'text-blue-600',
    };
    return colors[status.toLowerCase()] || 'text-gray-600';
  }

  /**
   * Track by room ID
   */
  trackByRoomId(index: number, room: Room): string {
    return room._id || index.toString();
  }

  /**
   * Get room type name by ID
   */
  getRoomTypeNameById(roomTypeId: string): string {
    const type = this.roomTypes().find(
      (t) => t._id === roomTypeId || t.id === roomTypeId
    );
    return type ? type.name : 'Unknown';
  }

  /**
   * Get minimum date for room stay period (reservation check-in date)
   */
  getMinDate(): Date | null {
    const form = this.reservationForm();
    return form?.get('checkInDate')?.value || null;
  }

  /**
   * Get maximum date for room stay period (reservation check-out date)
   */
  getMaxDate(): Date | null {
    const form = this.reservationForm();
    return form?.get('checkOutDate')?.value || null;
  }

  /**
   * Calculate number of nights between two dates
   */
  calculateNumberOfNights(checkInDate: Date, checkOutDate: Date): number {
    if (!checkInDate || !checkOutDate) return 0;
    
    const from = new Date(checkInDate);
    const to = new Date(checkOutDate);
    
    // Reset time portion to get accurate day count
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.ceil((to.getTime() - from.getTime()) / millisecondsPerDay);
    
    return Math.max(1, nights); // Minimum 1 night
  }

  /**
   * Handle stay period change and validate availability
   */
  onStayPeriodChange(index: number) {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return;

    const roomControl = roomsArray.at(index);
    const stayPeriodForm = roomControl?.get('stayPeriod');
    const roomId = roomControl?.get('room')?.value;
    
    if (!stayPeriodForm || !roomId) return;

    const checkInDate = stayPeriodForm.get('from')?.value;
    const checkOutDate = stayPeriodForm.get('to')?.value;

    if (!checkInDate || !checkOutDate) return;

    // Calculate and update numberOfNights
    const nights = this.calculateNumberOfNights(checkInDate, checkOutDate);
    
    // Get the pricing form and calculate total price
    const pricingForm = roomControl?.get('pricing');
    const pricePerNight = pricingForm?.get('pricePerNight')?.value || 0;
    const totalPrice = pricePerNight * nights;
    
    stayPeriodForm.patchValue({
      numberOfNights: nights,
    }, { emitEvent: false }); // Prevent infinite loop
    
    pricingForm?.patchValue({
      totalPrice: totalPrice,
      subtotal: totalPrice,
      total: totalPrice,
    }, { emitEvent: true }); // Emit event so breakdown listens

    // Get the room data
    const room = this.rooms().find(r => r._id === roomId);
    if (!room) return;

    // Get reservation form dates
    const reservationForm = this.reservationForm();
    const reservationCheckIn = reservationForm?.get('checkInDate')?.value;
    const reservationCheckOut = reservationForm?.get('checkOutDate')?.value;

    if (!reservationCheckIn || !reservationCheckOut) return;

    // Check if room stay period is within reservation period
    const roomFrom = new Date(checkInDate);
    const roomTo = new Date(checkOutDate);
    const resFrom = new Date(reservationCheckIn);
    const resTo = new Date(reservationCheckOut);

    // Validate room stay period is within reservation period
    if (roomFrom < resFrom || roomTo > resTo) {
      this.snackBar.open(
        'Room stay period must be within the reservation dates',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar'],
        }
      );
      // Reset to reservation dates
      stayPeriodForm.patchValue({
        from: reservationCheckIn,
        to: reservationCheckOut,
      });
      return;
    }

    // Check room availability for the selected period
    this.checkRoomAvailability(roomId, checkInDate, checkOutDate).then(
      (isAvailable) => {
        if (!isAvailable) {
          this.snackBar.open(
            'Room is not available for the selected dates',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            }
          );
          // Reset stay period to reservation dates
          stayPeriodForm.patchValue({
            from: reservationCheckIn,
            to: reservationCheckOut,
          });
          return;
        }

        // Room is available - now update reservation dates based on all rooms
        this.updateReservationDatesFromRooms();
      }
    );
  }

  /**
   * Update reservation dates based on the earliest check-in and latest check-out from all rooms
   */
  private updateReservationDatesFromRooms() {
    // const roomsArray = this.getRoomsFormArray();
    // if (!roomsArray || roomsArray.length === 0) return;

    // let earliestCheckIn: Date | null = null;
    // let latestCheckOut: Date | null = null;

    // // Find the earliest check-in and latest check-out dates from all rooms
    // roomsArray.controls.forEach((control) => {
    //   const stayPeriodForm = control.get('stayPeriod');
    //   if (stayPeriodForm) {
    //     const fromDate = stayPeriodForm.get('from')?.value;
    //     const toDate = stayPeriodForm.get('to')?.value;

    //     if (fromDate) {
    //       const from = new Date(fromDate);
    //       if (!earliestCheckIn || from < earliestCheckIn) {
    //         earliestCheckIn = from;
    //       }
    //     }

    //     if (toDate) {
    //       const to = new Date(toDate);
    //       if (!latestCheckOut || to > latestCheckOut) {
    //         latestCheckOut = to;
    //       }
    //     }
    //   }
    // });

    // // Update reservation dates if we found any valid dates
    // const reservationForm = this.reservationForm();
    // if (reservationForm && earliestCheckIn && latestCheckOut) {
    //   reservationForm.patchValue({
    //     checkInDate: earliestCheckIn,
    //     checkOutDate: latestCheckOut,
    //   });

    //   this.snackBar.open(
    //     'Reservation dates updated based on room selections',
    //     'Close',
    //     {
    //       duration: 3000,
    //       horizontalPosition: 'end',
    //       verticalPosition: 'top',
    //       panelClass: ['success-snackbar'],
    //     }
    //   );
    // }
  }

  /**
   * Check if a room is available for the given date range
   */
  private checkRoomAvailability(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const storeId = this.storeStore.selectedStore()?._id;
      if (!storeId) {
        resolve(false);
        return;
      }

      // Format dates as ISO strings for the API
      const checkIn = new Date(checkInDate).toISOString().split('T')[0];
      const checkOut = new Date(checkOutDate).toISOString().split('T')[0];

      // Call the RoomsService to get available rooms for this date range
      this.roomsService
        .getAvailableRooms({
          storeId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
        })
        .subscribe({
          next: (availableRooms) => {
            // Check if the selected room is in the available rooms list
            const isAvailable = availableRooms.some(
              (room) => room._id === roomId
            );
            resolve(isAvailable);
          },
          error: () => {
            // On error, resolve as unavailable for safety
            resolve(false);
          },
        });
    });
  }

  /**
   * Calculate total breakdown for all rooms
   */
  calculateTotalBreakdown(type: 'subtotal' | 'fees' | 'taxes' | 'discount' | 'total' | 'serviceFee' | 'cleaningFee' | 'resortFee' | 'otherFees'): number {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const pricingForm = control.get('pricing') as FormGroup;
      if (!pricingForm) return sum;

      switch (type) {
        case 'subtotal':
          return sum + (pricingForm.get('totalPrice')?.value || 0);
        case 'serviceFee':
          const feesGroup = pricingForm.get('fees') as FormGroup;
          if (feesGroup) {
            return sum + (feesGroup.get('serviceFee')?.value || 0);
          }
          return sum;
        case 'cleaningFee':
          const cleanFees = pricingForm.get('fees') as FormGroup;
          if (cleanFees) {
            return sum + (cleanFees.get('cleaningFee')?.value || 0);
          }
          return sum;
        case 'resortFee':
          const resortFees = pricingForm.get('fees') as FormGroup;
          if (resortFees) {
            return sum + (resortFees.get('resortFee')?.value || 0);
          }
          return sum;
        case 'otherFees':
          const otherFeeGroup = pricingForm.get('fees') as FormGroup;
          if (otherFeeGroup) {
            return sum + (otherFeeGroup.get('other')?.value || 0);
          }
          return sum;
        case 'fees':
          const allFees = pricingForm.get('fees') as FormGroup;
          if (allFees) {
            return sum + 
              ((allFees.get('serviceFee')?.value || 0) +
               (allFees.get('cleaningFee')?.value || 0) +
               (allFees.get('resortFee')?.value || 0) +
               (allFees.get('other')?.value || 0));
          }
          return sum;
        case 'taxes':
          return sum + (pricingForm.get('taxes')?.value || 0);
        case 'discount':
          return sum + (pricingForm.get('discount')?.value || 0);
        case 'total':
          const subtotal = pricingForm.get('totalPrice')?.value || 0;
          const feesTotal = (() => {
            const fees = pricingForm.get('fees') as FormGroup;
            if (fees) {
              return (fees.get('serviceFee')?.value || 0) +
                     (fees.get('cleaningFee')?.value || 0) +
                     (fees.get('resortFee')?.value || 0) +
                     (fees.get('other')?.value || 0);
            }
            return 0;
          })();
          const taxes = pricingForm.get('taxes')?.value || 0;
          const discount = pricingForm.get('discount')?.value || 0;
          return sum + (subtotal + feesTotal + taxes - discount);
        default:
          return sum;
      }
    }, 0);
  }
}
