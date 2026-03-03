import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { RateInventoryService, StayRates, AvailabilityCheck, RateInventoryRecord, RatePlan } from '../../../../../shared/services/rate-inventory.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { of, forkJoin, map, switchMap, catchError } from 'rxjs';

interface AvailableRoom {
  id?: string;
  _id?: string;
  name: string;
  roomType: { _id: string; name: string; basePrice?: number; capacity?: any };
  roomNumber?: string;
  pricePerNight?: number;
  priceOverride?: number;
  maxCapacity?: number;
  amenities?: string[];
}

export interface QuickReservationData {
  bookingType: 'single' | 'group';
  checkInDate: Date;
  checkOutDate: Date;
  roomTypeFilter: string;
  selectedRoom: string;
  ratePlanId: string;
  adults: number;
  children: number;
}

// Dialog input data interface for pre-filling from calendar drag selection
export interface QuickReservationDialogData {
  checkInDate: Date;
  checkOutDate: Date;
  preselectedRoomId?: string;
  preselectedRoomName?: string;
  preselectedRoomTypeId?: string;
  preselectedRoomTypeName?: string;
}

@Component({
  selector: 'app-quick-reservation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './quick-reservation-modal.component.html',
  styleUrls: ['./quick-reservation-modal.component.scss']
})
export class QuickReservationModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuickReservationModalComponent>);
  private roomsService = inject(RoomsService);
  private rateInventoryService = inject(RateInventoryService);
  private router = inject(Router);
  public storeStore = inject(StoreStore);
  
  // Optional dialog data for pre-filling from calendar drag selection
  public dialogData = inject<QuickReservationDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  public roomTypeField = new FormControl('');
  public ratePlanField = new FormControl('');

  // Min date signal - today or later
  public minDate = signal(new Date());

  public quickReservationForm = this.fb.group({
    bookingType: ['single', Validators.required],
    dateRange: this.fb.group({
      start: [new Date(), [Validators.required, this.minDateValidator.bind(this)]],
      end: [this.getNextDay(new Date()), [Validators.required, this.minDateValidator.bind(this)]],
    }),
    selectedRoom: ['', Validators.required],
    adults: [1, [Validators.required, Validators.min(1)]],
    children: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    // Pre-fill form with dialog data if provided (from calendar drag selection)
    if (this.dialogData) {
      if (this.dialogData.checkInDate && this.dialogData.checkOutDate) {
        this.quickReservationForm.get('dateRange')?.patchValue({
          start: this.dialogData.checkInDate,
          end: this.dialogData.checkOutDate
        });
      }
      
      if (this.dialogData.preselectedRoomId) {
        // Set the room after the available rooms are loaded
        this.quickReservationForm.patchValue({ selectedRoom: this.dialogData.preselectedRoomId });
      }
      
      if (this.dialogData.preselectedRoomTypeName) {
        // Set the room type filter
        this.roomTypeField.patchValue(this.dialogData.preselectedRoomTypeName);
      }
    }
  }

  // Store preselected room ID to set after rooms are loaded
  private preselectedRoomId: string | null = null;

  // Signals for form values - similar to reservation form
  public checkIn = toSignal(
    this.quickReservationForm.get('dateRange.start')!.valueChanges,
    { initialValue: this.quickReservationForm.get('dateRange.start')!.value }
  );

  public checkOut = toSignal(
    this.quickReservationForm.get('dateRange.end')!.valueChanges,
    { initialValue: this.quickReservationForm.get('dateRange.end')!.value }
  );

  public selectedRoomId = toSignal(
    this.quickReservationForm.get('selectedRoom')!.valueChanges,
    { initialValue: this.quickReservationForm.get('selectedRoom')!.value }
  );

  public bookingType = toSignal(
    this.quickReservationForm.get('bookingType')!.valueChanges,
    { initialValue: this.quickReservationForm.get('bookingType')!.value }
  );

  public adultsValue = toSignal(
    this.quickReservationForm.get('adults')!.valueChanges,
    { initialValue: this.quickReservationForm.get('adults')!.value }
  );

  public childrenValue = toSignal(
    this.quickReservationForm.get('children')!.valueChanges,
    { initialValue: this.quickReservationForm.get('children')!.value }
  );

  // Calculate number of nights
  public numberOfNights = computed(() => {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  });

  // rxResource for loading available rooms - similar to reservation form
  public availableRoomsResource = rxResource({
    params: () => ({ 
      checkIn: this.checkIn(), 
      checkOut: this.checkOut(),
      storeId: this.storeStore.selectedStore()?._id 
    }),
    stream: ({ params }) => this.getAvailableRooms({
      checkIn: params.checkIn!,
      checkOut: params.checkOut!,
      storeId: params.storeId!,
    }),
  });

  // Fetch ALL rooms for the store (regardless of status/availability)
  public allRoomsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) return of([]);
      return this.roomsService.getRooms(params.storeId);
    },
  });

  // Fetch ALL room types for the store (not just those with available rooms)
  public allRoomTypesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) return of([]);
      return this.roomsService.getRoomTypes(params.storeId);
    },
  });

  // Room type filtering
  private roomTypeValue = toSignal(this.roomTypeField.valueChanges, { 
    initialValue: this.roomTypeField.value 
  });

  public uniqueRoomTypes = computed(() => {
    const allTypes = this.allRoomTypesResource.value() || [];
    if (allTypes.length > 0) {
      return allTypes.map((rt: any) => rt.name).sort();
    }
    // Fallback to available rooms if room types haven't loaded yet
    const rooms = this.availableRoomsResource.value() || [];
    const types = new Set(rooms.map(room => room.roomType.name));
    return Array.from(types).sort();
  });

  // Resolve room type dropdown value (name) → room type _id
  public roomTypeIdFromDropdown = computed(() => {
    const typeName = this.roomTypeValue();
    if (!typeName) return null;
    const allTypes = (this.allRoomTypesResource.value() || []) as any[];
    const found = allTypes.find((rt: any) => rt.name === typeName);
    return found?._id || null;
  });

  // Number of rooms currently selected
  public selectedRoomCount = computed(() => {
    const sel = this.selectedRoomId();
    if (!sel) return 0;
    if (Array.isArray(sel)) return sel.filter(Boolean).length;
    return sel ? 1 : 0;
  });

  // Track selected rate plan
  private ratePlanValue = toSignal(this.ratePlanField.valueChanges, {
    initialValue: this.ratePlanField.value,
  });

  // Fetch rate plans for the selected room type (from dropdown)
  public ratePlansResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      roomTypeId: this.roomTypeIdFromDropdown(),
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.roomTypeId) return of([]);
      return this.rateInventoryService.getRatePlansByRoomType(params.storeId, params.roomTypeId);
    },
  });

  public filteredRooms = computed(() => {
    const allRooms = (this.allRoomsResource.value() || []) as any[];
    const availableRooms = this.availableRoomsResource.value() || [];
    const availableIds = new Set(availableRooms.map((r: any) => r._id || r.id));
    const selectedType = this.roomTypeValue();

    // Auto-select preselected room when rooms are loaded
    if (this.preselectedRoomId && allRooms.length > 0) {
      const preselectedRoom = allRooms.find((r: any) => (r._id || r.id) === this.preselectedRoomId);
      if (preselectedRoom) {
        this.quickReservationForm.get('selectedRoom')?.setValue(this.preselectedRoomId);
        this.preselectedRoomId = null;
      }
    }

    // Filter by active rooms only
    let rooms = allRooms.filter((room: any) => room.active !== false);

    // Filter by selected room type
    if (selectedType) {
      rooms = rooms.filter((room: any) => {
        const rt = room.roomType;
        const typeName = typeof rt === 'object' ? rt?.name : '';
        return typeName === selectedType;
      });
    }

    // Map rooms with availability and status info
    return rooms.map((room: any) => {
      const id = room._id || room.id;
      const inAvailableList = availableIds.has(id);
      const isDirty = room.housekeepingStatus === 'dirty';
      const isBookable = inAvailableList && !isDirty;

      let unavailableReason: string | null = null;
      if (!inAvailableList) {
        if (room.status === 'occupied') unavailableReason = 'Occupied';
        else if (room.status === 'maintenance') unavailableReason = 'Maintenance';
        else if (room.status === 'out_of_order') unavailableReason = 'Out of Order';
        else if (room.status === 'cleaning') unavailableReason = 'Cleaning';
        else unavailableReason = 'Unavailable';
      } else if (isDirty) {
        unavailableReason = 'Dirty';
      }

      return {
        ...room,
        _id: id,
        name: room.name || `Room ${room.roomNumber}`,
        roomType: room.roomType,
        isBookable,
        unavailableReason,
      };
    });
  });

  // Get max capacity from selected room(s)
  public maxCapacity = computed(() => {
    const selectedRoomId = this.selectedRoomId();
    const rooms = (this.allRoomsResource.value() || []) as any[];

    if (!selectedRoomId) return { adults: 0, children: 0 };

    const roomIds = Array.isArray(selectedRoomId) ? selectedRoomId : [selectedRoomId];
    let maxAdults = 0;
    let maxChildren = 0;

    roomIds.forEach(id => {
      const room = rooms.find((r: any) => (r._id || r.id) === id);
      const rt = room?.roomType;
      const capacity = typeof rt === 'object' ? rt?.capacity : null;
      if (capacity) {
        maxAdults += capacity.adults || 0;
        maxChildren += capacity.children || 0;
      }
    });

    return { adults: maxAdults, children: maxChildren };
  });

  // Validator for occupancy
  private occupancyValidator = (): any => {
    const adults = this.adultsValue() || 0;
    const children = this.childrenValue() || 0;
    const maxCap = this.maxCapacity();

    if (adults > maxCap.adults) {
      this.quickReservationForm.get('adults')?.setErrors({ exceedsCapacity: true });
      return { exceedsCapacity: true };
    }

    if (children > maxCap.children) {
      this.quickReservationForm.get('children')?.setErrors({ exceedsCapacity: true });
      return { exceedsCapacity: true };
    }

    if (adults + children > (maxCap.adults + maxCap.children)) {
      this.quickReservationForm.setErrors({ totalOccupancyExceeded: true });
      return { totalOccupancyExceeded: true };
    }

    // Clear errors if validation passes
    if (this.quickReservationForm.hasError('totalOccupancyExceeded')) {
      this.quickReservationForm.setErrors(null);
    }

    return null;
  };

  // Effect to run occupancy validation when inputs change
  private occupancyCheck = computed(() => {
    // Trigger validation whenever adults, children, or max capacity changes
    this.adultsValue();
    this.childrenValue();
    this.maxCapacity();
    return this.occupancyValidator();
  });

  // Fetch rates based on room type (from dropdown) + rate plan + dates
  public ratesResource = rxResource({
    params: () => ({
      roomTypeId: this.roomTypeIdFromDropdown(),
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      storeId: this.storeStore.selectedStore()?._id,
      ratePlanId: this.ratePlanValue() || undefined,
      roomCount: this.selectedRoomCount() || 1,
    }),
    stream: ({ params }) => {
      // Require: room type, dates, store, AND a rate plan selected
      if (!params.roomTypeId || !params.checkIn || !params.checkOut || !params.storeId || !params.ratePlanId) {
        return of(null);
      }

      const checkInStr = this.formatLocalDate(params.checkIn);
      const checkOutStr = this.formatLocalDate(params.checkOut);

      return this.rateInventoryService.getRatesForStay(
        params.storeId, params.roomTypeId, checkInStr, checkOutStr, params.ratePlanId
      ).pipe(
        map((stayRates: any) => {
          const roomCount = params.roomCount;
          const nightsBreakdown = (stayRates.nights || []).map((n: any) => ({
            date: typeof n.date === 'string' ? n.date : String(n.date),
            rate: n.rate,
            source: n.source,
          }));
          const uniqueRates = new Set(nightsBreakdown.map((n: any) => n.rate));

          return {
            total: stayRates.totalRate * roomCount,
            averageRate: stayRates.averageRate,
            numberOfNights: stayRates.numberOfNights,
            nightsBreakdown,
            roomCount,
            hasVaryingRates: uniqueRates.size > 1,
            ratePerRoom: stayRates.totalRate,
          };
        })
      );
    },
  });

  // ─── Availability Check Resource ───
  public availabilityResource = rxResource({
    params: () => ({
      roomTypeId: this.roomTypeIdFromDropdown(),
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      storeId: this.storeStore.selectedStore()?._id,
      roomCount: this.selectedRoomCount() || 1,
    }),
    stream: ({ params }) => {
      if (!params.roomTypeId || !params.checkIn || !params.checkOut || !params.storeId) {
        return of(null);
      }

      const checkInStr = this.formatLocalDate(params.checkIn);
      const checkOutStr = this.formatLocalDate(params.checkOut);

      return this.rateInventoryService.checkAvailability(
        params.storeId, params.roomTypeId, checkInStr, checkOutStr
      ).pipe(
        catchError(() => of({ available: true, minAvailability: 999, dailyAvailability: [] } as AvailabilityCheck)),
        map((check: AvailabilityCheck) => {
          const roomsRequested = params.roomCount;
          let overallAvailable = check.minAvailability >= roomsRequested;
          const unavailableDates: Array<{ date: string; availability: number; roomType: string }> = [];

          (check.dailyAvailability || []).forEach((day: any) => {
            if (day.availability < roomsRequested) {
              const dateStr = day.date instanceof Date
                ? this.formatLocalDate(day.date)
                : String(day.date).split('T')[0];
              unavailableDates.push({
                date: dateStr,
                availability: day.availability,
                roomType: params.roomTypeId!,
              });
            }
          });

          if (unavailableDates.length > 0) overallAvailable = false;

          return { available: overallAvailable, unavailableDates, roomsRequested };
        })
      );
    },
  });

  // ─── Inventory Restrictions Resource ───
  public inventoryRestrictionsResource = rxResource({
    params: () => ({
      roomTypeId: this.roomTypeIdFromDropdown(),
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      storeId: this.storeStore.selectedStore()?._id,
      ratePlanId: this.ratePlanValue() || undefined,
    }),
    stream: ({ params }) => {
      if (!params.roomTypeId || !params.checkIn || !params.checkOut || !params.storeId || !params.ratePlanId) {
        return of([]);
      }

      const checkInStr = this.formatLocalDate(params.checkIn);
      // Extend end date by 1 day to include checkout date for CTD checking
      const checkOutDate = new Date(params.checkOut);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      const extendedEndStr = this.formatLocalDate(checkOutDate);

      return this.rateInventoryService.getInventory(
        params.storeId, params.roomTypeId, checkInStr, extendedEndStr, params.ratePlanId
      ).pipe(catchError(() => of([])));
    },
  });

  /** Check inventory restrictions: stop-sell, CTA, CTD, min/max stay */
  public restrictionIssues = computed(() => {
    const records = (this.inventoryRestrictionsResource.value() || []) as RateInventoryRecord[];
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    const nights = this.numberOfNights();

    if (!checkIn || !checkOut || nights <= 0) return null;

    const checkInStr = this.formatLocalDate(checkIn);
    const checkOutStr = this.formatLocalDate(checkOut);

    const issues: Array<{ date: string; type: string; detail: string }> = [];

    for (const record of records) {
      const dateStr = typeof record.date === 'string'
        ? record.date.split('T')[0]
        : '';
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

    // Also check rate-plan-level restrictions
    const ratePlans = this.ratePlansResource.value() || [];
    const selectedPlanId = this.ratePlanValue();
    if (selectedPlanId && ratePlans.length > 0) {
      const plan = ratePlans.find((p: any) => p._id === selectedPlanId) as RatePlan | undefined;
      if (plan?.restrictions) {
        if (plan.restrictions.closedToArrival && !issues.find(i => i.type === 'cta')) {
          issues.push({ date: '', type: 'cta', detail: 'Rate plan is Closed to Arrival' });
        }
        if (plan.restrictions.closedToDeparture && !issues.find(i => i.type === 'ctd')) {
          issues.push({ date: '', type: 'ctd', detail: 'Rate plan is Closed to Departure' });
        }
        if (plan.restrictions.minStay > 1 && nights < plan.restrictions.minStay && !issues.find(i => i.type === 'min-stay')) {
          issues.push({ date: '', type: 'min-stay', detail: `Rate plan minimum stay is ${plan.restrictions.minStay} nights` });
        }
        if (plan.restrictions.maxStay && plan.restrictions.maxStay < 365 && nights > plan.restrictions.maxStay && !issues.find(i => i.type === 'max-stay')) {
          issues.push({ date: '', type: 'max-stay', detail: `Rate plan maximum stay is ${plan.restrictions.maxStay} nights` });
        }
      }
    }

    return issues.length > 0 ? issues : null;
  });

  // ─── Validation Signals ───

  /** Check if any nights have zero rates (truly missing — rate plan fallbacks are valid) */
  public missingRateNights = computed(() => {
    const ratesData = this.ratesResource.value();
    if (!ratesData?.nightsBreakdown) return [];
    // Only flag nights with rate = 0 (rate plan base/seasonal/day-of-week are all valid)
    return ratesData.nightsBreakdown
      .filter((n: any) => n.rate === 0)
      .map((n: any) => n.date);
  });

  /** Check if there are any availability issues */
  public availabilityIssues = computed(() => {
    const availData = this.availabilityResource.value();
    if (!availData) return null;
    if (availData.available && availData.unavailableDates.length === 0) return null;
    return availData;
  });

  /** Whether the booking can proceed (dates valid, rates exist, no restrictions, availability OK) */
  public canProceed = computed(() => {
    const nights = this.numberOfNights();
    if (nights <= 0) return false;

    // Must have a room type and rate plan selected
    if (!this.roomTypeIdFromDropdown()) return false;
    if (!this.ratePlanValue()) return false;

    const ratesData = this.ratesResource.value();
    if (!ratesData) return false;
    if (ratesData.total <= 0) return false;

    // Check inventory restrictions (stop-sell, CTA, CTD, min/max stay)
    const restrictions = this.restrictionIssues();
    if (restrictions && restrictions.length > 0) return false;

    // Check availability
    const availData = this.availabilityResource.value();
    if (availData && !availData.available) return false;

    return true;
  });

  // Calculate total amount from rates (room type + rate plan + dates)
  public totalAmount = computed(() => {
    const ratesData = this.ratesResource.value();
    if (ratesData?.total) {
      return ratesData.total;
    }
    return 0;
  });


  private getAvailableRooms(params: { checkIn: Date; checkOut: Date; storeId: string }) {
    const checkInDate = this.formatLocalDate(params.checkIn);
    const checkOutDate = this.formatLocalDate(params.checkOut);
    
    if (!checkInDate || !checkOutDate || !params.storeId) {
      return of<AvailableRoom[]>([]);
    }

    return this.roomsService.getAvailableRooms({
      storeId: params.storeId,
      checkInDate,
      checkOutDate,
    });
  }

  private minDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { minDateInvalid: true };
    }
    return null;
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onProceed(): void {
    if (this.quickReservationForm.invalid || this.occupancyCheck()) {
      return;
    }

    const formValue = this.quickReservationForm.value;
    const dateRange = formValue.dateRange;
    
    const data: QuickReservationData = {
      bookingType: formValue.bookingType as 'single' | 'group',
      checkInDate: dateRange?.start as Date,
      checkOutDate: dateRange?.end as Date,
      roomTypeFilter: this.roomTypeField.value || '',
      selectedRoom: this.selectedRoomId() || '',
      ratePlanId: this.ratePlanField.value || '',
      adults: formValue.adults || 1,
      children: formValue.children || 0,
    };

    // Close dialog and navigate to reservation form with query params
    this.dialogRef.close(data);
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

  private getNextDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  }
}
