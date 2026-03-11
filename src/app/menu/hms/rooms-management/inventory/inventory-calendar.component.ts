import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import {
  RateInventoryService,
  RateInventoryRecord,
  RatePlan,
  AvailabilityCell,
} from '../../../../shared/services/rate-inventory.service';
import { RoomsService } from '../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BulkSetDialogComponent, BulkSetDialogData } from './bulk-set-dialog/bulk-set-dialog.component';
import { RatePlanDialogComponent, RatePlanDialogData } from '../rate-plans/rate-plan-dialog/rate-plan-dialog.component';
import { SyncWarningsDialogComponent, SyncWarningsDialogData } from './sync-warnings-dialog/sync-warnings-dialog.component';
import { ValueOverrideDialogComponent } from '../../channel-management/inventory-rates/value-override-dialog';

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayNum: number;
  isWeekend: boolean;
  isToday: boolean;
}

interface RoomTypeWithPlans {
  _id: string;
  name: string;
  basePrice: number;
  totalRooms: number;
  ratePlans: RatePlan[];
  [key: string]: any;
}

@Component({
  selector: 'app-inventory-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory-calendar.component.html',
  styleUrl: './inventory-calendar.component.scss',
})
export class InventoryCalendarComponent implements OnInit {
  private rateInventoryService = inject(RateInventoryService);
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // View state
  viewStartDate = signal<Date>(new Date());
  daysToShow = signal<number>(14);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  syncing = signal<boolean>(false);
  fullSyncing = signal<boolean>(false);
  fullSyncProgress = signal<string>('');

  // Data
  roomTypes = signal<RoomTypeWithPlans[]>([]);

  // Pending local changes (not yet saved to backend)
  // key: `${roomTypeId}::${ratePlanId}::${dateStr}` for rate changes
  // key: `avail::${roomTypeId}::${dateStr}` for availability changes
  pendingChanges = signal<Map<string, any>>(new Map());

  // Separate tracker for Channex sync — survives save, only clears after Channex sync
  channexPendingChanges = signal<Map<string, any>>(new Map());

  hasUnsavedChanges = computed(() => this.pendingChanges().size > 0);
  hasChannexPendingChanges = computed(() => this.channexPendingChanges().size > 0);
  // grid[roomTypeId][ratePlanId][dateStr] = record
  // grid[roomTypeId]['_availability'][dateStr] = { availability, restrictions }
  inventoryGrid = signal<Record<string, Record<string, Record<string, any>>>>({});

  private storeId = computed(() => this.storeStore.selectedStore()?._id);

  storeCurrency = computed(() => {
    const store = this.storeStore.selectedStore();
    return this.getCurrencyCode(store?.currencyCode || store?.currency || 'NGN');
  });

  isChannexConnected = computed(() => {
    const store = this.storeStore.selectedStore();
    return !!store?.channex?.propertyId;
  });

  // Calendar days for the header
  calendarDays = computed<CalendarDay[]>(() => {
    const start = this.viewStartDate();
    const count = this.daysToShow();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: CalendarDay[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dateStr: this.formatDateLocal(d),
        dayOfWeek: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: d.getTime() === today.getTime(),
      });
    }
    return days;
  });

  // Month label for the header
  monthLabel = computed(() => {
    const days = this.calendarDays();
    if (days.length === 0) return '';
    const first = days[0].date;
    const last = days[days.length - 1].date;
    const opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (first.getMonth() === last.getMonth()) {
      return first.toLocaleDateString('en-US', opts);
    }
    return `${first.toLocaleDateString('en-US', { month: 'short' })} – ${last.toLocaleDateString('en-US', opts)}`;
  });

  ngOnInit(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.viewStartDate.set(today);
    this.loadData();
  }

  loadData(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.loading.set(true);
    const startDate = this.viewStartDate();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + this.daysToShow());

    this.rateInventoryService
      .getInventoryGrid(storeId, this.formatDateLocal(startDate), this.formatDateLocal(endDate))
      .subscribe({
        next: (result) => {
          // Ensure every room type has a ratePlans array (backend may not include it)
          const normalizedRoomTypes = (result.roomTypes || []).map((rt: any) => ({
            ...rt,
            ratePlans: rt.ratePlans || [],
          }));
          this.roomTypes.set(normalizedRoomTypes);
          this.inventoryGrid.set(result.grid || {});
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to load inventory', 'Close', { duration: 5000 });
          this.loading.set(false);
        },
      });
  }

  // ─── Navigation ───

  navigatePrev(): void {
    const d = new Date(this.viewStartDate());
    d.setDate(d.getDate() - this.daysToShow());
    this.viewStartDate.set(d);
    this.loadData();
  }

  navigateNext(): void {
    const d = new Date(this.viewStartDate());
    d.setDate(d.getDate() + this.daysToShow());
    this.viewStartDate.set(d);
    this.loadData();
  }

  navigateToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.viewStartDate.set(today);
    this.loadData();
  }

  setDaysToShow(days: number): void {
    this.daysToShow.set(days);
    this.loadData();
  }

  // ─── Availability Helpers ───

  getAvailability(roomTypeId: string, dateStr: string): number | null {
    const grid = this.inventoryGrid();
    const cell = grid[roomTypeId]?.['_availability']?.[dateStr] as AvailabilityCell | undefined;
    return cell?.availability ?? null;
  }

  isStopSell(roomTypeId: string, dateStr: string): boolean {
    const grid = this.inventoryGrid();
    const cell = grid[roomTypeId]?.['_availability']?.[dateStr] as AvailabilityCell | undefined;
    return cell?.restrictions?.stopSell ?? false;
  }

  // ─── Rate Helpers ───

  getRateForPlan(roomTypeId: string, ratePlanId: string, dateStr: string): RateInventoryRecord | null {
    const grid = this.inventoryGrid();
    return (grid[roomTypeId]?.[ratePlanId]?.[dateStr] as RateInventoryRecord) || null;
  }

  getCellRate(roomTypeId: string, ratePlanId: string, dateStr: string): number | null {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    return record?.rate ?? null;
  }

  getCellOtaRate(roomTypeId: string, ratePlanId: string, dateStr: string): number | null {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    return record?.otaRate ?? null;
  }

  getCellSource(roomTypeId: string, ratePlanId: string, dateStr: string): string {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    return record?.source || '';
  }

  hasRateForPlan(roomTypeId: string, ratePlanId: string, dateStr: string): boolean {
    return this.getCellRate(roomTypeId, ratePlanId, dateStr) !== null;
  }

  // ─── Rate Plan Restriction Helpers ───

  isRatePlanStopSell(roomTypeId: string, ratePlanId: string, dateStr: string): boolean {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    return record?.restrictions?.stopSell ?? this.isStopSell(roomTypeId, dateStr);
  }

  isRatePlanCTA(roomTypeId: string, ratePlanId: string, dateStr: string): boolean {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    return record?.restrictions?.closedToArrival ?? false;
  }

  isRatePlanCTD(roomTypeId: string, ratePlanId: string, dateStr: string): boolean {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    return record?.restrictions?.closedToDeparture ?? false;
  }

  getCellMinStay(roomTypeId: string, ratePlanId: string, dateStr: string): number | null {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    const val = record?.restrictions?.minStay;
    return (val && val > 1) ? val : null;
  }

  getCellMaxStay(roomTypeId: string, ratePlanId: string, dateStr: string): number | null {
    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    const val = record?.restrictions?.maxStay;
    return (val && val < 365) ? val : null;
  }

  /** Deep clone the entire grid to ensure signal change detection triggers */
  private deepCloneGrid(): Record<string, Record<string, Record<string, any>>> {
    const src = this.inventoryGrid();
    const clone: Record<string, Record<string, Record<string, any>>> = {};
    for (const rtId of Object.keys(src)) {
      clone[rtId] = {};
      for (const planId of Object.keys(src[rtId])) {
        clone[rtId][planId] = {};
        for (const dateStr of Object.keys(src[rtId][planId])) {
          const val = src[rtId][planId][dateStr];
          clone[rtId][planId][dateStr] = val && typeof val === 'object'
            ? { ...val, restrictions: val.restrictions ? { ...val.restrictions } : undefined }
            : val;
        }
      }
    }
    return clone;
  }

  // ─── Value Override Dialog (Availability) ───

  openAvailabilityOverride(roomTypeId: string, dateStr: string): void {
    const rt = this.roomTypes().find((r) => r._id === roomTypeId);
    if (!rt) return;

    const grid = this.inventoryGrid();
    const availCell = grid[roomTypeId]?.['_availability']?.[dateStr] as AvailabilityCell | undefined;
    const availability = availCell?.availability ?? null;
    const date = new Date(dateStr + 'T00:00:00');

    const dialogRef = this.dialog.open(ValueOverrideDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        roomTypeName: rt.name,
        startDate: date,
        endDate: date,
        currentValue: availability,
        restrictionType: 'availability',
        isAvailabilityOnly: false,
        ariAvailability: availability,
        ariRate: null,
        ariOtaRate: null,
        ariMinStay: availCell?.restrictions?.minStay ?? null,
        ariMaxStay: availCell?.restrictions?.maxStay ?? null,
        ariClosedToArrival: availCell?.restrictions?.closedToArrival ?? false,
        ariClosedToDeparture: availCell?.restrictions?.closedToDeparture ?? false,
        ariStopSell: availCell?.restrictions?.stopSell ?? false,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);
        const dates = this.generateDateRangeArray(startDate, endDate);
        const clonedGrid = this.deepCloneGrid();
        const changes = new Map(this.pendingChanges());
        const channexChanges = new Map(this.channexPendingChanges());

        dates.forEach((d) => {
          const ds = this.formatDateLocal(d);
          if (!clonedGrid[roomTypeId]) clonedGrid[roomTypeId] = {};
          if (!clonedGrid[roomTypeId]['_availability']) clonedGrid[roomTypeId]['_availability'] = {};
          const existing = clonedGrid[roomTypeId]['_availability'][ds] as AvailabilityCell | undefined;
          const updatedRestrictions = { ...(existing?.restrictions || {}) };

          let changeEntry: any;

          // Update based on restriction type from dialog
          switch (result.restrictionType) {
            case 'availability':
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: result.value,
                restrictions: updatedRestrictions,
              };
              changeEntry = { roomTypeId, dateStr: ds, availability: result.value };
              break;
            case 'stop-sell':
              updatedRestrictions.stopSell = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changeEntry = { roomTypeId, dateStr: ds, availability: existing?.availability ?? 0, stopSell: result.value };
              break;
            case 'cta':
              updatedRestrictions.closedToArrival = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changeEntry = { roomTypeId, dateStr: ds, closedToArrival: result.value };
              break;
            case 'ctd':
              updatedRestrictions.closedToDeparture = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changeEntry = { roomTypeId, dateStr: ds, closedToDeparture: result.value };
              break;
            case 'min-stay':
              updatedRestrictions.minStay = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changeEntry = { roomTypeId, dateStr: ds, minStay: result.value };
              break;
            case 'max-stay':
              updatedRestrictions.maxStay = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changeEntry = { roomTypeId, dateStr: ds, maxStay: result.value };
              break;
          }

          if (changeEntry) {
            const key = `avail::${roomTypeId}::${ds}`;
            changes.set(key, changeEntry);
            // Merge into Channex pending (preserves fields from prior edits)
            const existingChannex = channexChanges.get(key) || { roomTypeId, dateStr: ds };
            channexChanges.set(key, { ...existingChannex, ...changeEntry });
          }
        });

        this.inventoryGrid.set(clonedGrid);
        this.pendingChanges.set(changes);
        this.channexPendingChanges.set(channexChanges);
      }
    });
  }

  // ─── Value Override Dialog (Rate Plan) ───

  openRatePlanOverride(roomTypeId: string, ratePlanId: string, dateStr: string, restrictionType?: string): void {
    const rt = this.roomTypes().find((r) => r._id === roomTypeId);
    const rp = rt?.ratePlans.find((p) => p._id === ratePlanId);
    if (!rt || !rp) return;

    const record = this.getRateForPlan(roomTypeId, ratePlanId, dateStr);
    const availability = this.getAvailability(roomTypeId, dateStr);
    const date = new Date(dateStr + 'T00:00:00');

    const dialogRef = this.dialog.open(ValueOverrideDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        roomTypeName: rt.name,
        ratePlanName: rp.name,
        startDate: date,
        endDate: date,
        currentValue: record?.rate ?? null,
        currentToggleValue: record?.restrictions?.stopSell ?? false,
        restrictionType: restrictionType || 'rate',
        isAvailabilityOnly: false,
        ariRate: record?.rate ?? null,
        ariOtaRate: record?.otaRate ?? null,
        ariAvailability: availability,
        ariMinStay: record?.restrictions?.minStay ?? null,
        ariMaxStay: record?.restrictions?.maxStay ?? null,
        ariClosedToArrival: record?.restrictions?.closedToArrival ?? false,
        ariClosedToDeparture: record?.restrictions?.closedToDeparture ?? false,
        ariStopSell: record?.restrictions?.stopSell ?? false,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);
        const dates = this.generateDateRangeArray(startDate, endDate);
        const clonedGrid = this.deepCloneGrid();
        const changes = new Map(this.pendingChanges());
        const channexChanges = new Map(this.channexPendingChanges());

        dates.forEach((d) => {
          const ds = this.formatDateLocal(d);
          if (!clonedGrid[roomTypeId]) clonedGrid[roomTypeId] = {};
          if (!clonedGrid[roomTypeId][ratePlanId]) clonedGrid[roomTypeId][ratePlanId] = {};

          const existing = (clonedGrid[roomTypeId][ratePlanId][ds] as RateInventoryRecord) || {} as any;
          const updated: any = {
            ...existing,
            restrictions: existing.restrictions ? { ...existing.restrictions } : {},
          };

          switch (result.restrictionType) {
            case 'rate':
              updated.rate = result.value;
              if (result.otaRateValue !== undefined && result.otaRateValue !== null) {
                updated.otaRate = result.otaRateValue;
              }
              break;
            case 'min-stay':
              updated.restrictions.minStay = result.value;
              break;
            case 'max-stay':
              updated.restrictions.maxStay = result.value;
              break;
            case 'cta':
              updated.restrictions.closedToArrival = result.value;
              break;
            case 'ctd':
              updated.restrictions.closedToDeparture = result.value;
              break;
            case 'stop-sell':
              updated.restrictions.stopSell = result.value;
              // Also update the availability row's stop sell
              if (!clonedGrid[roomTypeId]['_availability']) clonedGrid[roomTypeId]['_availability'] = {};
              const existingAvail = clonedGrid[roomTypeId]['_availability'][ds] as AvailabilityCell | undefined;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existingAvail?.availability ?? 0,
                restrictions: { ...(existingAvail?.restrictions || {}), stopSell: result.value },
              };
              break;
          }

          clonedGrid[roomTypeId][ratePlanId][ds] = updated;
          const key = `${roomTypeId}::${ratePlanId}::${ds}`;
          const existingChange = changes.get(key) || { roomTypeId, ratePlanId, dateStr: ds };

          // Merge with existing pending change for this cell
          switch (result.restrictionType) {
            case 'rate':
              existingChange.rate = result.value;
              if (result.otaRateValue !== undefined && result.otaRateValue !== null) {
                existingChange.otaRate = result.otaRateValue;
              }
              break;
            case 'min-stay':
              existingChange.minStay = result.value;
              break;
            case 'max-stay':
              existingChange.maxStay = result.value;
              break;
            case 'cta':
              existingChange.closedToArrival = result.value;
              break;
            case 'ctd':
              existingChange.closedToDeparture = result.value;
              break;
            case 'stop-sell':
              existingChange.stopSell = result.value;
              break;
          }

          changes.set(key, existingChange);

          // Also track for Channex sync (survives save)
          const existingChannexChange = channexChanges.get(key) || { roomTypeId, ratePlanId, dateStr: ds };
          Object.assign(existingChannexChange, existingChange);
          channexChanges.set(key, existingChannexChange);
        });

        this.inventoryGrid.set(clonedGrid);
        this.pendingChanges.set(changes);
        this.channexPendingChanges.set(channexChanges);
      }
    });
  }

  // ─── Check if a cell has pending changes ───

  hasPendingChange(roomTypeId: string, ratePlanId: string, dateStr: string): boolean {
    return this.pendingChanges().has(`${roomTypeId}::${ratePlanId}::${dateStr}`);
  }

  hasPendingAvailChange(roomTypeId: string, dateStr: string): boolean {
    return this.pendingChanges().has(`avail::${roomTypeId}::${dateStr}`);
  }

  // ─── Save All Changes ───

  saveAllChanges(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const changes = this.pendingChanges();
    if (changes.size === 0) return;

    this.saving.set(true);
    const calls: any[] = [];

    changes.forEach((change, key) => {
      if (key.startsWith('avail::')) {
        // Availability change — read current grid restrictions and merge with changes
        const grid = this.inventoryGrid();
        const availCell = grid[change.roomTypeId]?.['_availability']?.[change.dateStr] as AvailabilityCell | undefined;
        const currentRestrictions: any = availCell?.restrictions || {};

        const restrictions: any = {
          minStay: change.minStay ?? currentRestrictions.minStay ?? 1,
          maxStay: change.maxStay ?? currentRestrictions.maxStay ?? 365,
          closedToArrival: change.closedToArrival ?? currentRestrictions.closedToArrival ?? false,
          closedToDeparture: change.closedToDeparture ?? currentRestrictions.closedToDeparture ?? false,
          stopSell: change.stopSell ?? currentRestrictions.stopSell ?? false,
        };

        const payload: any = {
          date: change.dateStr,
          availability: change.availability ?? availCell?.availability ?? 0,
          restrictions,
        };

        calls.push(
          this.rateInventoryService.setInventory(storeId, change.roomTypeId, payload),
        );
      } else {
        // Rate plan change — read current grid record restrictions and merge
        const grid = this.inventoryGrid();
        const record = grid[change.roomTypeId]?.[change.ratePlanId]?.[change.dateStr] as RateInventoryRecord | undefined;
        const currentRestrictions: any = record?.restrictions || {};

        const restrictions: any = {
          minStay: change.minStay ?? currentRestrictions.minStay ?? 1,
          maxStay: change.maxStay ?? currentRestrictions.maxStay ?? 365,
          closedToArrival: change.closedToArrival ?? currentRestrictions.closedToArrival ?? false,
          closedToDeparture: change.closedToDeparture ?? currentRestrictions.closedToDeparture ?? false,
          stopSell: change.stopSell ?? currentRestrictions.stopSell ?? false,
        };

        const payload: any = {
          date: change.dateStr,
          ratePlanId: change.ratePlanId,
          restrictions,
        };
        if (change.rate !== undefined) payload.rate = change.rate;
        if (change.otaRate !== undefined) payload.otaRate = change.otaRate;

        calls.push(
          this.rateInventoryService.setInventory(storeId, change.roomTypeId, payload),
        );
      }
    });

    if (calls.length === 0) {
      this.saving.set(false);
      return;
    }

    forkJoin(calls).subscribe({
      next: () => {
        this.saving.set(false);
        this.pendingChanges.set(new Map());
        this.snackBar.open(`Saved ${calls.length} change(s) successfully`, 'Close', { duration: 4000 });
        this.loadData(); // Reload to get fresh data
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Some changes failed to save', 'Close', { duration: 5000 });
      },
    });
  }

  // ─── Discard All Changes ───

  discardChanges(): void {
    this.pendingChanges.set(new Map());
    this.channexPendingChanges.set(new Map());
    this.loadData(); // Reload original data
  }

  // ─── Generate date range array ───

  private generateDateRangeArray(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // ─── Bulk Set Dialog ───

  openBulkSetDialog(roomType?: RoomTypeWithPlans, ratePlan?: RatePlan): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const dialogData: BulkSetDialogData = {
      storeId,
      roomTypes: this.roomTypes(),
      selectedRoomTypeId: roomType?._id || null,
      selectedRatePlanId: ratePlan?._id || null,
      storeCurrency: this.storeCurrency(),
      channexConnected: this.isChannexConnected(),
    };

    this.dialog
      .open(BulkSetDialogComponent, { data: dialogData, width: '550px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          const total = (result.modifiedCount || 0) + (result.upsertedCount || 0);
          this.snackBar.open(
            `Updated ${total} inventory records`,
            'Close',
            { duration: 4000 },
          );
          this.loadData();
        }
      });
  }

  // ─── Create Rate Plan ───

  openCreateRatePlanDialog(roomType: RoomTypeWithPlans): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const dialogData: RatePlanDialogData = {
      storeId,
      roomTypes: this.roomTypes(),
      storeCurrency: this.storeCurrency(),
      selectedRoomTypeId: roomType._id,
    };

    this.dialog
      .open(RatePlanDialogComponent, { data: dialogData, width: '700px', disableClose: true })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(`Rate plan "${result.name}" created`, 'Close', { duration: 4000 });
          this.loadData();
        }
      });
  }

  // ─── Channex Sync (Change-Based — only send what actually changed) ───

  syncToChannex(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const store = this.storeStore.selectedStore();
    const propertyId = store?.channex?.propertyId;
    if (!propertyId) {
      this.snackBar.open('Store is not synced with Channex', 'Close', { duration: 5000 });
      return;
    }

    const changes = this.channexPendingChanges();
    if (changes.size === 0) {
      this.snackBar.open('No changes to sync — make edits first', 'Close', { duration: 5000 });
      return;
    }

    this.syncing.set(true);

    const roomTypes = this.roomTypes();
    const grid = this.inventoryGrid();

    // Build Channex ID lookup maps
    const roomTypeChannexMap = new Map<string, string>();
    const ratePlanChannexMap = new Map<string, string>();
    for (const rt of roomTypes) {
      if (rt['channexRoomTypeId']) roomTypeChannexMap.set(rt._id, rt['channexRoomTypeId']);
      for (const rp of rt.ratePlans || []) {
        if (rp.channex?.ratePlanId) ratePlanChannexMap.set(rp._id, rp.channex.ratePlanId);
      }
    }

    const restrictionValues: any[] = [];
    const availabilityValues: any[] = [];

    changes.forEach((change, key) => {
      if (key.startsWith('avail::')) {
        // ── Availability change ──
        const channexRoomTypeId = roomTypeChannexMap.get(change.roomTypeId);
        if (!channexRoomTypeId) return;

        // Only send availability if it was explicitly changed
        if (change.availability !== undefined) {
          availabilityValues.push({
            propertyId,
            roomTypeId: channexRoomTypeId,
            date: change.dateStr,
            availability: Math.max(0, change.availability),
          });
        }
      } else {
        // ── Rate plan restriction change ──
        const channexRatePlanId = ratePlanChannexMap.get(change.ratePlanId);
        if (!channexRatePlanId) return;

        // Build a restriction entry with ONLY the fields that changed
        const restriction: any = {
          propertyId,
          ratePlanId: channexRatePlanId,
          date: change.dateStr,
        };

        let hasField = false;

        if (change.rate !== undefined) {
          restriction.rate = String(Number(change.rate).toFixed(2));
          hasField = true;
        }
        if (change.otaRate !== undefined) {
          // OTA rate overrides PMS rate for Channex
          restriction.rate = String(Number(change.otaRate).toFixed(2));
          hasField = true;
        }
        if (change.minStay !== undefined) {
          restriction.minStayArrival = change.minStay;
          hasField = true;
        }
        if (change.maxStay !== undefined) {
          restriction.maxStay = change.maxStay;
          hasField = true;
        }
        if (change.closedToArrival !== undefined) {
          restriction.closedToArrival = change.closedToArrival;
          hasField = true;
        }
        if (change.closedToDeparture !== undefined) {
          restriction.closedToDeparture = change.closedToDeparture;
          hasField = true;
        }
        if (change.stopSell !== undefined) {
          restriction.stopSell = change.stopSell;
          hasField = true;
        }

        if (hasField) {
          restrictionValues.push(restriction);
        }
      }
    });

    console.log('Change-based restrictions to sync:', restrictionValues);
    console.log('Change-based availability to sync:', availabilityValues);

    if (restrictionValues.length === 0 && availabilityValues.length === 0) {
      this.syncing.set(false);
      this.snackBar.open('No Channex-eligible changes to sync', 'Close', { duration: 5000 });
      return;
    }

    // POST only the changed values to Channex
    const restrictionsCall$ = restrictionValues.length > 0
      ? this.http.post<any>(`${this.baseUrl}/admin/channex/stores/${storeId}/restrictions`, {
          values: restrictionValues,
        })
      : of({ success: true, warnings: [] });

    const availabilityCall$ = availabilityValues.length > 0
      ? this.http.post<any>(`${this.baseUrl}/admin/channex/stores/${storeId}/availability`, {
          values: availabilityValues,
        })
      : of({ success: true, warnings: [] });

    forkJoin([restrictionsCall$, availabilityCall$]).subscribe({
      next: ([restrictionsResp, availabilityResp]: any[]) => {
        this.syncing.set(false);

        const allWarnings: any[] = [
          ...(restrictionsResp?.warnings || []),
          ...(availabilityResp?.warnings || []),
        ];

        const result = {
          availabilityCount: availabilityValues.length,
          restrictionsCount: restrictionValues.length,
          warnings: allWarnings,
        };

        const msg = `Synced to Channex: ${result.availabilityCount} availability, ${result.restrictionsCount} rate records`;

        if (allWarnings.length > 0) {
          this.snackBar.open(`${msg} — ${allWarnings.length} warning(s)`, 'View', { duration: 8000 })
            .onAction()
            .subscribe(() => this.showSyncWarnings(result));
          this.showSyncWarnings(result);
        } else {
          this.snackBar.open(msg, 'Close', { duration: 6000 });
        }

        // Clear Channex pending changes after successful sync
        this.channexPendingChanges.set(new Map());
      },
      error: (err) => {
        this.syncing.set(false);
        const errorMsg = err.error?.message || err.message || 'Sync failed';
        this.snackBar.open(`Channex sync failed: ${errorMsg}`, 'Close', { duration: 6000 });
      },
    });
  }

  // ─── Channex Full Sync (500 days — Certification Only, TEMPORARY) ───

  fullSyncToChannex(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const store = this.storeStore.selectedStore();
    const propertyId = store?.channex?.propertyId;
    if (!propertyId) {
      this.snackBar.open('Store is not connected to Channex', 'Close', { duration: 5000 });
      return;
    }

    const roomTypes = this.roomTypes();
    if (roomTypes.length === 0) {
      this.snackBar.open('No room types found', 'Close', { duration: 5000 });
      return;
    }

    // Validate all room types have Channex IDs
    const missingRoomTypes = roomTypes.filter((rt) => !rt['channexRoomTypeId']);
    if (missingRoomTypes.length > 0) {
      this.snackBar.open(`${missingRoomTypes.length} room type(s) missing Channex mapping`, 'Close', { duration: 6000 });
      return;
    }

    const allRatePlans = roomTypes.flatMap((rt) => (rt.ratePlans || []).map((rp) => ({ rt, rp })));
    const missingRatePlans = allRatePlans.filter((x) => !x.rp.channex?.ratePlanId);
    if (missingRatePlans.length > 0) {
      this.snackBar.open(`${missingRatePlans.length} rate plan(s) missing Channex mapping`, 'Close', { duration: 6000 });
      return;
    }

    this.fullSyncing.set(true);
    this.fullSyncProgress.set('Generating…');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = this.buildDateSeries(today, 500);
    if (dates.length !== 500) {
      this.fullSyncing.set(false);
      this.fullSyncProgress.set('');
      this.snackBar.open(`Expected 500 days but generated ${dates.length}`, 'Close', { duration: 6000 });
      return;
    }

    // ── Build availability values (all room types × 500 days) ──
    const availabilityValues: any[] = [];

    for (const rt of roomTypes) {
      const channexRoomTypeId = rt['channexRoomTypeId'];
      if (!channexRoomTypeId) continue;

      const totalRooms = rt.totalRooms || 10;

      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        const dateStr = this.formatDateLocal(d);
        const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
        const month = d.getMonth();

        const availability = this.genAvailability(totalRooms, i, isWeekend, month);

        availabilityValues.push({
          propertyId,
          roomTypeId: channexRoomTypeId,
          date: dateStr,
          availability: Math.max(0, availability),
        });
      }
    }

    // ── Build restriction values (all rate plans × 500 days) ──
    const restrictionValues: any[] = [];

    // Respect Channex property max_price — stay safely under the limit
    const propertyMaxPrice = (store as any)?.channex?.maxPrice || 49999;
    const maxRate = Math.max(1, propertyMaxPrice - 1); // 1 unit below the limit

    for (const rt of roomTypes) {
      for (const rp of rt.ratePlans || []) {
        const channexRatePlanId = rp.channex?.ratePlanId;
        if (!channexRatePlanId) continue;

        const baseRate = rp.otaBaseRate || rp.baseRate || rt.basePrice || 100;

        for (let i = 0; i < dates.length; i++) {
          const d = dates[i];
          const dateStr = this.formatDateLocal(d);
          const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
          const month = d.getMonth();
          const dayOfWeek = d.getDay();

          const gen = this.genRate(baseRate, i, isWeekend, month, dayOfWeek, maxRate);

          restrictionValues.push({
            propertyId,
            ratePlanId: channexRatePlanId,
            date: dateStr,
            rate: String(Number(gen.rate).toFixed(2)),
            minStayArrival: gen.minStay,
            maxStay: gen.maxStay,
            closedToArrival: gen.closedToArrival,
            closedToDeparture: gen.closedToDeparture,
            stopSell: i === 0 ? true : gen.stopSell, // today always stop-sell
          });
        }
      }
    }

    this.fullSyncProgress.set(`Sending ${availabilityValues.length} avail + ${restrictionValues.length} rates…`);

    console.log(`[Full Sync] ${availabilityValues.length} availability, ${restrictionValues.length} restrictions`);

    // ── Exactly 2 API calls ──
    const availCall$ = this.http.post<any>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/availability`,
      { values: availabilityValues },
    );
    const restrictCall$ = this.http.post<any>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/restrictions`,
      { values: restrictionValues },
    );

    forkJoin([availCall$, restrictCall$]).subscribe({
      next: ([availResp, restrictResp]: any[]) => {
        this.fullSyncing.set(false);
        this.fullSyncProgress.set('');

        const availTaskId = this.extractTaskId(availResp);
        const restrictTaskId = this.extractTaskId(restrictResp);

        console.log('=== CHANNEX FULL SYNC RESULTS ===');
        console.log('Availability Task ID:', availTaskId);
        console.log('Restrictions Task ID:', restrictTaskId);
        console.log('Availability Response:', JSON.stringify(availResp, null, 2));
        console.log('Restrictions Response:', JSON.stringify(restrictResp, null, 2));

        // Collect any warnings from both responses
        const allWarnings: any[] = [
          ...(availResp?.warnings || []),
          ...(restrictResp?.warnings || []),
        ];

        // Show dialog with copyable task IDs
        this.dialog.open(SyncWarningsDialogComponent, {
          width: '650px',
          maxHeight: '80vh',
          data: {
            availabilityCount: availabilityValues.length,
            restrictionsCount: restrictionValues.length,
            warnings: allWarnings,
            fullSyncResult: true,
            availabilityTaskId: availTaskId,
            restrictionsTaskId: restrictTaskId,
            availabilityResponse: availResp,
            restrictionsResponse: restrictResp,
          } as SyncWarningsDialogData,
        });
      },
      error: (err) => {
        this.fullSyncing.set(false);
        this.fullSyncProgress.set('');
        const errorMsg = err.error?.message || err.message || 'Full sync failed';
        console.error('Full Sync Error:', err);
        this.snackBar.open(`Full sync failed: ${errorMsg}`, 'Close', { duration: 8000 });
      },
    });
  }

  /** Seeded pseudo-random for reproducible but varied data */
  private seededRand(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }

  /** Generate realistic availability for a given day */
  private genAvailability(totalRooms: number, dayOffset: number, isWeekend: boolean, month: number): number {
    // High season (Jul/Aug/Dec) → higher occupancy → less availability
    let occupancy: number;
    if ([11, 6, 7].includes(month)) {
      occupancy = 0.75;
    } else if ([0, 1, 8].includes(month)) {
      occupancy = 0.35;
    } else {
      occupancy = 0.55;
    }
    if (isWeekend) occupancy += 0.15;
    const variation = (this.seededRand(dayOffset * 7 + month) - 0.5) * 0.30;
    occupancy = Math.min(0.95, Math.max(0.1, occupancy + variation));
    return Math.max(0, Math.min(totalRooms, Math.round(totalRooms * (1 - occupancy))));
  }

  /** Generate realistic rate & restrictions for a given day */
  private genRate(
    baseRate: number, dayOffset: number, isWeekend: boolean, month: number, dayOfWeek: number,
    maxRate: number = 49999,
  ): { rate: number; minStay: number; maxStay: number; closedToArrival: boolean; closedToDeparture: boolean; stopSell: boolean } {
    // Seasonal multiplier
    let season = 1.0;
    if ([11, 6, 7].includes(month)) season = 1.35;
    else if ([0, 1, 8].includes(month)) season = 0.85;
    else if ([3, 4, 9, 10].includes(month)) season = 1.10;

    const weekend = isWeekend ? 1.20 : 1.0;
    const daily = 1.0 + (this.seededRand(dayOffset * 13 + month * 3) - 0.5) * 0.20;
    const urgency = dayOffset < 7 ? 1.10 : dayOffset < 30 ? 1.05 : 1.0;

    // Cap rate at property max price to avoid Channex "Too high rate" warnings
    const rate = Math.min(maxRate, Math.max(1, Math.round(baseRate * season * weekend * daily * urgency)));

    let minStay = 1;
    if (isWeekend && [11, 6, 7].includes(month)) minStay = 3;
    else if (isWeekend) minStay = 2;

    const maxStay = [11, 6, 7].includes(month) ? 14 : 30;
    const closedToArrival = dayOfWeek === 0 && [11, 6, 7].includes(month) && this.seededRand(dayOffset * 17) > 0.7;
    const closedToDeparture = dayOfWeek === 5 && this.seededRand(dayOffset * 23) > 0.85;
    const stopSell = [0, 1, 8].includes(month) && this.seededRand(dayOffset * 31) > 0.97;

    return { rate, minStay, maxStay, closedToArrival, closedToDeparture, stopSell };
  }

  /** Extract task ID from backend response (which wraps the Channex response) */
  private extractTaskId(response: any): string | null {
    // Backend now returns taskId directly
    if (response?.taskId) return response.taskId;

    // Fallback: try to extract from the raw Channex response nested inside
    const channex = response?.channexResponse;
    if (channex?.data?.id) return channex.data.id;
    if (channex?.data?.[0]?.id) return channex.data[0].id;
    if (Array.isArray(channex?.data)) {
      const task = channex.data.find((d: any) => d.type === 'task');
      if (task?.id) return task.id;
    }

    // Legacy fallbacks
    if (response?.data?.[0]?.id) return response.data[0].id;
    if (response?.result?.data?.[0]?.id) return response.result.data[0].id;
    return null;
  }

  private showSyncWarnings(result: { availabilityCount: number; restrictionsCount: number; warnings: any[] }): void {
    this.dialog.open(SyncWarningsDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: {
        availabilityCount: result.availabilityCount,
        restrictionsCount: result.restrictionsCount,
        warnings: result.warnings,
      } as SyncWarningsDialogData,
    });
  }

  // ─── Utility ───

  getSourceIcon(source: string): string {
    switch (source) {
      case 'channex': return 'cloud_sync';
      case 'rate_plan': return 'auto_fix_high';
      case 'bulk': return 'content_copy';
      case 'manual': return 'edit';
      default: return '';
    }
  }

  /**
   * Format a Date as YYYY-MM-DD using local time (not UTC).
   * toISOString() converts to UTC which shifts the date back by one day
   * in timezones ahead of UTC (e.g. WAT+1, EAT+3).
   */
  private formatDateLocal(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCurrencyCode(symbol: string): string {
    const map: Record<string, string> = {
      '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
      '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '₱': 'PHP', '฿': 'THB',
    };
    return map[symbol] || symbol;
  }

  /** Build an exact-length date series (local time, midnight) */
  private buildDateSeries(start: Date, count: number): Date[] {
    const dates: Date[] = [];
    const base = new Date(start);
    base.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }

    return dates;
  }
}
