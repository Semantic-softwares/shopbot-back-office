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
import {
  Guest,
  Reservation,
} from '../../../../../../../shared/models/reservation.model';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { BreakDownTotal } from '../break-down-total/break-down-total';
import { PriceEditDialogComponent } from '../price-edit-dialog/price-edit-dialog.component';
import { RoomsService } from '../../../../../../../shared/services/rooms.service';
import { RateInventoryService, StayRates, RateInventoryRecord, RatePlan } from '../../../../../../../shared/services/rate-inventory.service';
import { distinctUntilChanged, tap, of, switchMap, map, catchError } from 'rxjs';
import { Room } from '../../../../../../../shared/models/room.model';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { ActivatedRoute, Router } from '@angular/router';
import { GuestService } from '../../../../../../../shared/services/guest.service';
import { QueryParamService } from '../../../../../../../shared/services/query-param.service';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

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
    MatProgressSpinnerModule
],
  templateUrl: './room-sharers.component.html',
  styleUrl: './room-sharers.component.scss',
})
export class RoomSharersComponent {
  private fb = inject(FormBuilder);
  public storeStore = inject(StoreStore);
  public route = inject(ActivatedRoute);
  public guestService = inject(GuestService);
  private snackBar = inject(MatSnackBar);
  private id = signal(this.route.snapshot.paramMap.get('id'));
  public isEditing = computed(() => !!this.id());

  // Guard flag to prevent feedback loop when auto-adjusting reservation dates from sharer changes
  private isAdjustingReservationDates = false;

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
  reservation = input<Reservation | null>(null);

  // Outputs
  sharerAdded = output<any>();
  sharerEdited = output<any>();
  sharerDeleted = output<any>();
  sharersArrayUpdated = output<FormArray>();
  hasRestrictions = output<boolean>();

  // Signals for reservation date limits
  reservationMinDate = signal<Date | null>(null);
  reservationMaxDate = signal<Date | null>(null);
  private dialog = inject(MatDialog);

  private roomService = inject(RoomsService);
  private rateInventoryService = inject(RateInventoryService);
  private router = inject(Router);
  private queryParamService = inject(QueryParamService);

  // Current room selection signals (initialized from quickReservation or reservation)
  selectedRoomTypeId = signal<string>('');
  selectedRoomId = signal<string>('');
  selectedRatePlanId = signal<string>('');

  // Room types resource
  public roomTypesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) return of([]);
      return this.roomService.getRoomTypes(params.storeId);
    },
  });

  // All rooms resource
  public allRoomsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) return of([]);
      return this.roomService.getRooms(params.storeId);
    },
  });

  // Rooms filtered by selected room type
  filteredRooms = computed(() => {
    const rooms = this.allRoomsResource.value() || [];
    const roomTypeId = this.selectedRoomTypeId();
    if (!roomTypeId) return rooms;
    return rooms.filter((room) => {
      const rtId = typeof room.roomType === 'string' ? room.roomType : room.roomType?._id;
      return rtId === roomTypeId;
    });
  });

  // Rate plans for selected room type
  ratePlans = signal<RatePlan[]>([]);
  loadingRatePlans = signal<boolean>(false);

  // Inventory rates for the selected room's type
  private inventoryRates = signal<StayRates | null>(null);
  loadingRates = signal<boolean>(false);

  /** Whether this reservation originated from Channex (OTA) */
  isChannexBooking = computed(() => !!this.reservation()?.channex?.bookingId);

  /** Computed: rate breakdown info for display in the template */
  rateBreakdown = computed(() => {
    const rates = this.inventoryRates();
    if (!rates || !rates.nights || rates.nights.length === 0) return null;

    const hasRatePlan = rates.nights.some(
      (n: any) => n.source === 'rate_plan_day_of_week' ||
                  n.source === 'rate_plan_seasonal' ||
                  n.source === 'rate_plan_base'
    );
    const uniqueRates = new Set(rates.nights.map((n: any) => n.rate));

    return {
      nights: rates.nights,
      totalRate: rates.totalRate,
      averageRate: rates.averageRate,
      numberOfNights: rates.numberOfNights,
      hasRatePlan,
      hasVaryingRates: uniqueRates.size > 1,
    };
  });

  /** Restriction issues for the current date range */
  restrictionIssues = signal<Array<{ date: string; type: string; detail: string }> | null>(null);
  loadingRestrictions = signal<boolean>(false);

  // Initialize selection signals from quick reservation or edit mode.
  // In edit mode, ALWAYS sync from reservation so reloads (e.g. after room change)
  // propagate the updated room/type/ratePlan to downstream resources.
  private initSelectionEffect = effect(() => {
    const qr = this.quickReservation();
    const res = this.reservation();
    if (this.isEditing() && res) {
      const firstRoom = res.rooms?.[0];
      if (firstRoom) {
        const rtId = typeof firstRoom.roomType === 'object' ? (firstRoom.roomType as any)?._id : firstRoom.roomType;
        this.selectedRoomTypeId.set(rtId || '');
        const roomId = typeof firstRoom.room === 'object' ? (firstRoom.room as any)?._id : firstRoom.room;
        this.selectedRoomId.set(roomId || '');
        // Restore ratePlanId from persisted reservation data
        const ratePlan = (firstRoom as any).ratePlanId;
        this.selectedRatePlanId.set(ratePlan || '');
      }
    } else if (qr) {
      if (qr.selectedRoom && !this.selectedRoomId()) this.selectedRoomId.set(qr.selectedRoom);
      if (qr.ratePlanId && !this.selectedRatePlanId()) this.selectedRatePlanId.set(qr.ratePlanId);
    }
  });

  // Auto-fetch rate plans when room type is known
  private fetchRatePlansEffect = effect(() => {
    const roomTypeId = this.selectedRoomTypeId();
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId && roomTypeId) {
      untracked(() => this.fetchRatePlansForRoomType(roomTypeId));
    }
  });

  // Derive room type from the loaded room (for initial load)
  private deriveRoomTypeEffect = effect(() => {
    const room = this.roomsResource.value();
    if (room && !this.selectedRoomTypeId()) {
      const rtId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
      if (rtId) this.selectedRoomTypeId.set(rtId);
    }
  });

  // Room availability resource
  public roomsResource = rxResource({
    params: () => ({
      roomId: this.selectedRoomId() || (this.isEditing()
        ? this.reservation()!.rooms[0]?.room._id 
        : this.quickReservation()?.selectedRoom),
      isEditing: this.isEditing(),
    }),
    stream: ({ params }) => {
      return this.getRoom(params.roomId).pipe(
        switchMap((room) => {
          // Fetch inventory rates for this room's type
          const storeId = this.storeStore.selectedStore()?._id;
          const roomTypeId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
          const checkIn = this.checkInDate();
          const checkOut = this.checkOutDate();

          if (storeId && roomTypeId && checkIn && checkOut) {
            const checkInStr = this.formatLocalDate(new Date(checkIn));
            const checkOutStr = this.formatLocalDate(new Date(checkOut));
            const ratePlanId = this.selectedRatePlanId() || this.quickReservation()?.ratePlanId || undefined;
            return this.rateInventoryService.getRatesForStay(storeId, roomTypeId, checkInStr, checkOutStr, ratePlanId).pipe(
              map((rates) => ({ room, rates })),
              catchError(() => of({ room, rates: null as StayRates | null }))
            );
          }
          return of({ room, rates: null as StayRates | null });
        }),
        tap(({ room, rates }) => {
          this.inventoryRates.set(rates);

          // Derive room type from loaded room if not already set
          const rtId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
          if (rtId && !this.selectedRoomTypeId()) {
            this.selectedRoomTypeId.set(rtId);
          }

          if (params.isEditing) {
            this.populateSharersFromReservation(this.reservation());
          } else {
            this.buildSharesOnNewReservation();
          }
          // use the single room data to build a rooms array
          this.buildARoomForTheSharers(room);

          // Fetch restrictions on initial load (skip in edit mode — already-saved reservations passed validation)
          if (!params.isEditing) {
            const storeId = this.storeStore.selectedStore()?._id;
            const roomTypeId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
            const checkIn = this.checkInDate();
            const checkOut = this.checkOutDate();
            if (storeId && roomTypeId && checkIn && checkOut) {
              const ratePlanId = this.selectedRatePlanId() || this.quickReservation()?.ratePlanId || undefined;
              this.fetchRestrictions(storeId, roomTypeId, checkIn, checkOut, ratePlanId);
            }
          } else {
            // Clear any stale restriction issues in edit mode
            this.restrictionIssues.set(null);
            this.hasRestrictions.emit(false);
          }
        }),
        map(({ room }) => room)
      );
    },
  });

  /**
   * Populate sharers FormArray from reservation data (for edit mode)
   */
  private populateSharersFromReservation(
    reservation: Reservation | null
  ): void {
    if (!reservation) {
      console.log('[RoomSharers] No reservation provided, skipping population');
      return;
    }

    console.log(
      '[RoomSharers] populateSharersFromReservation called with reservation:',
      reservation
    );

    const sharersArray = this.getSharersFormArray();
    if (!sharersArray) {
      console.warn('[RoomSharers] getSharersFormArray() returned null');
      return;
    }

    // Clear existing sharers
    sharersArray.clear();
    console.log('[RoomSharers] Sharers array cleared');

    if (reservation.sharers && reservation.sharers.length > 0) {
      console.log(
        '[RoomSharers] Populating sharers from reservation.sharers:',
        reservation.sharers
      );

      reservation.sharers.forEach((sharer: any, index: number) => {
        console.log(`[RoomSharers] Processing sharer ${index}:`, sharer);

        const sharerForm = this.fb.group({
          guest: [sharer.guest._id || sharer.guest, [Validators.required]],
          meta: [sharer.guest, []],
          guestType: [sharer.guestType || 'adult', [Validators.required]],
          checkInDate: [new Date(sharer.checkInDate), [Validators.required]],
          checkOutDate: [new Date(sharer.checkOutDate), [Validators.required]],
          ageGrade: [sharer.ageGrade || '', []],
        });

        sharersArray.push(sharerForm);
        console.log(
          `[RoomSharers] Sharer ${index} added to form array. Current array length:`,
          sharersArray.length
        );
      });
    } else {
      console.warn('[RoomSharers] No sharers found in reservation');
    }

    console.log(
      '[RoomSharers] populateSharersFromReservation completed. Final array length:',
      sharersArray.length
    );

    // Wire up date-change listeners for auto-adjusting reservation dates
    this.setupSharerDateListeners(sharersArray);
  }

  private buildSharesOnNewReservation(): void {
    const sharersArray = this.getSharersFormArray();
    if (sharersArray) {
      // Only rebuild if the counts have changed
      const currentLength = sharersArray.length;
      const expectedLength = this.numberOfAdults()! + this.numberOfChildren()!;
      if (currentLength !== expectedLength) {
        // Clear and rebuild sharers array
        sharersArray.clear();

        // Add adult sharers
        for (let i = 0; i < this.numberOfAdults()!; i++) {
          const guestId =
            i === 0 && this.selectedGuest() ? this.selectedGuest()?._id : null;
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

        // Wire up date-change listeners for auto-adjusting reservation dates
        this.setupSharerDateListeners(sharersArray);
      }
    }
  }

  private buildARoomForTheSharers(room: Room | null): void {
    console.log(room, "nvnbbnvv");
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray && room) {
      const roomGroup = this.createRoomFormGroup(room, this.reservation()?.rooms[0]);
      roomsArray.clear();
      roomsArray.push(roomGroup);
    }
  }

  private createRoomFormGroup(room: Room, roomData?: any) {
    // Determine the room price:
    // Priority: 1) existing reservation data, 2) inventory rate, 3) room priceOverride, 4) roomType basePrice
    const rates = this.inventoryRates();
    let roomPrice = roomData?.pricing?.pricePerNight || 0;
    let initialTotalPrice = 0;

    if (!roomPrice && rates?.averageRate) {
      // Use inventory average rate as pricePerNight, total from inventory
      roomPrice = rates.averageRate;
      initialTotalPrice = rates.totalRate;
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

    // Calculate total price if not already set from inventory
    if (!initialTotalPrice) {
      initialTotalPrice = roomPrice * this.numberOfNights();
    }
          console.log(roomData?.pricing?.discount, "roomData?.pricing?.discount");

    return this.fb.group({
      room: [roomData?.room || room._id || '', [Validators.required]], // Room ID
      roomNumber: [roomData?.roomNumber || room.roomNumber || ''], // Store room number for display
      assignedGuest: [roomData?.assignedGuest || this.reservation()?.guest._id ||  ''], // Guest ID (required for group)
      assignedGuestName: [roomData?.assignedGuestName || this.guestService.getGuestName(this.reservation()?.guest) || ''], // Guest display name (for display only)
      roomType: [
        roomData?.roomType ||
          (typeof room.roomType === 'string'
            ? room.roomType
            : room.roomType?._id) ||
          '',
        [Validators.required],
      ], // Room Type ID
      ratePlanId: [roomData?.ratePlanId || this.selectedRatePlanId() || null], // Per-room rate plan

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

  ngAfterViewInit() {
    // Update reservation date limits for sharers
    this.reservationMinDate.set(this.checkInDate()!);
    this.reservationMaxDate.set(this.checkOutDate()!);

    const roomsArray = this.reservationForm()!.get('rooms') as FormArray;
    const sharersArray = this.reservationForm()!.get('sharers') as FormArray;

    // Listen to check-in and check-out date changes
    const checkInSub = this.reservationForm()
      ?.get('checkInDate')
      ?.valueChanges.subscribe((date) => {
        // Skip when reservation dates are being auto-adjusted from sharer changes
        if (this.isAdjustingReservationDates) return;

        this.reservationMinDate.set(date);

        // Update rooms stay period
        for (let i = 0; i < roomsArray.length; i++) {
          roomsArray.at(i)?.patchValue(
            {
              stayPeriod: {
                from: date,
              },
            },
            { emitEvent: false }
          );
        }

        // Update sharers dates
        const sharersArray = this.reservationForm()!.get(
          'sharers'
        ) as FormArray;
        if (sharersArray) {
          for (let i = 0; i < sharersArray.length; i++) {
            sharersArray
              .at(i)
              ?.patchValue({ checkInDate: date }, { emitEvent: false });
          }
        }

        // Re-fetch inventory rates for new date range
        this.refetchInventoryRates();
      });

    const checkOutSub = this.reservationForm()
      ?.get('checkOutDate')
      ?.valueChanges.subscribe((date) => {
        // Skip when reservation dates are being auto-adjusted from sharer changes
        if (this.isAdjustingReservationDates) return;

        this.reservationMaxDate.set(date);

        // Calculate nights from current reservation dates
        const checkIn = this.reservationForm()?.get('checkInDate')?.value;
        const diffTime = Math.abs(date.getTime() - checkIn.getTime());
        const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Update rooms stay period (nights count only, pricing will come from inventory)
        for (let i = 0; i < roomsArray.length; i++) {
          const roomControl = roomsArray.at(i);
          roomControl?.patchValue(
            {
              stayPeriod: {
                to: date,
                numberOfNights: nightsCount,
              },
            },
            { emitEvent: false }
          );
        }

        // Update sharers dates ONLY if this is a direct reservation date change
        const sharersArray = this.reservationForm()!.get(
          'sharers'
        ) as FormArray;
        if (sharersArray) {
          for (let i = 0; i < sharersArray.length; i++) {
            sharersArray
              .at(i)
              ?.patchValue({ checkOutDate: date }, { emitEvent: false });
          }
        }

        // Re-fetch inventory rates for new date range
        this.refetchInventoryRates();
      });

    // Note: Room pricing is now driven by inventory rates (refetchInventoryRates),
    // not by simple pricePerNight * nights multiplication.

    // Listen to individual sharer date changes to auto-adjust reservation dates
    this.setupSharerDateListeners(sharersArray);
  }

  /**
   * Set up listeners on each sharer's checkInDate/checkOutDate to auto-adjust
   * reservation dates when sharers' date ranges change.
   */
  private setupSharerDateListeners(sharersArray: FormArray): void {
    for (let i = 0; i < sharersArray.length; i++) {
      const sharer = sharersArray.at(i);
      sharer?.get('checkInDate')?.valueChanges.subscribe(() => {
        if (!this.isAdjustingReservationDates) {
          this.updateReservationDatesFromSharers();
        }
      });
      sharer?.get('checkOutDate')?.valueChanges.subscribe(() => {
        if (!this.isAdjustingReservationDates) {
          this.updateReservationDatesFromSharers();
        }
      });
    }
  }

  /**
   * Auto-adjust reservation check-in/check-out to exactly cover all sharers.
   * Computes the earliest sharer check-in and latest sharer check-out.
   * If the reservation dates are wider than needed (gaps with no sharer occupying),
   * shrink them. Then re-fetch inventory rates and restrictions.
   */
  private updateReservationDatesFromSharers(): void {
    const sharersArray = this.getSharersFormArray();
    if (!sharersArray || sharersArray.length === 0) return;

    let earliestCheckIn: Date | null = null;
    let latestCheckOut: Date | null = null;

    for (let i = 0; i < sharersArray.length; i++) {
      const sharer = sharersArray.at(i);
      const checkIn = sharer?.get('checkInDate')?.value;
      const checkOut = sharer?.get('checkOutDate')?.value;

      if (checkIn) {
        const from = new Date(checkIn);
        from.setHours(0, 0, 0, 0);
        if (!earliestCheckIn || from < earliestCheckIn) {
          earliestCheckIn = from;
        }
      }
      if (checkOut) {
        const to = new Date(checkOut);
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

    // Only adjust if the reservation dates differ from sharer coverage
    const needsAdjustment =
      earliestCheckIn.getTime() !== currentCheckIn.getTime() ||
      latestCheckOut.getTime() !== currentCheckOut.getTime();

    if (!needsAdjustment) return;

    // Set guard flag so checkIn/checkOut subscriptions don't overwrite sharer dates
    this.isAdjustingReservationDates = true;

    const diffTime = Math.abs(latestCheckOut.getTime() - earliestCheckIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    reservationForm.patchValue({
      checkInDate: earliestCheckIn,
      checkOutDate: latestCheckOut,
      numberOfNights: nights,
    });

    // Update the min/max date signals
    this.reservationMinDate.set(earliestCheckIn);
    this.reservationMaxDate.set(latestCheckOut);

    // Update rooms stay period to match
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray && roomsArray.length > 0) {
      for (let i = 0; i < roomsArray.length; i++) {
        roomsArray.at(i)?.patchValue(
          {
            stayPeriod: {
              from: earliestCheckIn,
              to: latestCheckOut,
              numberOfNights: nights,
            },
          },
          { emitEvent: false }
        );
      }
    }

    // Clear guard after a tick (after valueChanges listeners have fired)
    setTimeout(() => {
      this.isAdjustingReservationDates = false;
    }, 0);

    // Re-fetch inventory rates and restrictions for the new date range
    this.refetchInventoryRates();

    // Notify user
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
      const newSharerForm = this.fb.group({
        guest: [guest?._id],
        meta: guest,
        guestType: ['individual'],
        ageGrade: ageGrade,
        checkInDate: [this.reservationMinDate()],
        checkOutDate: [this.reservationMaxDate()],
      });
      sharersArray.push(newSharerForm);

      // Wire up date-change listeners for the new sharer
      const newIndex = sharersArray.length - 1;
      newSharerForm.get('checkInDate')?.valueChanges.subscribe(() => {
        if (!this.isAdjustingReservationDates) {
          this.updateReservationDatesFromSharers();
        }
      });
      newSharerForm.get('checkOutDate')?.valueChanges.subscribe(() => {
        if (!this.isAdjustingReservationDates) {
          this.updateReservationDatesFromSharers();
        }
      });
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

    // Auto-adjust reservation dates after removing a sharer
    if (sharersArray.length > 0) {
      this.updateReservationDatesFromSharers();
    }
  }

  /**
   * Update a sharer with guest data (when selected from search)
   */
  updateSharerWithGuest(index: number, guest: any) {
    // const sharersArray = this.getSharersFormArray();
    // const sharer = sharersArray.at(index);
    // if (!sharer) return;

    // this.selectedGuest.set(guest);
    // sharer.patchValue({
    //   guest: guest._id,
    //   meta: guest,
    //   guestType: 'adult',
    // });

    // // Also update the room's assigned guest if this is the primary guest (index 0)
    // if (index === 0) {
    //   const roomsArray = this.getRoomsFormArray();
    //   if (roomsArray && roomsArray.length > 0) {
    //     const roomControl = roomsArray.at(0);
    //     if (roomControl) {
    //       roomControl.patchValue({
    //         assignedGuest: guest._id,
    //         assignedGuestName: `${guest.firstName || ''} ${
    //           guest.lastName || ''
    //         }`.trim(),
    //       });
    //     }
    //   }
    // }
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

  /**
   * Fetch inventory restriction records and validate stop-sell, CTA, CTD, min/max stay.
   * Same logic as quick-reservation modal's restrictionIssues computed.
   */
  private fetchRestrictions(storeId: string, roomTypeId: string, checkIn: Date, checkOut: Date, ratePlanId?: string): void {
    const checkInStr = this.formatLocalDate(new Date(checkIn));
    // Extend end date by 1 day to include checkout date for CTD checking
    const checkOutDate = new Date(checkOut);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    const extendedEndStr = this.formatLocalDate(checkOutDate);
    const checkOutStr = this.formatLocalDate(new Date(checkOut));

    const nights = this.numberOfNights();
    if (nights <= 0) {
      this.restrictionIssues.set(null);
      this.hasRestrictions.emit(false);
      return;
    }

    this.loadingRestrictions.set(true);

    this.rateInventoryService
      .getInventory(storeId, roomTypeId, checkInStr, extendedEndStr, ratePlanId)
      .pipe(catchError(() => of([])))
      .subscribe((records: RateInventoryRecord[]) => {
        const issues: Array<{ date: string; type: string; detail: string }> = [];

        for (const record of records) {
          const dateStr = typeof record.date === 'string' ? record.date.split('T')[0] : '';
          const r = record.restrictions;
          if (!r) continue;

          // Stop-sell: any stay night with stop-sell blocks the booking
          if (r.stopSell && dateStr !== checkOutStr) {
            issues.push({ date: dateStr, type: 'stop-sell', detail: 'Stop Sell — date closed for bookings' });
          }

          // CTA: check-in date closed to arrival
          if (r.closedToArrival && dateStr === checkInStr) {
            issues.push({ date: dateStr, type: 'cta', detail: 'Closed to Arrival — cannot check in on this date' });
          }

          // CTD: check-out date closed to departure
          if (r.closedToDeparture && dateStr === checkOutStr) {
            issues.push({ date: dateStr, type: 'ctd', detail: 'Closed to Departure — cannot check out on this date' });
          }

          // Min stay (report once)
          if (r.minStay && r.minStay > 1 && nights < r.minStay && !issues.find(i => i.type === 'min-stay')) {
            issues.push({ date: dateStr, type: 'min-stay', detail: `Minimum stay is ${r.minStay} nights` });
          }

          // Max stay (report once)
          if (r.maxStay && r.maxStay < 365 && nights > r.maxStay && !issues.find(i => i.type === 'max-stay')) {
            issues.push({ date: dateStr, type: 'max-stay', detail: `Maximum stay is ${r.maxStay} nights` });
          }
        }

        this.restrictionIssues.set(issues.length > 0 ? issues : null);
        this.hasRestrictions.emit(issues.length > 0);
        this.loadingRestrictions.set(false);
      });
  }

  /**
   * Re-fetch inventory rates when reservation dates change.
   * Updates pricing, rate breakdown, and room form values from new inventory data.
   */
  private refetchInventoryRates(): void {
    const room = this.roomsResource.value();
    if (!room) return;

    const storeId = this.storeStore.selectedStore()?._id;
    const roomTypeId = typeof room.roomType === 'object' ? room.roomType?._id : room.roomType;
    const checkIn = this.checkInDate();
    const checkOut = this.checkOutDate();

    if (!storeId || !roomTypeId || !checkIn || !checkOut) return;

    const checkInStr = this.formatLocalDate(new Date(checkIn));
    const checkOutStr = this.formatLocalDate(new Date(checkOut));
    const ratePlanId = this.selectedRatePlanId() || this.quickReservation()?.ratePlanId || undefined;

    // Also fetch restrictions for the new date range
    this.fetchRestrictions(storeId, roomTypeId, checkIn, checkOut, ratePlanId);

    this.loadingRates.set(true);

    this.rateInventoryService
      .getRatesForStay(storeId, roomTypeId, checkInStr, checkOutStr, ratePlanId)
      .subscribe({
        next: (rates: StayRates) => {
          // Update the inventory rates signal (triggers rateBreakdown computed)
          this.inventoryRates.set(rates);

          // Update room pricing from new inventory rates
          const roomsArray = this.getRoomsFormArray();
          if (roomsArray && roomsArray.length > 0) {
            const roomControl = roomsArray.at(0);
            if (rates?.averageRate) {
              roomControl?.patchValue(
                {
                  stayPeriod: {
                    numberOfNights: rates.numberOfNights,
                  },
                  pricing: {
                    pricePerNight: rates.averageRate,
                    totalPrice: rates.totalRate,
                    subtotal: rates.totalRate,
                    total: rates.totalRate,
                  },
                },
                { emitEvent: true }
              );
            } else {
              // Fallback: no inventory rates, use pricePerNight × nights
              const pricing = roomControl?.get('pricing') as FormGroup;
              const pricePerNight = pricing?.get('pricePerNight')?.value || 0;
              const nights = this.numberOfNights();
              const totalPrice = pricePerNight * nights;
              roomControl?.patchValue(
                {
                  stayPeriod: { numberOfNights: nights },
                  pricing: {
                    totalPrice: totalPrice,
                    subtotal: totalPrice,
                    total: totalPrice,
                  },
                },
                { emitEvent: true }
              );
            }
          }

          this.loadingRates.set(false);
        },
        error: (err) => {
          console.error('[RoomSharers] Failed to refetch inventory rates:', err);
          this.loadingRates.set(false);

          // Fallback: simple pricePerNight × nights
          const roomsArray = this.getRoomsFormArray();
          if (roomsArray && roomsArray.length > 0) {
            const roomControl = roomsArray.at(0);
            const pricing = roomControl?.get('pricing') as FormGroup;
            const pricePerNight = pricing?.get('pricePerNight')?.value || 0;
            const nights = this.numberOfNights();
            const totalPrice = pricePerNight * nights;
            roomControl?.patchValue(
              {
                stayPeriod: { numberOfNights: nights },
                pricing: {
                  totalPrice: totalPrice,
                  subtotal: totalPrice,
                  total: totalPrice,
                },
              },
              { emitEvent: true }
            );
          }
        },
      });
  }

  /**
   * Fetch rate plans for a given room type.
   */
  private fetchRatePlansForRoomType(roomTypeId: string): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !roomTypeId) return;

    this.loadingRatePlans.set(true);
    this.rateInventoryService
      .getRatePlansByRoomType(storeId, roomTypeId)
      .pipe(catchError(() => of([])))
      .subscribe((plans: RatePlan[]) => {
        this.ratePlans.set(plans);
        this.loadingRatePlans.set(false);
      });
  }

  /**
   * Handle room type change from the header dropdown.
   * Resets room and rate plan, fetches new rate plans, updates query params.
   */
  onRoomTypeChange(roomTypeId: string): void {
    this.selectedRoomTypeId.set(roomTypeId);
    this.selectedRoomId.set('');
    this.selectedRatePlanId.set('');
    this.ratePlans.set([]);
    this.inventoryRates.set(null);

    // Clear room form data
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray && roomsArray.length > 0) {
      roomsArray.at(0)?.patchValue({ roomType: roomTypeId, room: '', ratePlanId: null }, { emitEvent: false });
    }

    // Fetch rate plans for the new room type
    if (roomTypeId) {
      this.fetchRatePlansForRoomType(roomTypeId);
    }

    this.updateQuickReservationQueryParams();
  }

  /**
   * Handle room change from the header dropdown.
   * Reloads room data, updates pricing, updates query params.
   */
  onRoomChange(roomId: string): void {
    this.selectedRoomId.set(roomId);

    // Update room form
    const roomsArray = this.getRoomsFormArray();
    const selectedRoom = this.allRoomsResource.value()?.find((r) => r._id === roomId);
    if (roomsArray && roomsArray.length > 0 && selectedRoom) {
      roomsArray.at(0)?.patchValue({
        room: roomId,
        roomNumber: selectedRoom.roomNumber || '',
      }, { emitEvent: false });
    }

    // Re-fetch inventory rates for the new room
    this.refetchInventoryRates();
    this.updateQuickReservationQueryParams();
  }

  /**
   * Handle rate plan change from the header dropdown.
   * Re-fetches inventory rates with the new rate plan, updates query params.
   */
  onRatePlanChangeHeader(ratePlanId: string): void {
    this.selectedRatePlanId.set(ratePlanId);

    // Sync to room form so it persists on save
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray && roomsArray.length > 0) {
      roomsArray.at(0)?.patchValue({ ratePlanId: ratePlanId || null }, { emitEvent: false });
    }

    this.refetchInventoryRates();
    this.updateQuickReservationQueryParams();
  }

  /**
   * Update the quickReservation query parameter in the URL with the current selections.
   * Only applies during creation (not edit mode).
   */
  private updateQuickReservationQueryParams(): void {
    if (this.isEditing()) return;

    const qr = this.quickReservation();
    if (!qr) return;

    const updatedQr = {
      ...qr,
      roomTypeFilter: this.getRoomTypeNameById(this.selectedRoomTypeId()) || qr.roomTypeFilter,
      selectedRoom: this.selectedRoomId() || qr.selectedRoom,
      ratePlanId: this.selectedRatePlanId() || qr.ratePlanId,
    };

    this.queryParamService.add({
      quickReservation: JSON.stringify(updatedQr),
    });
  }

  /**
   * Get room type name by ID for query param display.
   */
  private getRoomTypeNameById(roomTypeId: string): string {
    const types = this.roomTypesResource.value() || [];
    const found = types.find((t) => t._id === roomTypeId);
    return found?.name || '';
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
