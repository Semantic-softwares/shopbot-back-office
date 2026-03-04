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

  // Data
  roomTypes = signal<RoomTypeWithPlans[]>([]);

  // Pending local changes (not yet saved to backend)
  // key: `${roomTypeId}::${ratePlanId}::${dateStr}` for rate changes
  // key: `avail::${roomTypeId}::${dateStr}` for availability changes
  pendingChanges = signal<Map<string, any>>(new Map());

  hasUnsavedChanges = computed(() => this.pendingChanges().size > 0);
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

        dates.forEach((d) => {
          const ds = this.formatDateLocal(d);
          if (!clonedGrid[roomTypeId]) clonedGrid[roomTypeId] = {};
          if (!clonedGrid[roomTypeId]['_availability']) clonedGrid[roomTypeId]['_availability'] = {};
          const existing = clonedGrid[roomTypeId]['_availability'][ds] as AvailabilityCell | undefined;
          const updatedRestrictions = { ...(existing?.restrictions || {}) };

          // Update based on restriction type from dialog
          switch (result.restrictionType) {
            case 'availability':
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: result.value,
                restrictions: updatedRestrictions,
              };
              changes.set(`avail::${roomTypeId}::${ds}`, {
                roomTypeId,
                dateStr: ds,
                availability: result.value,
              });
              break;
            case 'stop-sell':
              updatedRestrictions.stopSell = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changes.set(`avail::${roomTypeId}::${ds}`, {
                roomTypeId,
                dateStr: ds,
                availability: existing?.availability ?? 0,
                stopSell: result.value,
              });
              break;
            case 'cta':
              updatedRestrictions.closedToArrival = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changes.set(`avail::${roomTypeId}::${ds}`, {
                roomTypeId,
                dateStr: ds,
                closedToArrival: result.value,
              });
              break;
            case 'ctd':
              updatedRestrictions.closedToDeparture = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changes.set(`avail::${roomTypeId}::${ds}`, {
                roomTypeId,
                dateStr: ds,
                closedToDeparture: result.value,
              });
              break;
            case 'min-stay':
              updatedRestrictions.minStay = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changes.set(`avail::${roomTypeId}::${ds}`, {
                roomTypeId,
                dateStr: ds,
                minStay: result.value,
              });
              break;
            case 'max-stay':
              updatedRestrictions.maxStay = result.value;
              clonedGrid[roomTypeId]['_availability'][ds] = {
                availability: existing?.availability ?? 0,
                restrictions: updatedRestrictions,
              };
              changes.set(`avail::${roomTypeId}::${ds}`, {
                roomTypeId,
                dateStr: ds,
                maxStay: result.value,
              });
              break;
          }
        });

        this.inventoryGrid.set(clonedGrid);
        this.pendingChanges.set(changes);
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
        });

        this.inventoryGrid.set(clonedGrid);
        this.pendingChanges.set(changes);
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

  // ─── Channex Sync ───

  syncToChannex(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const store = this.storeStore.selectedStore();
    const propertyId = store?.channex?.propertyId;
    if (!propertyId) {
      this.snackBar.open('Store is not synced with Channex', 'Close', { duration: 5000 });
      return;
    }

    this.syncing.set(true);

    const grid = this.inventoryGrid();
    const roomTypes = this.roomTypes();
    const days = this.calendarDays();
    const todayStr = this.formatDateLocal(new Date());

    // Build combined restriction values from the grid data (same format as inventory-rates page)
    const restrictionValues: any[] = [];
    const availabilityValues: any[] = [];

    for (const rt of roomTypes) {
      const channexRoomTypeId = rt['channexRoomTypeId'];
      if (!channexRoomTypeId) continue;

      const rtGrid = grid[rt._id];
      if (!rtGrid) continue;

      // Collect availability per room type per date
      for (const day of days) {
        const availCell = rtGrid['_availability']?.[day.dateStr] as AvailabilityCell | undefined;
        if (availCell?.availability !== undefined && availCell?.availability !== null) {
          availabilityValues.push({
            propertyId,
            roomTypeId: channexRoomTypeId,
            date: day.dateStr,
            availability: Math.max(0, availCell.availability),
          });
        }
      }

      // Collect restriction values per rate plan per date
      for (const rp of rt.ratePlans || []) {
        const channexRatePlanId = rp.channex?.ratePlanId;
        if (!channexRatePlanId) {
          console.warn(`Rate plan "${rp.name}" missing Channex ID — skipping`);
          continue;
        }

        const planGrid = rtGrid[rp._id];
        if (!planGrid) continue;

        for (const day of days) {
          const record = planGrid[day.dateStr] as RateInventoryRecord | undefined;
          if (!record) continue;

          const isToday = day.dateStr <= todayStr;

          // Rate resolution: otaRate → ratePlan.otaBaseRate → rate
          let syncRate: number | undefined;
          if (record.otaRate != null && record.otaRate > 0) {
            syncRate = record.otaRate;
          } else if (rp.otaBaseRate != null && rp.otaBaseRate > 0) {
            syncRate = rp.otaBaseRate;
          } else if (record.rate != null && record.rate > 0) {
            syncRate = record.rate;
          }

          const restriction: any = {
            propertyId,
            ratePlanId: channexRatePlanId,
            date: day.dateStr,
          };

          // Rate as string (Channex face-value)
          if (syncRate !== undefined && syncRate > 0) {
            restriction.rate = String(Number(syncRate).toFixed(2));
          }

          // Restrictions — always include explicit values
          restriction.minStayArrival = record.restrictions?.minStay || 1;
          restriction.maxStay = record.restrictions?.maxStay || 365;
          restriction.closedToArrival = record.restrictions?.closedToArrival ?? false;
          restriction.closedToDeparture = record.restrictions?.closedToDeparture ?? false;
          // Stop sell for today/past dates to prevent bookings
          restriction.stopSell = isToday ? true : (record.restrictions?.stopSell ?? false);

          // Include availability from room type (future dates only)
          if (!isToday) {
            const availCell = rtGrid['_availability']?.[day.dateStr] as AvailabilityCell | undefined;
            if (availCell?.availability !== undefined) {
              restriction.availability = Math.max(0, availCell.availability);
            }
          }

          restrictionValues.push(restriction);
        }
      }
    }

    console.log('Restrictions to sync:', restrictionValues);
    console.log('Availability to sync:', availabilityValues);

    if (restrictionValues.length === 0 && availabilityValues.length === 0) {
      this.syncing.set(false);
      this.snackBar.open('No data to sync — calendar grid is empty', 'Close', { duration: 5000 });
      return;
    }

    // POST directly to Channex restrictions API (same as inventory-rates page)
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
      },
      error: (err) => {
        this.syncing.set(false);
        const errorMsg = err.error?.message || err.message || 'Sync failed';
        this.snackBar.open(`Channex sync failed: ${errorMsg}`, 'Close', { duration: 6000 });
      },
    });
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
}
