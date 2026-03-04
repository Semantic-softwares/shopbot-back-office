import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreService } from '../../../../../shared/services/store.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import {
  RateInventoryService,
  RatePlan,
  StayRates,
  NightRate,
  RateInventoryRecord,
} from '../../../../../shared/services/rate-inventory.service';
import { RoomType } from '../../../../../shared/models/room.model';

export interface RoomChangeDialogData {
  reservationId: string;
  currentRooms: any[];
  currentRoomIndex?: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  currency: string;
  actualCheckInDate?: string;
  reservationStatus?: string;
  storeId: string;
}

export interface RoomChangeResult {
  mode: 'single';
  currentRoom: any;
  newRoom: any;
  newRooms: any[];
  ratePlanId: string | null;
  pricingAdjustment: {
    oldTotal: number;
    newTotal: number;
    difference: number;
    requiresPayment: boolean;
    refundAmount?: number;
    nightsConsumed?: number;
    nightsRemaining?: number;
    perNightRates?: NightRate[];
  };
  reason: string;
  effectiveDate?: string;
  suggestedInternalNote: string;
  roomMapping: any[];
  performedBy: string;
}

@Component({
  selector: 'app-room-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule,
  ],
  templateUrl: './room-change-dialog.component.html',
})
export class RoomChangeDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<RoomChangeDialogComponent>);
  private fb = inject(FormBuilder);
  private roomsService = inject(RoomsService);
  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  private rateInventoryService = inject(RateInventoryService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  data: RoomChangeDialogData = inject(MAT_DIALOG_DATA);

  // Form
  roomChangeForm: FormGroup = this.fb.group({
    roomType: [null, Validators.required],
    ratePlanId: [null],
    newRoom: [null, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  // State: dropdowns
  roomTypes = signal<RoomType[]>([]);
  ratePlans = signal<RatePlan[]>([]);
  availableRooms = signal<any[]>([]);
  loadingRoomTypes = signal<boolean>(true);
  loadingRatePlans = signal<boolean>(false);
  loadingRooms = signal<boolean>(false);

  // State: inventory rates (new room)
  inventoryRates = signal<StayRates | null>(null);
  loadingRates = signal<boolean>(false);

  // State: inventory rates (current room)
  currentRoomRates = signal<StayRates | null>(null);
  loadingCurrentRates = signal<boolean>(true);

  // State: restriction issues
  restrictionIssues = signal<Array<{ date: string; type: string; detail: string }> | null>(null);
  loadingRestrictions = signal<boolean>(false);

  // State: submission
  submitting = signal(false);
  selectedNewRoom = signal<any>(null);
  formValid = signal(false);

  // Effective date for room change
  effectiveDate = signal<Date>(new Date());

  // The current room being changed
  currentRoom = computed(() => {
    const index = this.data.currentRoomIndex ?? 0;
    return this.data.currentRooms[index] || this.data.currentRooms[0];
  });

  // Room-specific dates (use stayPeriod if available, fall back to reservation dates)
  roomCheckIn = computed(() => {
    const room = this.currentRoom();
    return room?.stayPeriod?.from ? new Date(room.stayPeriod.from) : new Date(this.data.checkInDate);
  });

  roomCheckOut = computed(() => {
    const room = this.currentRoom();
    return room?.stayPeriod?.to ? new Date(room.stayPeriod.to) : new Date(this.data.checkOutDate);
  });

  roomNights = computed(() => {
    const room = this.currentRoom();
    if (room?.stayPeriod?.numberOfNights) return room.stayPeriod.numberOfNights;
    const diffTime = this.roomCheckOut().getTime() - this.roomCheckIn().getTime();
    return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  });

  // Current room details for display
  currentRoomDetails = computed(() => {
    const room = this.currentRoom();
    const roomData = room?.room || room;
    return {
      roomNumber: roomData?.roomNumber || '—',
      roomName: roomData?.name || '—',
      roomTypeName: roomData?.roomType?.name || room?.roomType?.name || 'Standard',
      roomTypeId: roomData?.roomType?._id || room?.roomType?._id || room?.roomType || '',
      rate: room?.pricing?.pricePerNight || this.getRoomRate(room),
      totalPrice: room?.pricing?.totalPrice || 0,
    };
  });

  // Nights consumed (past nights that cannot be changed)
  nightsConsumed = computed(() => {
    const checkInDate = this.roomCheckIn();
    const effective = this.effectiveDate();

    if (this.data.reservationStatus !== 'checked_in') {
      return 0;
    }

    const actualCheckIn = this.data.actualCheckInDate
      ? new Date(this.data.actualCheckInDate)
      : checkInDate;

    const diffTime = effective.getTime() - actualCheckIn.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  });

  // Nights remaining
  nightsRemaining = computed(() => {
    const checkOutDate = this.roomCheckOut();
    const effective = this.effectiveDate();

    const diffTime = checkOutDate.getTime() - effective.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  });

  // Check if mid-stay change
  isMidStayChange = computed(() => this.nightsConsumed() > 0);

  // Current room total cost (prefer inventory total → saved pricing → rate × nights)
  currentRoomCost = computed(() => {
    const crRates = this.currentRoomRates();
    if (crRates?.totalRate) return crRates.totalRate;
    const cr = this.currentRoom();
    return cr?.pricing?.totalPrice || this.currentRoomDetails().rate * this.roomNights();
  });

  // Current room average rate from inventory
  currentRoomAvgRate = computed(() => {
    const crRates = this.currentRoomRates();
    if (crRates?.averageRate) return crRates.averageRate;
    return this.currentRoomDetails().rate;
  });

  // New room inventory-based rate
  newRoomRate = computed(() => {
    const rates = this.inventoryRates();
    if (rates?.averageRate) return rates.averageRate;
    const newRoom = this.selectedNewRoom();
    if (!newRoom) return 0;
    return this.getRoomRate(newRoom);
  });

  // New room total (from inventory if available)
  newRoomTotal = computed(() => {
    const rates = this.inventoryRates();
    if (rates?.totalRate) return rates.totalRate;
    return this.newRoomRate() * this.roomNights();
  });

  // Price difference (based on remaining nights if mid-stay)
  priceDifference = computed(() => {
    const newRoom = this.selectedNewRoom();
    if (!newRoom) return 0;

    if (this.isMidStayChange()) {
      const remaining = this.nightsRemaining();
      const oldRate = this.currentRoomDetails().rate;
      const newRate = this.newRoomRate();
      return (remaining * newRate) - (remaining * oldRate);
    }

    return this.newRoomTotal() - this.currentRoomCost();
  });

  // Has restriction issues
  hasRestrictionIssues = computed(() => {
    const issues = this.restrictionIssues();
    return issues !== null && issues.length > 0;
  });

  // Can submit
  canSubmit = computed(() => {
    return this.formValid() &&
      this.selectedNewRoom() !== null &&
      !this.submitting() &&
      !this.hasRestrictionIssues() &&
      !this.loadingRates() &&
      !this.loadingRestrictions();
  });

  // Helper for template
  Math = Math;

  ngOnInit(): void {
    this.loadRoomTypes();
    this.fetchCurrentRoomRates();

    // Listen to form control changes
    this.roomChangeForm.get('newRoom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(room => {
        this.selectedNewRoom.set(room);
      });

    // Track form validity reactively
    this.roomChangeForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formValid.set(this.roomChangeForm.valid);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Current Room Rates ──────────────────────────

  private fetchCurrentRoomRates(): void {
    const storeId = this.data.storeId || this.storeService.getStoreLocally?._id;
    const roomTypeId = this.currentRoomDetails().roomTypeId;
    if (!storeId || !roomTypeId) {
      this.loadingCurrentRates.set(false);
      return;
    }

    const checkInStr = this.formatLocalDate(this.roomCheckIn());
    const checkOutStr = this.formatLocalDate(this.roomCheckOut());
    const currentRoom = this.currentRoom();
    const ratePlanId = currentRoom?.ratePlanId || undefined;

    this.loadingCurrentRates.set(true);
    this.rateInventoryService.getRatesForStay(
      storeId, roomTypeId, checkInStr, checkOutStr, ratePlanId,
    )
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((rates: StayRates | null) => {
        this.currentRoomRates.set(rates);
        this.loadingCurrentRates.set(false);
      });
  }

  // ── Room Types ──────────────────────────────────

  private loadRoomTypes(): void {
    const storeId = this.data.storeId || this.storeService.getStoreLocally?._id;
    if (!storeId) {
      this.loadingRoomTypes.set(false);
      return;
    }

    this.loadingRoomTypes.set(true);
    this.roomsService.getRoomTypes(storeId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.snackBar.open('Failed to load room types', 'Close', { duration: 3000 });
          return of([]);
        }),
      )
      .subscribe((types: RoomType[]) => {
        this.roomTypes.set(types.filter(t => t.active));
        this.loadingRoomTypes.set(false);
      });
  }

  // ── Room Type Changed ──────────────────────────

  onRoomTypeChange(roomTypeId: string): void {
    // Reset downstream selections
    this.roomChangeForm.get('ratePlanId')?.setValue(null);
    this.roomChangeForm.get('newRoom')?.setValue(null);
    this.selectedNewRoom.set(null);
    this.inventoryRates.set(null);
    this.restrictionIssues.set(null);
    this.ratePlans.set([]);
    this.availableRooms.set([]);

    if (!roomTypeId) return;

    // Fetch rate plans + available rooms in parallel
    this.loadRatePlans(roomTypeId);
    this.loadAvailableRooms(roomTypeId);
  }

  // ── Rate Plans ──────────────────────────────────

  private loadRatePlans(roomTypeId: string): void {
    const storeId = this.data.storeId || this.storeService.getStoreLocally?._id;
    if (!storeId) return;

    this.loadingRatePlans.set(true);
    this.rateInventoryService.getRatePlansByRoomType(storeId, roomTypeId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([])),
      )
      .subscribe((plans: RatePlan[]) => {
        this.ratePlans.set(plans.filter(p => p.active));
        this.loadingRatePlans.set(false);
      });
  }

  // ── Rate Plan Changed ──────────────────────────

  onRatePlanChange(ratePlanId: string | null): void {
    const roomTypeId = this.roomChangeForm.get('roomType')?.value;
    if (!roomTypeId) return;

    // Re-fetch inventory rates & restrictions with the new rate plan
    this.fetchInventoryRates(roomTypeId, ratePlanId);
  }

  // ── Available Rooms ────────────────────────────

  private loadAvailableRooms(roomTypeId: string): void {
    const storeId = this.data.storeId || this.storeService.getStoreLocally?._id;
    if (!storeId) return;

    this.loadingRooms.set(true);
    this.roomsService.getAvailableRooms({
      storeId,
      checkInDate: this.data.checkInDate,
      checkOutDate: this.data.checkOutDate,
      roomTypeId,
      excludeReservationId: this.data.reservationId,
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.snackBar.open('Failed to load available rooms', 'Close', { duration: 3000 });
          return of([]);
        }),
      )
      .subscribe((rooms: any[]) => {
        // Filter out current room
        const currentRoomId = this.currentRoom()?.room?._id || this.currentRoom()?.room;
        const filtered = rooms.filter((r: any) => r._id !== currentRoomId);
        this.availableRooms.set(filtered);
        this.loadingRooms.set(false);
      });
  }

  // ── Inventory Rates & Restrictions ─────────────

  private fetchInventoryRates(roomTypeId: string, ratePlanId: string | null): void {
    const storeId = this.data.storeId || this.storeService.getStoreLocally?._id;
    if (!storeId || !roomTypeId) return;

    const checkInStr = this.formatLocalDate(this.roomCheckIn());
    const checkOutStr = this.formatLocalDate(this.roomCheckOut());

    // Extend end for restriction checking (include checkout date for CTD)
    const extendedEnd = new Date(this.roomCheckOut());
    extendedEnd.setDate(extendedEnd.getDate() + 1);
    const extendedEndStr = this.formatLocalDate(extendedEnd);

    this.loadingRates.set(true);
    this.loadingRestrictions.set(true);

    const rates$ = this.rateInventoryService.getRatesForStay(
      storeId, roomTypeId, checkInStr, checkOutStr, ratePlanId || undefined,
    ).pipe(catchError(() => of(null)));

    const inventory$ = this.rateInventoryService.getInventory(
      storeId, roomTypeId, checkInStr, extendedEndStr, ratePlanId || undefined,
    ).pipe(catchError(() => of([])));

    forkJoin({ rates: rates$, inventory: inventory$ })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ rates, inventory }) => {
        // Set inventory rates
        this.inventoryRates.set(rates);
        this.loadingRates.set(false);

        // Validate restrictions
        this.validateRestrictions(inventory as RateInventoryRecord[], checkInStr, checkOutStr);
        this.loadingRestrictions.set(false);
      });
  }

  private validateRestrictions(records: RateInventoryRecord[], checkInStr: string, checkOutStr: string): void {
    const nights = this.roomNights();
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
  }

  // ── Helpers ─────────────────────────────────────

  getRoomRate(room: any): number {
    if (!room) return 0;
    if (room.pricing?.pricePerNight) return room.pricing.pricePerNight;
    if (room.priceOverride != null && typeof room.priceOverride === 'number') return room.priceOverride;
    if (room.room && typeof room.room === 'object') {
      if (room.room.priceOverride != null) return room.room.priceOverride;
      if (room.room.roomType?.basePrice) return room.room.roomType.basePrice;
    }
    if (room.roomType?.basePrice) return room.roomType.basePrice;
    return 0;
  }

  private formatLocalDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getRoomTypeName(roomTypeId: string): string {
    const type = this.roomTypes().find(t => t._id === roomTypeId);
    return type?.name || '';
  }

  // ── Submit ──────────────────────────────────────

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    try {
      this.submitting.set(true);

      const currentRoom = this.currentRoom();
      const newRoom = this.selectedNewRoom();
      const currentRoomData = currentRoom?.room || currentRoom;
      const reason = this.roomChangeForm.get('reason')?.value;
      const ratePlanId = this.roomChangeForm.get('ratePlanId')?.value || null;

      const nightsConsumed = this.nightsConsumed();
      const nightsRemaining = this.nightsRemaining();
      const oldRate = this.currentRoomDetails().rate;
      const newRate = this.newRoomRate();
      const roomIndex = this.data.currentRoomIndex ?? 0;
      const rates = this.inventoryRates();

      // Build result — update only the specific room being changed
      const newRooms = this.data.currentRooms.map((room, index) => {
        if (index === roomIndex) {
          return {
            currentRoomId: room._id || currentRoomData._id,
            room: newRoom._id,
            roomType: this.roomChangeForm.get('roomType')?.value,
            ratePlanId,
            guests: room.guests || { adults: 1, children: 0 },
            currentRoomDetails: {
              roomNumber: currentRoomData.roomNumber,
              name: currentRoomData.name,
              rate: oldRate,
            },
            newRoomDetails: {
              roomNumber: newRoom.roomNumber,
              name: newRoom.name,
              rate: newRate,
              priceOverride: newRoom.priceOverride,
              inventoryRate: rates?.averageRate,
              totalRate: rates?.totalRate,
            },
            priceDifference: this.priceDifference(),
            fromRate: oldRate,
            toRate: newRate,
          };
        }
        return {
          room: room.room?._id || room.room,
          roomType: room.roomType?._id || room.roomType,
          ratePlanId: room.ratePlanId || null,
          guests: room.guests || { adults: 1, children: 0 },
        };
      });

      const nightsInfo = nightsConsumed > 0
        ? ` (${nightsConsumed} night(s) consumed, ${nightsRemaining} night(s) remaining)`
        : '';
      const rateInfo = rates
        ? ` New rate: ${rates.averageRate}/night (total: ${rates.totalRate})`
        : ` New rate: ${newRate}/night`;
      const detailedNote = `Room changed from ${currentRoomData.roomNumber} to ${newRoom.roomNumber}${nightsInfo}.${rateInfo} Reason: ${reason}`;

      const result: RoomChangeResult = {
        mode: 'single',
        currentRoom,
        newRoom,
        newRooms,
        ratePlanId,
        pricingAdjustment: {
          oldTotal: this.currentRoomCost(),
          newTotal: this.newRoomTotal(),
          difference: this.priceDifference(),
          requiresPayment: this.priceDifference() > 0,
          refundAmount: this.priceDifference() < 0 ? Math.abs(this.priceDifference()) : undefined,
          nightsConsumed,
          nightsRemaining,
          perNightRates: rates?.nights,
        },
        reason,
        effectiveDate: this.effectiveDate().toISOString(),
        suggestedInternalNote: detailedNote,
        performedBy: this.authService.currentUserValue?._id || '',
        roomMapping: [{
          fromRoomId: currentRoomData._id,
          fromReservationRoomId: currentRoom._id,
          fromRoomNumber: currentRoomData.roomNumber,
          fromRoomName: currentRoomData.name,
          fromRate: oldRate,
          toRoomId: newRoom._id,
          toRoomNumber: newRoom.roomNumber,
          toRoomName: newRoom.name,
          toRate: newRate,
          toRoomType: this.roomChangeForm.get('roomType')?.value,
          toRatePlanId: ratePlanId,
          priceDifference: this.priceDifference(),
        }],
      };

      this.dialogRef.close(result);
    } catch (error) {
      console.error('Error submitting room change:', error);
      this.snackBar.open('Failed to process room change', 'Close', { duration: 3000 });
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
