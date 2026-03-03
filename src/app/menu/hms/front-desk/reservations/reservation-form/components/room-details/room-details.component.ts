import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
  ResourceRef,
  effect,
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { RoomsService } from '../../../../../../../shared/services/rooms.service';
import { RateInventoryService, StayRates, NightRate, RateInventoryRecord, RatePlan } from '../../../../../../../shared/services/rate-inventory.service';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { Room, RoomType } from '../../../../../../../shared/models/room.model';

export interface RoomRateInfo {
  originalPrice: number;       // Base price from room/roomType
  inventoryRate: number;       // Average rate from inventory API
  totalRate: number;           // Total from inventory
  hasRatePlan: boolean;        // Whether a rate plan affected the price
  hasVaryingRates: boolean;    // Whether nightly rates differ
  nights: NightRate[];         // Per-night breakdown
  numberOfNights: number;
}
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { GuestFormModalComponent } from '../../../../../../../shared/components/guest-form-modal/guest-form-modal.component';
import { PriceEditDialogComponent } from '../price-edit-dialog/price-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { BreakDownTotal } from '../break-down-total/break-down-total';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, forkJoin, map, of, catchError } from 'rxjs';
import { Reservation } from '../../../../../../../shared/models/reservation.model';
import { GuestService } from '../../../../../../../shared/services/guest.service';

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
    BreakDownTotal,
  ],
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.scss',
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }],
})
export class RoomDetailsComponent {
  private roomsService = inject(RoomsService);
  private rateInventoryService = inject(RateInventoryService);
  private guestService = inject(GuestService);
  public storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Map of roomTypeId -> StayRates for inventory-based pricing
  private inventoryRatesMap = signal<Record<string, StayRates>>({});

  // Inputs
  private reservationFormService = inject(ReservationFormService);
  public reservationForm = toSignal<FormGroup | null>(
    this.reservationFormService.form$,
    { initialValue: null }
  );
  public selectedRoomIds = input<string[]>([]);
  public ratePlanId = input<string>('');
  public reservation = input<Reservation | null>(null);
  roomAssigned = output<any>();
  roomChangeRequested = output<number>();
  hasRestrictions = output<boolean>();
  assigningRoomId = signal<string | null>(null);
  filteredRooms = signal<Room[]>([]);
  assignedGuests = signal<Map<string, any>>(new Map()); // Store guest objects by ID

  // Per-room rate plan details (index -> rate info)
  roomRateDetails = signal<Record<number, RoomRateInfo>>({});
  loadingRoomRates = signal<Record<number, boolean>>({});

  // Per-room restriction issues (index -> issues array)
  roomRestrictionIssues = signal<Record<number, Array<{ date: string; type: string; detail: string }>>>({});
  loadingRoomRestrictions = signal<Record<number, boolean>>({});

  // Per-room rate plans (index -> RatePlan[])
  roomRatePlans = signal<Record<number, RatePlan[]>>({});
  loadingRoomRatePlans = signal<Record<number, boolean>>({});

  // Guard flag to prevent feedback loop when auto-adjusting reservation dates from room changes
  private isAdjustingReservationDates = false;

  // Computed signal to check if we're in edit mode
  public isEditMode = computed(() => !!this.reservation());

  /**
   * Load all room types
   */
  public roomTypes = rxResource({
    params: () => ({ id: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => this.roomsService.getRoomTypes(params.id!),
  });

  public selectedRooms = rxResource({
    params: () => ({ roomIds: this.selectedRoomIds() }),
    stream: ({ params }) => {
      return this.roomsService.getRoomsByIds(params.roomIds!).pipe(
        switchMap((rooms) => {
          // For new reservations, fetch inventory rates for all unique room types
          const reservation = this.reservation();
          if (reservation) {
            // Edit mode: use existing pricing, no need to fetch rates
            this.populateRoomsFormArray2(rooms);
            return of(rooms);
          }

          const storeId = this.storeStore.selectedStore()?._id;
          const form = this.reservationForm();
          const checkIn = form?.get('checkInDate')?.value;
          const checkOut = form?.get('checkOutDate')?.value;

          if (!storeId || !checkIn || !checkOut) {
            this.populateRoomsFormArray2(rooms);
            return of(rooms);
          }

          // Get unique room type IDs
          const roomTypeIds = new Set<string>();
          rooms.forEach((room: any) => {
            const rtId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
            if (rtId) roomTypeIds.add(rtId);
          });

          if (roomTypeIds.size === 0) {
            this.populateRoomsFormArray2(rooms);
            return of(rooms);
          }

          const checkInStr = this.formatLocalDate(new Date(checkIn));
          const checkOutStr = this.formatLocalDate(new Date(checkOut));

          // Fetch rates for each unique room type
          const rateRequests: Record<string, ReturnType<RateInventoryService['getRatesForStay']>> = {};
          const ratePlan = this.ratePlanId() || undefined;
          roomTypeIds.forEach((rtId) => {
            rateRequests[rtId] = this.rateInventoryService.getRatesForStay(storeId, rtId, checkInStr, checkOutStr, ratePlan);
          });

          return forkJoin(rateRequests).pipe(
            map((ratesMap) => {
              this.inventoryRatesMap.set(ratesMap);
              this.populateRoomsFormArray2(rooms);
              return rooms;
            }),
            catchError(() => {
              this.populateRoomsFormArray2(rooms);
              return of(rooms);
            })
          );
        })
      );
    },
  });

  public rooms = rxResource({
    params: () => ({ store: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      return this.roomsService.getRooms(params.store!);
    },
  });

  // Track whether the rate-fetch effect has already run for the current rooms


  // Effect to reload room data when reservation changes
  constructor() {
    effect(() => {
      // Trigger when reservation input changes
      if (this.reservation()) {
        // Reload all room-related resources
        this.rooms.reload();
        this.roomTypes.reload();
        this.selectedRooms.reload();
      }
    });

    // Listen for reservation-level date changes and re-fetch inventory rates for ALL rooms
    const form = this.reservationForm();
    if (form) {
      form.get('checkInDate')?.valueChanges.subscribe((newCheckIn) => {
        this.onReservationDatesChanged(newCheckIn, form.get('checkOutDate')?.value);
      });
      form.get('checkOutDate')?.valueChanges.subscribe((newCheckOut) => {
        this.onReservationDatesChanged(form.get('checkInDate')?.value, newCheckOut);
      });
    }
  }

  /**
   * Fetch inventory restriction records for a specific room row.
   * Validates stop-sell, CTA, CTD, min/max stay — same logic as quick-reservation modal.
   */
  fetchRoomRestrictions(
    index: number,
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
  ): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const checkInStr = this.formatLocalDate(new Date(checkIn));
    const checkOutStr = this.formatLocalDate(new Date(checkOut));
    // Extend end date by 1 day to include checkout date for CTD checking
    const extendedEnd = new Date(checkOut);
    extendedEnd.setDate(extendedEnd.getDate() + 1);
    const extendedEndStr = this.formatLocalDate(extendedEnd);

    const nights = this.calculateNumberOfNights(checkIn, checkOut);
    if (nights <= 0) {
      this.roomRestrictionIssues.update((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
      this.hasRestrictions.emit(false);
      return;
    }

    // Use per-room ratePlanId from the form, fall back to global input
    const roomsArray = this.getRoomsFormArray();
    const ratePlan = roomsArray?.at(index)?.get('ratePlanId')?.value || this.ratePlanId() || undefined;
    this.loadingRoomRestrictions.update((prev) => ({ ...prev, [index]: true }));

    this.rateInventoryService
      .getInventory(storeId, roomTypeId, checkInStr, extendedEndStr, ratePlan)
      .pipe(catchError(() => of([])))
      .subscribe((records: RateInventoryRecord[]) => {
        const issues: Array<{ date: string; type: string; detail: string }> = [];

        for (const record of records) {
          const dateStr = typeof record.date === 'string' ? record.date.split('T')[0] : '';
          const r = record.restrictions;
          if (!r) continue;

          if (r.stopSell && dateStr !== checkOutStr) {
            issues.push({ date: dateStr, type: 'stop-sell', detail: 'Stop Sell — date closed for bookings' });
          }
          if (r.closedToArrival && dateStr === checkInStr) {
            issues.push({ date: dateStr, type: 'cta', detail: 'Closed to Arrival — cannot check in on this date' });
          }
          if (r.closedToDeparture && dateStr === checkOutStr) {
            issues.push({ date: dateStr, type: 'ctd', detail: 'Closed to Departure — cannot check out on this date' });
          }
          if (r.minStay && r.minStay > 1 && nights < r.minStay && !issues.find(i => i.type === 'min-stay')) {
            issues.push({ date: dateStr, type: 'min-stay', detail: `Minimum stay is ${r.minStay} nights` });
          }
          if (r.maxStay && r.maxStay < 365 && nights > r.maxStay && !issues.find(i => i.type === 'max-stay')) {
            issues.push({ date: dateStr, type: 'max-stay', detail: `Maximum stay is ${r.maxStay} nights` });
          }
        }

        this.roomRestrictionIssues.update((prev) => ({
          ...prev,
          [index]: issues,
        }));
        this.loadingRoomRestrictions.update((prev) => ({ ...prev, [index]: false }));

        // Check if ANY room has restriction issues and emit to parent
        const updatedIssues = { ...this.roomRestrictionIssues(), [index]: issues };
        const anyRestricted = Object.values(updatedIssues).some((arr) => arr && arr.length > 0);
        this.hasRestrictions.emit(anyRestricted);
      });
  }

  /**
   * When reservation-level check-in or check-out dates change,
   * update all rooms' stay periods and re-fetch inventory rates + restrictions for each.
   */
  private onReservationDatesChanged(checkIn: Date | null, checkOut: Date | null): void {
    // Skip when reservation dates are being auto-adjusted from room stay period changes
    if (this.isAdjustingReservationDates) return;
    if (!checkIn || !checkOut) return;

    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray || roomsArray.length === 0) return;

    const nights = this.calculateNumberOfNights(checkIn, checkOut);

    for (let i = 0; i < roomsArray.length; i++) {
      const roomControl = roomsArray.at(i);
      if (!roomControl) continue;

      // Update stay period dates
      roomControl.patchValue(
        {
          stayPeriod: {
            from: checkIn,
            to: checkOut,
            numberOfNights: nights,
          },
        },
        { emitEvent: false }
      );

      // Re-fetch inventory rates for this room
      const roomTypeId = roomControl.get('roomType')?.value;
      if (!roomTypeId) continue;

      // Determine base price for fallback
      const room = this.rooms.value()?.find((r) => r._id === roomControl.get('room')?.value);
      let baseRoomPrice = 0;
      if (room?.priceOverride) {
        baseRoomPrice = room.priceOverride;
      } else if (typeof room?.roomType === 'object' && room.roomType?.basePrice) {
        baseRoomPrice = room.roomType.basePrice;
      }

      this.fetchAndApplyRoomRate(i, roomTypeId, baseRoomPrice, checkIn, checkOut);
      // Also fetch restrictions for this room
      this.fetchRoomRestrictions(i, roomTypeId, checkIn, checkOut);
    }
  }

  public isRoomsReadyForAssignment = computed(() => {
    if (this.selectedRoomIds()) {
      return (
        this.selectedRooms.hasValue() &&
        this.rooms.hasValue() &&
        this.roomTypes.hasValue() 
        
      );
    } else {
      return (
        this.rooms.hasValue() &&
        this.roomTypes.hasValue() 
        
      );
    }
  });

  // Computed properties
  public totalRooms = computed(() => {
   return this.rooms.hasValue() ? this.rooms.value()!.length : 0;
  });

  public totalCapacity = computed(() => {
    return this.rooms.value()?.reduce((sum, room) => {
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
  public isEditingRooms = computed(() => {
    const roomsArray = this.getRoomsFormArray();
    return roomsArray && roomsArray.length > 0;
  });

  public price(index: number): number {
    return this.getRoomsFormArray()!.at(index)!.get('pricing')!.get('total')
      ?.value;
  }

  public onCreateRoom(): void {
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

 populateRoomsFormArray2(rooms: Room[]) {    
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) {
      return;
    }

    // Clear existing rooms FIRST
    roomsArray.clear();
    
    const reservation = this.reservation()!;
    const isEditMode = !!reservation;
    const roomsToUse = isEditMode ? reservation.rooms : rooms;
    roomsToUse.forEach((room: any, index: number) => {
        
        let roomForm;
        
        if (isEditMode) {
          // EDIT MODE: room is a ReservationRoom with nested room object
          let assignedGuestId = '';
          let assignedGuestName = '';

          if (room.assignedGuest) {
            if (typeof room.assignedGuest === 'object' && room.assignedGuest._id) {
              assignedGuestId = room.assignedGuest._id;
              assignedGuestName = this.guestService.getGuestName(room.assignedGuest);
            } else if (typeof room.assignedGuest === 'string') {
              assignedGuestId = room.assignedGuest;
            }
          }

          roomForm = this.fb.group({
            room: [{value:room.room._id || room.room, disabled: this.isEditMode()}, [Validators.required]],
            roomNumber: [room.room?.roomNumber || '', []],
            roomType: [{value: room?.roomType || room?.room?.roomType?._id, disabled: this.isEditMode()}, []],
            ratePlanId: [{value: room?.ratePlanId || this.ratePlanId() || null, disabled: this.isEditMode()}],
            assignedGuest: [assignedGuestId, [Validators.required]],
            status: [room.status || 'reserved', [Validators.required]],
            assignedGuestName: [assignedGuestName, [Validators.required]],
            stayPeriod: this.fb.group({
              from: [new Date(room.stayPeriod?.from || reservation.checkInDate), [Validators.required]],
              to: [new Date(room.stayPeriod?.to || reservation.checkOutDate), [Validators.required]],
              numberOfNights: [
                room.stayPeriod?.numberOfNights || 1,
                [Validators.required, Validators.min(1)],
              ],
            }),
            guests: this.fb.group({
              adults: [
                room.guests?.adults || 1,
                [Validators.required, Validators.min(1)],
              ],
              children: [
                room.guests?.children || 0,
                [Validators.required, Validators.min(0)],
              ],
            }),
            pricing: this.fb.group({
              pricePerNight: [
                room?.pricing?.pricePerNight || room?.room?.priceOverride || 0,
                [Validators.required, Validators.min(0)],
              ],
              totalPrice: [
                room.pricing?.totalPrice || 0,
                [Validators.required, Validators.min(0)],
              ],
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
        } else {
          // NEW MODE: room is a plain Room object, use createRoomFormGroup
          console.log('[RoomDetails] NEW mode - using createRoomFormGroup for room:', room._id);
          roomForm = this.createRoomFormGroup(room);

          // Populate rate details from inventoryRatesMap for the initial load
          const rtId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
          const ratesForType = rtId ? this.inventoryRatesMap()?.[rtId] : null;
          if (ratesForType) {
            let basePrice = 0;
            if (room.priceOverride) {
              basePrice = room.priceOverride;
            } else if (typeof room.roomType === 'object' && room.roomType?.basePrice) {
              basePrice = room.roomType.basePrice;
            }
            const hasRatePlanEffect = ratesForType.nights?.some(
              (n: NightRate) => n.source === 'rate_plan_day_of_week' ||
                     n.source === 'rate_plan_seasonal' ||
                     n.source === 'rate_plan_base'
            ) ?? false;
            const uniqueRates = new Set(ratesForType.nights?.map((n: NightRate) => n.rate) ?? []);
            this.roomRateDetails.update((prev) => ({
              ...prev,
              [index]: {
                originalPrice: basePrice,
                inventoryRate: ratesForType.averageRate,
                totalRate: ratesForType.totalRate,
                hasRatePlan: hasRatePlanEffect,
                hasVaryingRates: uniqueRates.size > 1,
                nights: ratesForType.nights || [],
                numberOfNights: ratesForType.numberOfNights,
              },
            }));
          }
        }
        
        roomsArray.push(roomForm);
        console.log(`[RoomDetails] Room ${index} added to form array. Current array length:`, roomsArray.length);

        // Fetch rate plans for this room's room type
        const rtId = isEditMode
          ? (room?.roomType || room?.room?.roomType?._id)
          : (typeof room.roomType === 'object' ? room.roomType?._id : room.roomType);
        if (rtId) {
          this.fetchRatePlansForRoom(index, rtId);
        }
    });

    // Update the parent reservation form with the populated rooms array
    console.log('[RoomDetails] populateRoomsFormArray2 completed. Final array length:', roomsArray.length);
    this.reservationForm()?.patchValue({ rooms: roomsArray }, { emitEvent: false });

    // Auto-fetch rate breakdown for all rooms (both new & edit mode)
    // For new mode, roomRateDetails is already populated from inventoryRatesMap above for rooms that had rates.
    // For edit mode (or rooms missing rates in new mode), fetch on-demand.
    setTimeout(() => {
      for (let i = 0; i < roomsArray.length; i++) {
        if (!this.roomRateDetails()[i]) {
          this.viewRateInfo(i);
        }
      }
    }, 0);

}

  /**
   * Create a room form group based on the schema structure
   */
  createRoomFormGroup(room: Room, roomData?: any) {
    // Determine the room price:
    // Priority: 1) existing reservation data, 2) inventory rate, 3) room priceOverride, 4) roomType basePrice
    const roomTypeId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
    const inventoryRates = roomTypeId ? this.inventoryRatesMap()?.[roomTypeId] : null;

    let roomPrice = roomData?.pricing?.pricePerNight;
    let initialTotalPrice = 0;

    if (!roomPrice && inventoryRates?.averageRate) {
      // Use inventory average rate as pricePerNight, total from inventory
      roomPrice = inventoryRates.averageRate;
      initialTotalPrice = inventoryRates.totalRate;
    } else if (!roomPrice) {
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
    const initialNights = this.calculateNumberOfNights(
      defaultCheckIn,
      defaultCheckOut
    );

    // Calculate initial total price: use inventory total if available, otherwise price × nights
    if (!initialTotalPrice) {
      initialTotalPrice = roomPrice * initialNights;
    }
    return this.fb.group({
      room: [roomData?.room || room._id || '', [Validators.required]], // Room ID
      roomNumber: [roomData?.roomNumber || room.roomNumber || ''], // Store room number for display
      assignedGuest: [roomData?.assignedGuest || '', Validators.required], // Guest ID (required for group)
      assignedGuestName: [roomData?.assignedGuestName || '', Validators.required], // Guest display name (for display only)
      roomType: [
        roomData?.roomType ||
          (typeof room.roomType === 'string'
            ? room.roomType
            : room.roomType?._id) ||
          '',
        [Validators.required],
      ], // Room Type ID
      ratePlanId: [roomData?.ratePlanId || this.ratePlanId() || null], // Per-room rate plan

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

      // Re-index room rate details, restriction issues, and rate plans after removal
      this.reindexRoomSignalsAfterRemoval(index);

      // Auto-adjust reservation dates since the removed room may have been
      // the only one covering a boundary date
      if (roomsArray.length > 0) {
        this.updateReservationDatesFromRooms();
      }
    }
  }

  /**
   * Re-index per-room signal maps after a room is removed.
   * Shifts entries above the removed index down by one.
   */
  private reindexRoomSignalsAfterRemoval(removedIndex: number): void {
    const reindex = <T>(map: Record<number, T>): Record<number, T> => {
      const result: Record<number, T> = {};
      for (const [key, value] of Object.entries(map)) {
        const idx = Number(key);
        if (idx < removedIndex) {
          result[idx] = value;
        } else if (idx > removedIndex) {
          result[idx - 1] = value;
        }
        // idx === removedIndex is skipped (removed)
      }
      return result;
    };

    this.roomRateDetails.update(reindex);
    this.loadingRoomRates.update(reindex);
    this.roomRestrictionIssues.update(reindex);
    this.loadingRoomRestrictions.update(reindex);
    this.roomRatePlans.update(reindex);
    this.loadingRoomRatePlans.update(reindex);
  }

  /**
   * Emit room change request with room index
   */
  onChangeRoom(index: number) {
    this.roomChangeRequested.emit(index);
  }

  /**
   * Filter rooms by selected room type (without excluding already selected rooms)
   */
  filterRoomsByType(roomTypeId: string, currentIndex?: number): Room[] {
    console.log(this.rooms.value())
    if (!roomTypeId) {
      return this.rooms.value() || [];
    }

    return this.rooms.value()!.filter((room) => {
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

    // Reset rate plan for this room
    roomsArray.at(index)?.get('ratePlanId')?.setValue(null);

    // Clear rate details for this room index
    const details = { ...this.roomRateDetails() };
    delete details[index];
    this.roomRateDetails.set(details);

    // Clear restriction issues for this room
    this.roomRestrictionIssues.update((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });

    // Fetch rate plans for the new room type
    if (roomTypeId) {
      this.fetchRatePlansForRoom(index, roomTypeId);
    } else {
      this.roomRatePlans.update((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  }

  /**
   * Fetch available rate plans for a room type and store them per-room index.
   */
  fetchRatePlansForRoom(index: number, roomTypeId: string): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !roomTypeId) return;

    this.loadingRoomRatePlans.update((prev) => ({ ...prev, [index]: true }));

    this.rateInventoryService
      .getRatePlansByRoomType(storeId, roomTypeId)
      .pipe(catchError(() => of([])))
      .subscribe((plans: RatePlan[]) => {
        this.roomRatePlans.update((prev) => ({ ...prev, [index]: plans }));
        this.loadingRoomRatePlans.update((prev) => ({ ...prev, [index]: false }));
      });
  }

  /**
   * Handle rate plan change for a specific room row.
   * Re-fetches inventory rates and restrictions using the new rate plan.
   */
  onRatePlanChange(index: number, ratePlanId: string): void {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return;

    const roomControl = roomsArray.at(index);
    if (!roomControl) return;

    const roomTypeId = roomControl.get('roomType')?.value;
    if (!roomTypeId) return;

    const form = this.reservationForm();
    const checkIn = roomControl.get('stayPeriod')?.get('from')?.value || form?.get('checkInDate')?.value;
    const checkOut = roomControl.get('stayPeriod')?.get('to')?.value || form?.get('checkOutDate')?.value;
    if (!checkIn || !checkOut) return;

    // Determine base price for fallback
    const room = this.rooms.value()?.find((r) => r._id === roomControl.get('room')?.value);
    let baseRoomPrice = 0;
    if (room?.priceOverride) {
      baseRoomPrice = room.priceOverride;
    } else if (typeof room?.roomType === 'object' && room.roomType?.basePrice) {
      baseRoomPrice = room.roomType.basePrice;
    }

    // Re-fetch rates and restrictions with the new rate plan
    this.fetchAndApplyRoomRate(index, roomTypeId, baseRoomPrice, new Date(checkIn), new Date(checkOut));
    this.fetchRoomRestrictions(index, roomTypeId, new Date(checkIn), new Date(checkOut));
  }

  /**
   * Get the rooms FormArray from the parent form
   */
  getRoomsFormArray() {
    const form = this.reservationForm();
    if (form) {
      const roomsArray = form.controls['rooms'] as FormArray;
      console.log('[RoomDetails] getRoomsFormArray called, array length:', roomsArray?.length);
      return roomsArray;
    }
    console.warn('[RoomDetails] getRoomsFormArray: form is null');
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
        this.snackBar.open('Price updated successfully', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });
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
    const selectedRoom = this.rooms.value()!.find((r) => r._id === roomId);
    if (selectedRoom) {
      const roomsArray = this.getRoomsFormArray();
      if (roomsArray) {
        const roomControl = roomsArray.at(index);

        // Determine base room price from priceOverride or room type base price
        let baseRoomPrice = 0;
        if (selectedRoom.priceOverride) {
          baseRoomPrice = selectedRoom.priceOverride;
        } else if (
          typeof selectedRoom.roomType === 'object' &&
          selectedRoom.roomType?.basePrice
        ) {
          baseRoomPrice = selectedRoom.roomType.basePrice;
        }

        // Update room number immediately
        roomControl?.patchValue({ roomNumber: selectedRoom.roomNumber || '' });

        // Get the room type ID for inventory lookup
        const roomTypeId = typeof selectedRoom.roomType === 'object'
          ? selectedRoom.roomType?._id
          : selectedRoom.roomType;

        // Set base price first, then fetch inventory rates
        const stayPeriodForm = roomControl?.get('stayPeriod');
        const numberOfNights = stayPeriodForm?.get('numberOfNights')?.value || 1;
        const baseTotalPrice = baseRoomPrice * numberOfNights;

        // Set base price as fallback immediately
        roomControl?.patchValue({
          pricing: {
            pricePerNight: baseRoomPrice,
            totalPrice: baseTotalPrice,
            discount: 0,
            subtotal: baseTotalPrice,
            taxes: 0,
            discountType: 'amount',
            fees: { serviceFee: 0, cleaningFee: 0, resortFee: 0, other: 0 },
            total: baseTotalPrice,
          },
        });

        // Fetch inventory rates and update if available
        if (roomTypeId) {
          this.fetchAndApplyRoomRate(index, roomTypeId, baseRoomPrice);
        }
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
    const type = this.roomTypes
      .value()!
      .find((t) => t._id === roomTypeId || t.id === roomTypeId);
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
    const nights = Math.ceil(
      (to.getTime() - from.getTime()) / millisecondsPerDay
    );

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

    stayPeriodForm.patchValue(
      { numberOfNights: nights },
      { emitEvent: false }
    );

    // Get the room data
    const room = this.rooms.value()!.find((r) => r._id === roomId);
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

        // Room is available - fetch inventory rates and update pricing
        const roomTypeId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
        let baseRoomPrice = 0;
        if (room.priceOverride) {
          baseRoomPrice = room.priceOverride;
        } else if (typeof room.roomType === 'object' && room.roomType?.basePrice) {
          baseRoomPrice = room.roomType.basePrice;
        }

        if (roomTypeId) {
          this.fetchAndApplyRoomRate(index, roomTypeId, baseRoomPrice, checkInDate, checkOutDate);
          // Validate inventory restrictions for this room with its new dates
          this.fetchRoomRestrictions(index, roomTypeId, checkInDate, checkOutDate);
        } else {
          // No room type — just update with base price
          const pricingForm = roomControl?.get('pricing');
          const totalPrice = baseRoomPrice * nights;
          pricingForm?.patchValue({
            pricePerNight: baseRoomPrice,
            totalPrice, subtotal: totalPrice, total: totalPrice,
          }, { emitEvent: true });
        }

        // Auto-adjust reservation dates to cover all rooms (no empty/gap dates)
        this.updateReservationDatesFromRooms();
      }
    );
  }

  /**
   * Fetch inventory rates for a specific room row and apply pricing.
   * Also stores rate plan details for display in the template.
   */
  fetchAndApplyRoomRate(
    index: number,
    roomTypeId: string,
    baseRoomPrice: number,
    overrideCheckIn?: Date,
    overrideCheckOut?: Date,
  ): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const form = this.reservationForm();
    const checkIn = overrideCheckIn || form?.get('checkInDate')?.value;
    const checkOut = overrideCheckOut || form?.get('checkOutDate')?.value;

    if (!storeId || !checkIn || !checkOut) return;

    const checkInStr = this.formatLocalDate(new Date(checkIn));
    const checkOutStr = this.formatLocalDate(new Date(checkOut));
    // Use per-room ratePlanId from the form, fall back to global input
    const roomsArray = this.getRoomsFormArray();
    const ratePlan = roomsArray?.at(index)?.get('ratePlanId')?.value || this.ratePlanId() || undefined;

    // Set loading state
    this.loadingRoomRates.update((prev) => ({ ...prev, [index]: true }));

    this.rateInventoryService
      .getRatesForStay(storeId, roomTypeId, checkInStr, checkOutStr, ratePlan)
      .subscribe({
        next: (rates: StayRates) => {
          const roomsArray = this.getRoomsFormArray();
          if (!roomsArray) return;

          const roomControl = roomsArray.at(index);
          if (!roomControl) return;

          // Determine if a rate plan affected the price
          const hasRatePlanEffect = rates.nights?.some(
            (n) => n.source === 'rate_plan_day_of_week' ||
                   n.source === 'rate_plan_seasonal' ||
                   n.source === 'rate_plan_base'
          ) ?? false;

          // Check if rates vary by night
          const uniqueRates = new Set(rates.nights?.map((n) => n.rate) ?? []);
          const hasVaryingRates = uniqueRates.size > 1;

          // Store rate details for this room
          this.roomRateDetails.update((prev) => ({
            ...prev,
            [index]: {
              originalPrice: baseRoomPrice,
              inventoryRate: rates.averageRate,
              totalRate: rates.totalRate,
              hasRatePlan: hasRatePlanEffect,
              hasVaryingRates,
              nights: rates.nights || [],
              numberOfNights: rates.numberOfNights,
            },
          }));

          // Update form pricing
          roomControl.patchValue({
            pricing: {
              pricePerNight: rates.averageRate,
              totalPrice: rates.totalRate,
              subtotal: rates.totalRate,
              total: rates.totalRate,
            },
          });

          this.loadingRoomRates.update((prev) => ({ ...prev, [index]: false }));
        },
        error: () => {
          // On error, fall back to base price
          const roomsArray = this.getRoomsFormArray();
          const roomControl = roomsArray?.at(index);
          const nights = roomControl?.get('stayPeriod')?.get('numberOfNights')?.value || 1;
          const totalPrice = baseRoomPrice * nights;

          roomControl?.patchValue({
            pricing: {
              pricePerNight: baseRoomPrice,
              totalPrice,
              subtotal: totalPrice,
              total: totalPrice,
            },
          });

          // Clear rate details on error
          this.roomRateDetails.update((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });

          this.loadingRoomRates.update((prev) => ({ ...prev, [index]: false }));
        },
      });
  }

  /**
   * On-demand fetch of rate plan info for a room row (display only, no price changes).
   * Called when user clicks "View rate info" link in edit mode.
   */
  viewRateInfo(index: number): void {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return;

    const roomControl = roomsArray.at(index);
    if (!roomControl) return;

    const storeId = this.storeStore.selectedStore()?._id;
    const roomTypeId = roomControl.get('roomType')?.value;
    if (!storeId || !roomTypeId) return;

    const stayFrom = roomControl.get('stayPeriod')?.get('from')?.value;
    const stayTo = roomControl.get('stayPeriod')?.get('to')?.value;
    const form = this.reservationForm();
    const checkIn = stayFrom || form?.get('checkInDate')?.value;
    const checkOut = stayTo || form?.get('checkOutDate')?.value;
    if (!checkIn || !checkOut) return;

    // Determine base price from current form value
    const baseRoomPrice = roomControl.get('pricing')?.get('pricePerNight')?.value || 0;

    const checkInStr = this.formatLocalDate(new Date(checkIn));
    const checkOutStr = this.formatLocalDate(new Date(checkOut));
    // Use per-room ratePlanId from the form, fall back to global input
    const ratePlan = roomControl.get('ratePlanId')?.value || this.ratePlanId() || undefined;

    this.loadingRoomRates.update((prev) => ({ ...prev, [index]: true }));

    // Also fetch restrictions for this room on initial load
    this.fetchRoomRestrictions(index, roomTypeId, new Date(checkIn), new Date(checkOut));

    this.rateInventoryService
      .getRatesForStay(storeId, roomTypeId, checkInStr, checkOutStr, ratePlan)
      .subscribe({
        next: (rates: StayRates) => {
          const hasRatePlanEffect = rates.nights?.some(
            (n) => n.source === 'rate_plan_day_of_week' ||
                   n.source === 'rate_plan_seasonal' ||
                   n.source === 'rate_plan_base'
          ) ?? false;
          const uniqueRates = new Set(rates.nights?.map((n) => n.rate) ?? []);

          this.roomRateDetails.update((prev) => ({
            ...prev,
            [index]: {
              originalPrice: baseRoomPrice,
              inventoryRate: rates.averageRate,
              totalRate: rates.totalRate,
              hasRatePlan: hasRatePlanEffect,
              hasVaryingRates: uniqueRates.size > 1,
              nights: rates.nights || [],
              numberOfNights: rates.numberOfNights,
            },
          }));

          this.loadingRoomRates.update((prev) => ({ ...prev, [index]: false }));
        },
        error: () => {
          this.loadingRoomRates.update((prev) => ({ ...prev, [index]: false }));
        },
      });
  }

  /**
   * Hide the rate info panel for a room row.
   */
  hideRateInfo(index: number): void {
    this.roomRateDetails.update((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  }

  /**
   * Auto-adjust reservation check-in/check-out to exactly cover all rooms.
   * Computes the earliest room check-in and latest room check-out.
   * If the reservation dates are wider than needed (gaps with no room occupying),
   * shrink them. Then re-validate inventory restrictions for every room.
   */
  private updateReservationDatesFromRooms(): void {
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray || roomsArray.length === 0) return;

    let earliestCheckIn: Date | null = null;
    let latestCheckOut: Date | null = null;

    // Find the earliest check-in and latest check-out dates from all rooms
    for (let i = 0; i < roomsArray.length; i++) {
      const stayPeriodForm = roomsArray.at(i)?.get('stayPeriod');
      if (!stayPeriodForm) continue;

      const fromDate = stayPeriodForm.get('from')?.value;
      const toDate = stayPeriodForm.get('to')?.value;

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (!earliestCheckIn || from < earliestCheckIn) {
          earliestCheckIn = from;
        }
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(0, 0, 0, 0);
        if (!latestCheckOut || to > latestCheckOut) {
          latestCheckOut = to;
        }
      }
    }

    if (!earliestCheckIn || !latestCheckOut) return;

    const reservationForm = this.reservationForm();
    if (!reservationForm) return;

    const currentCheckIn = new Date(reservationForm.get('checkInDate')?.value);
    const currentCheckOut = new Date(reservationForm.get('checkOutDate')?.value);
    currentCheckIn.setHours(0, 0, 0, 0);
    currentCheckOut.setHours(0, 0, 0, 0);

    // Only adjust if the reservation dates differ from room coverage
    const needsAdjustment =
      earliestCheckIn.getTime() !== currentCheckIn.getTime() ||
      latestCheckOut.getTime() !== currentCheckOut.getTime();

    if (!needsAdjustment) return;

    // Set guard flag so onReservationDatesChanged doesn't overwrite room dates
    this.isAdjustingReservationDates = true;

    const nights = this.calculateNumberOfNights(earliestCheckIn, latestCheckOut);
    reservationForm.patchValue({
      checkInDate: earliestCheckIn,
      checkOutDate: latestCheckOut,
      numberOfNights: nights,
    });

    // Clear guard after a tick (after valueChanges listeners have fired)
    setTimeout(() => {
      this.isAdjustingReservationDates = false;
    }, 0);

    // Re-validate inventory restrictions for ALL rooms against their own stay periods
    for (let i = 0; i < roomsArray.length; i++) {
      const roomControl = roomsArray.at(i);
      if (!roomControl) continue;

      const roomTypeId = roomControl.get('roomType')?.value;
      const stayFrom = roomControl.get('stayPeriod')?.get('from')?.value;
      const stayTo = roomControl.get('stayPeriod')?.get('to')?.value;

      if (roomTypeId && stayFrom && stayTo) {
        this.fetchRoomRestrictions(i, roomTypeId, new Date(stayFrom), new Date(stayTo));
      }
    }

    // Build a readable date range string for the notification
    const fromStr = this.formatLocalDate(earliestCheckIn);
    const toStr = this.formatLocalDate(latestCheckOut);

    this.snackBar.open(
      `Reservation dates auto-adjusted to ${fromStr} → ${toStr} (${nights} night${nights !== 1 ? 's' : ''})`,
      'Close',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['info-snackbar'],
      }
    );
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

      // Format dates using local time (not UTC) to avoid timezone shifts
      const checkIn = this.formatLocalDate(new Date(checkInDate));
      const checkOut = this.formatLocalDate(new Date(checkOutDate));

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
  calculateTotalBreakdown(
    type:
      | 'subtotal'
      | 'fees'
      | 'taxes'
      | 'discount'
      | 'total'
      | 'serviceFee'
      | 'cleaningFee'
      | 'resortFee'
      | 'otherFees'
  ): number {
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
            return (
              sum +
              ((allFees.get('serviceFee')?.value || 0) +
                (allFees.get('cleaningFee')?.value || 0) +
                (allFees.get('resortFee')?.value || 0) +
                (allFees.get('other')?.value || 0))
            );
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
              return (
                (fees.get('serviceFee')?.value || 0) +
                (fees.get('cleaningFee')?.value || 0) +
                (fees.get('resortFee')?.value || 0) +
                (fees.get('other')?.value || 0)
              );
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
