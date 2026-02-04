import { Component, inject, signal, computed, ChangeDetectionStrategy, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of, map, forkJoin } from 'rxjs';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

// Models
import { RateUpdatePayload, DateRateEntry } from '../../../../shared/models/hotel.models';

// Services
import { RoomsService } from '../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { HttpClient } from '@angular/common/http';
import { ChannexService } from '../../../../shared/services/channex.service';
import { environment } from '../../../../../environments/environment';

// Components
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CreateRatePlanDialogComponent } from './create-rate-plan-dialog';
import { ValueOverrideDialogComponent } from './value-override-dialog';

// Domain Types - Following Channex/Channel Manager logic
interface RoomTypeData {
  id: string;
  name: string;
  channexRoomTypeId?: string;
  totalInventory: number;
}

interface RatePlanData {
  id: string;
  name: string;
  roomTypeId: string;
  channexRatePlanId: string;
}

interface ARIData {
  rate?: number;
  availability?: number;
  stopSell?: boolean;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  minStay?: number;
  maxStay?: number;
}

interface ARIResponse {
  ratePlanARI: Record<string, Record<string, ARIData>>;
  roomTypeAvailability: Record<string, Record<string, number>>;
}

// Combined UI Model
interface RoomTypeGroup {
  roomType: RoomTypeData;
  ratePlans: RatePlanData[];
  availability: Map<string, number>; // date -> availability
}

interface RestrictionData {
  rate?: number | string;
  minStayArrival?: number;
  minStayThrough?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  stopSell?: boolean;
  availability?: number;
}

interface PricingDraft {
  startDate: string;
  endDate: string;
  rates: Map<string, Map<string, number>>;
  availability: Map<string, Map<string, number>>;
  restrictions: Map<string, Map<string, RestrictionData>>;
  selectedDays: Set<'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'>;
}

@Component({
  selector: 'app-inventory-rates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatTabsModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatMenuModule,
    PageHeaderComponent,
  ],
  templateUrl: './inventory-rates.component.html',
  styleUrl: './inventory-rates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryRatesComponent {
  private fb = inject(FormBuilder);
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private http = inject(HttpClient);
  private channexService = inject(ChannexService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private baseUrl = environment.apiUrl;

  // Form for date range selection
  dateRangeForm = this.fb.group({
    startDate: [new Date(), Validators.required],
    endDate: [this.getDateAfter(14), Validators.required],
  });

  // Restriction form
  restrictionForm = this.fb.group({
    minStayArrival: [{ value: null as number | null }],
    minStayThrough: [{ value: null as number | null }],
    maxStay: [{ value: null as number | null }],
    closedToArrival: [false],
    closedToDeparture: [false],
    stopSell: [false],
  });

  // Day selection form (for applying restrictions to specific days of week)
  daySelectionForm = this.fb.group({
    monday: [false],
    tuesday: [false],
    wednesday: [false],
    thursday: [false],
    friday: [false],
    saturday: [false],
    sunday: [false],
  });

  // rxResource for loading room types
  public roomTypesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => this.roomsService.getRoomTypes(params.storeId),
  });

  // rxResource for loading rate plans
  public ratePlansResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => this.getPropertyRatePlans(params.storeId),
  });

  // State Signals
  private dateRange = signal({ startDate: new Date(), endDate: this.getDateAfter(14) });
  private calendarDates = signal<Date[]>([]);
  private selectedCurrency = signal<string>('NGN');
  private rateData = signal<Map<string, Map<string, number>>>(new Map());
  private availabilityData = signal<Map<string, Map<string, number>>>(new Map());
  private restrictionData = signal<Map<string, Map<string, RestrictionData>>>(new Map());
  private isSaving = signal<boolean>(false);
  private saveStatus = signal<'success' | 'error' | null>(null);
  private saveWarnings = signal<string[]>([]);
  private isLoadingARI = signal<boolean>(false);
  private ariLoadError = signal<string | null>(null);
  
  // UI State
  private editMode = signal<boolean>(false);
  private showRestrictionsPanel = signal<boolean>(false);
  private selectedDays = signal<Set<'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'>>(new Set());
  private isStoreChannexSynced = signal<boolean>(false);
  private channexSyncError = signal<string | null>(null);
  private hasUnsavedChanges = signal<boolean>(false);
  
  // Restrictions filter
  private selectedRestrictions = signal<string[]>([
    'rate',
  ]);
  
  // Available restrictions to display
  private availableRestrictions = [
    { value: 'availability', label: 'Availability' },
    { value: 'rate', label: 'Rate' },
    { value: 'cta', label: 'Closed To Arrival' },
    { value: 'ctd', label: 'Closed To Departure' },
    { value: 'min-stay', label: 'Min Stay' },
    { value: 'max-stay', label: 'Max Stay' },
    { value: 'stop-sell', label: 'Stop Sell' },
  ];
  
  // Domain-specific state (Channex Channel Manager logic)
  private roomTypes = signal<RoomTypeData[]>([]);
  private ratePlans = signal<RatePlanData[]>([]);
  private ariData = signal<ARIResponse>({
    ratePlanARI: {},
    roomTypeAvailability: {},
  });
  
  // Computed: Group room types with their rate plans
  private roomTypeGroups = computed(() => {
    const roomTypes = this.roomTypes();
    const ratePlans = this.ratePlans();
    const ari = this.ariData();
    
    return roomTypes.map(rt => ({
      roomType: rt,
      ratePlans: ratePlans.filter(rp => rp.roomTypeId === rt.id),
      availability: this.extractRoomTypeAvailability(rt.id, ari),
    }));
  });

  // Readonly signals for template
  public readonly getIsLoading = computed(() => this.roomTypesResource.isLoading());
  public readonly getError = computed(() => this.roomTypesResource.error());
  public readonly getCalendarDates = computed(() => this.calendarDates());
  public readonly getSelectedCurrency = computed(() => this.selectedCurrency());
  public readonly getIsSaving = computed(() => this.isSaving());
  public readonly getSaveStatus = computed(() => this.saveStatus());
  public readonly getSaveWarnings = computed(() => this.saveWarnings());
  public readonly getEditMode = computed(() => this.editMode());
  public readonly getShowRestrictionsPanel = computed(() => this.showRestrictionsPanel());
  public readonly getSelectedDays = computed(() => this.selectedDays());
  public readonly getRoomTypeGroups = this.roomTypeGroups;
  public readonly getIsStoreChannexSynced = computed(() => this.isStoreChannexSynced());
  public readonly getChannexSyncError = computed(() => this.channexSyncError());
  public readonly getHasUnsavedChanges = computed(() => this.hasUnsavedChanges());
  public readonly getIsLoadingARI = computed(() => this.isLoadingARI());
  public readonly getSelectedRestrictions = computed(() => this.selectedRestrictions());
  public readonly getAvailableRestrictions = () => this.availableRestrictions;
  public readonly getARILoadError = computed(() => this.ariLoadError());

  // Legacy/helper signals
  public readonly getRoomTypes = computed(() => this.roomTypesResource.value() || []);
  public readonly getRatePlans = computed(() => this.ratePlans());

  // Days of week mapping
  private daysOfWeek = {
    mo: 'Monday',
    tu: 'Tuesday',
    we: 'Wednesday',
    th: 'Thursday',
    fr: 'Friday',
    sa: 'Saturday',
    su: 'Sunday',
  };

  constructor() {
    // Check if store is synced to Channex
    effect(() => {
      const store = this.storeStore.selectedStore();
      if (store?.channex?.propertyId) {
        this.isStoreChannexSynced.set(true);
        this.channexSyncError.set(null);
      } else if (store) {
        this.isStoreChannexSynced.set(false);
        this.channexSyncError.set(
          'This store is not synced with Channex. Please complete the Channex setup in Channel Management first.',
        );
      }
    });

    // Generate calendar dates when form changes
    effect(() => {
      const startDate = this.dateRangeForm.get('startDate')?.value;
      const endDate = this.dateRangeForm.get('endDate')?.value;

      if (startDate && endDate && this.isStoreChannexSynced()) {
        this.dateRange.set({ startDate: new Date(startDate), endDate: new Date(endDate) });
        this.generateCalendarDates(new Date(startDate), new Date(endDate));
        this.loadPricingDraft(startDate, endDate);
      }
    });

    // Initialize room types and rate plans when they load
    effect(() => {
      const roomTypes = this.roomTypesResource.value();
      console.log('🏠 Room Types Effect Triggered:', { roomTypes, hasRooms: !!roomTypes, roomCount: roomTypes?.length });
      
      if (roomTypes && roomTypes.length > 0) {
        // Map to new RoomTypeData structure
        const mappedRoomTypes = roomTypes.map(rt => ({
          id: rt._id || rt.id || '',
          name: rt.name,
          channexRoomTypeId: rt.channexRoomTypeId,
          totalInventory: 0, // TODO: Calculate from actual room count
        }));
        console.log('✅ Mapped Room Types:', mappedRoomTypes);
        this.roomTypes.set(mappedRoomTypes);
      }
    });

    // Load and map rate plans
    effect(() => {
      const plans = this.ratePlansResource.value();
      console.log('📋 Rate Plans Effect Triggered:', { plans, hasPlan: !!plans, planCount: plans?.length });
      
      if (plans && plans.length > 0) {
        const mappedPlans = plans.map(p => ({
          id: p.id,
          name: p.name,
          roomTypeId: p.roomTypeId || '',
          channexRatePlanId: p.channexRatePlanId,
        }));
        
        // Debug: Log room type and rate plan matching
        const roomTypes = this.roomTypes();
        console.log('🔍 Room Types:', roomTypes.map(rt => ({ id: rt.id, name: rt.name, channexId: rt.channexRoomTypeId })));
        console.log('🔍 Rate Plans:', mappedPlans.map(rp => ({ id: rp.id, name: rp.name, roomTypeId: rp.roomTypeId })));
        console.log('🔍 Filtering:', mappedPlans.map(rp => ({
          ratePlan: rp.name,
          lookingFor: rp.roomTypeId,
          foundRoomTypes: roomTypes.filter(rt => rt.id === rp.roomTypeId).map(rt => rt.name),
        })));
        
        this.ratePlans.set(mappedPlans);
        console.log('✅ Final Rate Plans Array Set:', this.ratePlans());
      } else {
        console.warn('⚠️ No plans loaded from resource:', { plans });
      }
    });

    // Load ARI data from Channex when date range changes
    effect(() => {
      const { startDate, endDate } = this.dateRange();
      const storeId = this.storeStore.selectedStore()?._id;
      const isSynced = this.isStoreChannexSynced();

      if (storeId && isSynced && startDate && endDate) {
        this.loadARIData(storeId, this.getDateString(startDate), this.getDateString(endDate));
      }
    });

    // Set up auto-save with localStorage
    effect(() => {
      const hasChanges = this.getHasUnsavedChanges();
      if (hasChanges && this.editMode()) {
        this.autoSaveToLocalStorage();
      }
    });

    // Trigger change detection when ARI data updates (critical for OnPush strategy)
    effect(() => {
      this.ariData();  // Read the signal to establish dependency
      this.cdr.markForCheck();  // Mark component for check on next cycle
    });
  }

  private getDateAfter(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private generateCalendarDates(startDate: Date, endDate: Date): void {
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    this.calendarDates.set(dates);
  }

  public getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public getRate(roomTypeId: string, date: Date): number {
    const dateStr = this.getDateString(date);
    return this.rateData().get(roomTypeId)?.get(dateStr) || 0;
  }

  public getAvailability(roomTypeId: string, date: Date): number {
    const dateStr = this.getDateString(date);
    return this.availabilityData().get(roomTypeId)?.get(dateStr) || 0;
  }

  public getRestriction(roomTypeId: string, date: Date, field: keyof RestrictionData): any {
    const dateStr = this.getDateString(date);
    return this.restrictionData().get(roomTypeId)?.get(dateStr)?.[field] ?? null;
  }

  public updateRate(roomTypeId: string, date: Date, value: number): void {
    const dateStr = this.getDateString(date);

    const roomRates = this.rateData();
    if (!roomRates.has(roomTypeId)) {
      roomRates.set(roomTypeId, new Map());
    }

    roomRates.get(roomTypeId)!.set(dateStr, value);
    this.rateData.set(roomRates);
    this.hasUnsavedChanges.set(true);
  }

  public updateAvailability(roomTypeId: string, date: Date, value: number): void {
    const dateStr = this.getDateString(date);

    const availability = this.availabilityData();
    if (!availability.has(roomTypeId)) {
      availability.set(roomTypeId, new Map());
    }

    availability.get(roomTypeId)!.set(dateStr, value);
    this.availabilityData.set(availability);
    this.hasUnsavedChanges.set(true);
  }

  public updateRestriction(
    roomTypeId: string,
    date: Date,
    field: keyof RestrictionData,
    value: any,
  ): void {
    const dateStr = this.getDateString(date);

    const restrictions = this.restrictionData();
    if (!restrictions.has(roomTypeId)) {
      restrictions.set(roomTypeId, new Map());
    }

    const dateRestrictions = restrictions.get(roomTypeId)!;
    if (!dateRestrictions.has(dateStr)) {
      dateRestrictions.set(dateStr, {});
    }

    dateRestrictions.get(dateStr)![field] = value;
    this.restrictionData.set(restrictions);
    this.hasUnsavedChanges.set(true);
  }

  public toggleEditMode(): void {
    this.editMode.set(!this.editMode());
    if (!this.editMode()) {
      this.hasUnsavedChanges.set(false);
    }
  }

  public onRestrictionsChange(restrictions: string[]): void {
    this.selectedRestrictions.set(restrictions);
  }

  public isRestrictionSelected(restrictionKey: string): boolean {
    return this.selectedRestrictions().includes(restrictionKey);
  }

  public getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      NGN: '₦',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[currency] || currency;
  }

  public toggleDay(day: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'): void {
    const days = new Set(this.selectedDays());
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    this.selectedDays.set(days);
  }

  public isDaySelected(day: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'): boolean {
    return this.selectedDays().has(day);
  }

  public toggleRestrictionsPanel(): void {
    this.showRestrictionsPanel.set(!this.showRestrictionsPanel());
  }

  public applyRestrictionsToDateRange(): void {
    const formValue = this.restrictionForm.value;
    const selectedDays = this.selectedDays();

    if (selectedDays.size === 0 && !formValue.closedToArrival && !formValue.closedToDeparture && !formValue.stopSell) {
      return;
    }

    // TODO: Implement restrictions application for selected rate plans
    // In the new Channel Manager model, restrictions apply per rate plan, not room type
    console.warn('Bulk restriction application not yet implemented. Apply restrictions via individual rate plan cells.');
    
    this.hasUnsavedChanges.set(true);
  }

  private generateDateRangeArray(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private getDayOfWeek(date: Date): 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su' {
    const day = date.getDay();
    const daysMap = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'] as const;
    return daysMap[day] as 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
  }

  public saveChanges(): void {
    this.isSaving.set(true);
    this.saveStatus.set(null);
    this.saveWarnings.set([]);

    const { startDate, endDate } = this.dateRange();
    const store = this.storeStore.selectedStore();
    const storeId = store?._id || '';
    const propertyId = store?.channex?.propertyId || '';

    if (!propertyId) {
      console.error('Store is not synced with Channex - missing property_id');
      this.isSaving.set(false);
      this.saveStatus.set('error');
      setTimeout(() => this.saveStatus.set(null), 3000);
      return;
    }

    const ariData = this.ariData();
    const ratePlans = this.ratePlans();
    const roomTypes = this.roomTypes();

    // 1. Collect rate plan restrictions
    const restrictionValues: any[] = [];
    ratePlans.forEach(ratePlan => {
      this.getCalendarDates().forEach(date => {
        const dateStr = this.getDateString(date);
        const ari = ariData.ratePlanARI[ratePlan.id]?.[dateStr];

        if (ari) {
          if (!ratePlan.channexRatePlanId) {
            console.warn(`Rate plan ${ratePlan.name} (${ratePlan.id}) is missing Channex ID`);
            return;
          }

          const restrictionValue: any = {
            propertyId: propertyId,
            ratePlanId: ratePlan.channexRatePlanId,
            date: dateStr,
          };

          // Add all available ARI fields (skip rates that are 0 or less)
          if (ari.rate !== undefined && ari.rate !== null && ari.rate > 0) {
            restrictionValue.rate = String(ari.rate);
          }

          if (ari.availability !== undefined && ari.availability !== null) {
            restrictionValue.availability = ari.availability;
          }

          if (ari.minStay !== undefined && ari.minStay !== null) {
            restrictionValue.minStayArrival = ari.minStay;
          }

          if (ari.maxStay !== undefined && ari.maxStay !== null) {
            restrictionValue.maxStay = ari.maxStay;
          }

          if (ari.closedToArrival !== undefined && ari.closedToArrival !== null) {
            restrictionValue.closedToArrival = ari.closedToArrival;
          }

          if (ari.closedToDeparture !== undefined && ari.closedToDeparture !== null) {
            restrictionValue.closedToDeparture = ari.closedToDeparture;
          }

          if (ari.stopSell !== undefined && ari.stopSell !== null) {
            restrictionValue.stopSell = ari.stopSell;
          }

          restrictionValues.push(restrictionValue);
        }
      });
    });

    // 2. Collect room type availability overrides
    const availabilityValues: any[] = [];
    roomTypes.forEach(roomType => {
      const channexRoomTypeId = roomType.channexRoomTypeId || '';
      if (!channexRoomTypeId) return;

      const roomTypeAvailability = ariData.roomTypeAvailability[channexRoomTypeId] || {};
      this.getCalendarDates().forEach(date => {
        const dateStr = this.getDateString(date);
        const availability = roomTypeAvailability[dateStr];

        if (availability !== undefined && availability !== null) {
          const availabilityValue: any = {
            propertyId: propertyId,
            roomTypeId: channexRoomTypeId,
            date: dateStr,
            availability: availability, // Keep as number
          };
          availabilityValues.push(availabilityValue);
        }
      });
    });

    console.log('Restrictions to save:', restrictionValues);
    console.log('Availability to save:', availabilityValues);

    // Create observables for both API calls
    const restrictionsCall$ = restrictionValues.length > 0
      ? this.http.post(`${this.baseUrl}/admin/channex/stores/${storeId}/restrictions`, {
          values: restrictionValues,
        })
      : of({ success: true, warnings: [] } as any);

    const availabilityCall$ = availabilityValues.length > 0
      ? this.http.post(`${this.baseUrl}/admin/channex/stores/${storeId}/availability`, {
          values: availabilityValues,
        })
      : of({ success: true, warnings: [] } as any);

    // Execute both calls in parallel using forkJoin
    forkJoin([restrictionsCall$, availabilityCall$]).subscribe({
      next: (responses: any[]) => {
        const restrictionsResponse = responses[0];
        const availabilityResponse = responses[1];

        // Merge warnings from both responses
        const allWarnings: string[] = [];

        if (restrictionsResponse.warnings && restrictionsResponse.warnings.length > 0) {
          restrictionsResponse.warnings.forEach((w: any) => {
            const warningMsg = this.formatWarningMessage(w, 'Restriction');
            allWarnings.push(warningMsg);
          });
        }

        if (availabilityResponse.warnings && availabilityResponse.warnings.length > 0) {
          availabilityResponse.warnings.forEach((w: any) => {
            const warningMsg = this.formatWarningMessage(w, 'Availability');
            allWarnings.push(warningMsg);
          });
        }

        this.handleSaveSuccess(storeId, startDate, endDate, allWarnings);
      },
      error: (err) => {
        console.error('Failed to save changes to Channex:', err);
        this.isSaving.set(false);
        this.saveStatus.set('error');
        setTimeout(() => this.saveStatus.set(null), 3000);
      },
    });
  }

  private formatWarningMessage(warning: any, type: string): string {
    // warning can be an object with nested structure
    if (warning.warning && typeof warning.warning === 'object') {
      const errorFields = Object.entries(warning.warning)
        .map(([field, messages]: [string, any]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : messages;
          return `${field}: ${msg}`;
        })
        .join('; ');

      return `${type} (${warning.date}): ${errorFields}`;
    }

    return `${type}: ${JSON.stringify(warning)}`;
  }

  private pushRestrictionsToChannex(
    storeId: string,
    restrictions: any[],
    startDate: Date,
    endDate: Date,
  ): void {
    // TODO: Implement restriction pushing for each rate plan
    // In the new Channel Manager model, restrictions apply per rate plan
    console.warn('Bulk restriction push not yet implemented. Update rate plans individually.');
    this.handleSaveSuccess(storeId, startDate, endDate);
  }

  private handleSaveSuccess(storeId: string, startDate: Date, endDate: Date, warnings: string[] = []): void {
    this.isSaving.set(false);
    this.saveStatus.set('success');
    this.editMode.set(false);
    this.hasUnsavedChanges.set(false);

    // Process and store warnings - extract unique messages
    if (warnings && warnings.length > 0) {
      const uniqueWarnings = [...new Set(warnings)];
      this.saveWarnings.set(uniqueWarnings);
      console.warn('Channex warnings:', uniqueWarnings);
    }

    // Reload ARI data to refresh the calendar and show updated values from Channex
    this.loadARIData(storeId, this.getDateString(startDate), this.getDateString(endDate));

    // Clear success status after 3 seconds (or longer if there are warnings)
    const timeout = warnings && warnings.length > 0 ? 5000 : 3000;
    setTimeout(() => this.saveStatus.set(null), timeout);
  }

  public resetChanges(): void {
    this.rateData.set(new Map());
    this.availabilityData.set(new Map());
    this.restrictionData.set(new Map());
    this.editMode.set(false);
    this.hasUnsavedChanges.set(false);
    // Reload ARI data to refresh the table
    const { startDate, endDate } = this.dateRange();
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) {
      this.loadARIData(storeId, this.getDateString(startDate), this.getDateString(endDate));
    }
  }

  public navigateToPreviousPeriod(): void {
    const { startDate, endDate } = this.dateRange();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - daysDiff);

    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() - daysDiff);

    this.dateRangeForm.patchValue({
      startDate: newStart,
      endDate: newEnd,
    });
  }

  public navigateToNextPeriod(): void {
    const { startDate, endDate } = this.dateRange();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + daysDiff);

    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() + daysDiff);

    this.dateRangeForm.patchValue({
      startDate: newStart,
      endDate: newEnd,
    });
  }

  public selectDateRange(days: number): void {
    const startDate = new Date();
    const endDate = this.getDateAfter(days - 1);

    this.dateRangeForm.patchValue({
      startDate,
      endDate,
    });
  }

  public openDatePicker(): void {
    // Trigger the start date picker - user can select a new date range
    const startInput = document.querySelector('input[formControlName="startDate"]') as HTMLInputElement;
    if (startInput) {
      startInput.click();
    }
  }

  public updateCurrency(currency: string): void {
    this.selectedCurrency.set(currency);
  }

  /**
   * Load ARI (Availability, Rates, Inventory) data from Channex
   * This is the source of truth for rates and availability
   */
  private loadARIData(storeId: string, startDate: string, endDate: string): void {
    this.isLoadingARI.set(true);
    this.ariLoadError.set(null);

    const url = `${this.baseUrl}/admin/channex/stores/${storeId}/ari?startDate=${startDate}&endDate=${endDate}`;

    this.http.get<{ success: boolean; data: ARIResponse }>(url).subscribe({
      next: (response) => {
        if (response.data) {
          this.ariData.set({
            ratePlanARI: response.data.ratePlanARI || {},
            roomTypeAvailability: response.data.roomTypeAvailability || {},
          });
        }
        this.isLoadingARI.set(false);
      },
      error: (error) => {
        console.error('Failed to load ARI data from Channex:', error);
        this.ariLoadError.set('Failed to load rates and availability from Channex');
        this.isLoadingARI.set(false);
        // Keep existing data if load fails
      },
    });
  }

  // LocalStorage persistence
  private autoSaveToLocalStorage(): void {
    const draft: PricingDraft = {
      startDate: this.getDateString(this.dateRange().startDate),
      endDate: this.getDateString(this.dateRange().endDate),
      rates: this.rateData(),
      availability: this.availabilityData(),
      restrictions: this.restrictionData(),
      selectedDays: this.selectedDays(),
    };

    const storeId = this.storeStore.selectedStore()?._id || '';
    const key = `pricing_draft_${storeId}_${draft.startDate}_${draft.endDate}`;

    try {
      localStorage.setItem(key, JSON.stringify({
        ...draft,
        rates: Object.fromEntries(
          Array.from(draft.rates.entries()).map(([k, v]) => [
            k,
            Object.fromEntries(v),
          ])
        ),
        availability: Object.fromEntries(
          Array.from(draft.availability.entries()).map(([k, v]) => [
            k,
            Object.fromEntries(v),
          ])
        ),
        restrictions: Object.fromEntries(
          Array.from(draft.restrictions.entries()).map(([k, v]) => [
            k,
            Object.fromEntries(v),
          ])
        ),
        selectedDays: Array.from(draft.selectedDays),
      }));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }

  private loadPricingDraft(startDate: Date, endDate: Date): void {
    const storeId = this.storeStore.selectedStore()?._id || '';
    const key = `pricing_draft_${storeId}_${this.getDateString(startDate)}_${this.getDateString(endDate)}`;

    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        const data = JSON.parse(draft);
        this.rateData.set(new Map(
          Object.entries(data.rates).map(([k, v]: [string, any]) => [
            k,
            new Map(Object.entries(v)),
          ])
        ));
        this.availabilityData.set(new Map(
          Object.entries(data.availability).map(([k, v]: [string, any]) => [
            k,
            new Map(Object.entries(v)),
          ])
        ));
        this.restrictionData.set(new Map(
          Object.entries(data.restrictions).map(([k, v]: [string, any]) => [
            k,
            new Map(Object.entries(v)),
          ])
        ));
        this.selectedDays.set(new Set(data.selectedDays));
      }
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
    }
  }

  private savePricingDraft(storeId: string, startDate: string, endDate: string): void {
    const draft = {
      startDate,
      endDate,
      rates: Array.from(this.rateData().entries()).map(([k, v]) => ({
        roomTypeId: k,
        rates: Object.fromEntries(v),
      })),
      availability: Array.from(this.availabilityData().entries()).map(([k, v]) => ({
        roomTypeId: k,
        availability: Object.fromEntries(v),
      })),
      restrictions: Array.from(this.restrictionData().entries()).map(([k, v]) => ({
        roomTypeId: k,
        restrictions: Object.fromEntries(v),
      })),
    };

    this.http.post(`${this.baseUrl}/admin/channex/stores/${storeId}/pricing-draft`, draft)
      .subscribe({
        next: () => console.log('Draft saved to server'),
        error: (err) => console.warn('Failed to save draft to server:', err),
      });
  }

  private getPropertyRatePlans(storeId: string) {
    return this.http.get<{ success: boolean; data: RatePlanData[] }>(
      `${this.baseUrl}/admin/channex/stores/${storeId}/rate-plans`,
    ).pipe(
      map(response => response.data || []),
      catchError(() => {
        // Fallback to empty array if API fails or store not synced
        return of([]);
      })
    );
  }

  public createRatePlan(roomTypeId: string, roomTypeName: string): void {
    const store = this.storeStore.selectedStore();
    if (!store?.channex?.propertyId) {
      console.error('Store not synced with Channex');
      return;
    }

    // Find the room type to get occupancy info and Channex ID
    const roomType = this.getRoomTypes().find(
      (rt) => (rt._id || rt.id) === roomTypeId,
    );

    if (!roomType?.channexRoomTypeId) {
      console.warn('Room type has not been synced with Channex yet');
    }

    const dialogRef = this.dialog.open(CreateRatePlanDialogComponent, {
      width: '600px',
      disableClose: false,
      data: {
        storeId: store._id,
        roomTypeId,
        roomTypeName,
        propertyId: store.channex.propertyId,
        channexRoomTypeId: roomType?.channexRoomTypeId,
        roomTypeOccupancy: roomType?.capacity?.adults || 2,
        currency: store.currencyCode || 'NGN',
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        // Refresh rate plans after creation
        console.log('Rate plan created:', result.message);
        // Reload the rate plans resource to show the new rate plan in the table
        this.ratePlansResource.reload();
      }
    });
  }

  public openAvailabilityOverride(roomType: RoomTypeData, date: Date): void {
    // Get room type availability from ARI data
    const dateStr = this.getDateString(date);
    const channexRoomTypeId = roomType.channexRoomTypeId || '';
    const availabilityValue = this.ariData().roomTypeAvailability[channexRoomTypeId]?.[dateStr] ?? null;

    const dialogRef = this.dialog.open(ValueOverrideDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        roomTypeName: roomType.name,
        startDate: date,
        endDate: date,
        currentValue: availabilityValue,
        restrictionType: 'availability',
        isAvailabilityOnly: true,
        // ARI data for availability
        ariAvailability: availabilityValue,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Update availability for the date range
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);
        const channexRoomTypeId = roomType.channexRoomTypeId || '';

        const dates = this.generateDateRangeArray(startDate, endDate);
        
        // Update the ARI data directly for room type availability
        const currentAri = this.ariData();
        const updatedRoomTypeAvailability = { ...currentAri.roomTypeAvailability };
        
        if (!updatedRoomTypeAvailability[channexRoomTypeId]) {
          updatedRoomTypeAvailability[channexRoomTypeId] = {};
        }
        
        dates.forEach(d => {
          const dateStr = this.getDateString(d);
          updatedRoomTypeAvailability[channexRoomTypeId][dateStr] = result.value;
        });
        
        this.ariData.set({
          ...currentAri,
          roomTypeAvailability: updatedRoomTypeAvailability,
        });

        this.hasUnsavedChanges.set(true);
        console.log('Availability updated:', result);
      }
    });
  }

  private getAvailabilityForRoomType(roomTypeId: string, date: Date): number | null {
    const dateStr = this.getDateString(date);
    return this.roomTypes().find(rt => rt.id === roomTypeId)
      ? this.ariData().roomTypeAvailability[
          this.roomTypes().find(rt => rt.id === roomTypeId)?.channexRoomTypeId || ''
        ]?.[dateStr] ?? null
      : null;
  }

  public openRatePlanValueOverride(ratePlan: RatePlanData, roomType: RoomTypeData, date: Date, restrictionType?: string): void {
    const ari = this.getARIForRatePlan(ratePlan.id, date);

    const dialogRef = this.dialog.open(ValueOverrideDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        roomTypeName: roomType.name,
        ratePlanName: ratePlan.name,
        startDate: date,
        endDate: date,
        currentValue: ari?.rate ?? null,
        currentToggleValue: ari?.stopSell ?? false,
        restrictionType: restrictionType || 'rate',
        isAvailabilityOnly: false,
        // All ARI data fields
        ariRate: ari?.rate ?? null,
        ariAvailability: ari?.availability ?? null,
        ariMinStay: ari?.minStay ?? null,
        ariMaxStay: ari?.maxStay ?? null,
        ariClosedToArrival: ari?.closedToArrival ?? false,
        ariClosedToDeparture: ari?.closedToDeparture ?? false,
        ariStopSell: ari?.stopSell ?? false,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Update based on restriction type selected
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);
        const dates = this.generateDateRangeArray(startDate, endDate);

        // Get current ARI data
        const currentAri = this.ariData();
        const updatedRatePlanARI: Record<string, Record<string, any>> = {};

        // Deep copy ALL existing rate plan ARI data
        Object.keys(currentAri.ratePlanARI).forEach(planId => {
          updatedRatePlanARI[planId] = {};
          Object.keys(currentAri.ratePlanARI[planId]).forEach(dateStr => {
            updatedRatePlanARI[planId][dateStr] = { ...currentAri.ratePlanARI[planId][dateStr] };
          });
        });

        // Ensure the rate plan exists in the ARI data
        if (!updatedRatePlanARI[ratePlan.id]) {
          updatedRatePlanARI[ratePlan.id] = {};
        }

        dates.forEach(d => {
          const dateStr = this.getDateString(d);
          
          // Get existing data for this date (from current ARI or from our updated copy)
          const currentDateData = currentAri.ratePlanARI[ratePlan.id]?.[dateStr] || {};
          updatedRatePlanARI[ratePlan.id][dateStr] = { ...currentDateData };

          // Update the specific restriction field
          switch (result.restrictionType) {
            case 'rate':
              updatedRatePlanARI[ratePlan.id][dateStr].rate = result.value;
              break;
            case 'availability':
              updatedRatePlanARI[ratePlan.id][dateStr].availability = result.value;
              break;
            case 'min-stay':
              updatedRatePlanARI[ratePlan.id][dateStr].minStay = result.value;
              break;
            case 'max-stay':
              updatedRatePlanARI[ratePlan.id][dateStr].maxStay = result.value;
              break;
            case 'cta':
              updatedRatePlanARI[ratePlan.id][dateStr].closedToArrival = result.value;
              break;
            case 'ctd':
              updatedRatePlanARI[ratePlan.id][dateStr].closedToDeparture = result.value;
              break;
            case 'stop-sell':
              updatedRatePlanARI[ratePlan.id][dateStr].stopSell = result.value;
              break;
          }
        });

        // Update the ARI data signal with a new object reference
        this.ariData.set({
          ratePlanARI: updatedRatePlanARI,
          roomTypeAvailability: currentAri.roomTypeAvailability,
        });

        this.hasUnsavedChanges.set(true);
      }
    });
  }  // --- New Channex Channel Manager Logic Helpers ---

  /**
   * Extract availability for a room type from ARI data.
   * Room Type availability is derived from the first rate plan or aggregated.
   */
  /**
   * Extract availability for a room type from ARI data
   * Room Type availability comes from the Channex availability endpoint (keyed by room_type_id)
   * Falls back to first rate plan's availability if room type not found
   */
  private extractRoomTypeAvailability(roomTypeId: string, ari: ARIResponse): Map<string, number> {
    const availability = new Map<string, number>();
    
    // Get room type with this ID to find its Channex ID
    const roomType = this.roomTypes().find(rt => rt.id === roomTypeId);
    if (!roomType?.channexRoomTypeId) {
      // Fallback: use first rate plan's availability
      const ratePlanIds = this.ratePlans().filter(rp => rp.roomTypeId === roomTypeId).map(rp => rp.id);
      if (ratePlanIds.length > 0) {
        const firstRatePlanData = ari.ratePlanARI[ratePlanIds[0]];
        if (firstRatePlanData) {
          Object.entries(firstRatePlanData).forEach(([date, data]) => {
            if (data.availability !== undefined) {
              availability.set(date, data.availability);
            }
          });
        }
      }
      return availability;
    }

    // Use room type availability from Channex (source of truth)
    const rtAvailability = ari.roomTypeAvailability[roomType.channexRoomTypeId];
    if (rtAvailability) {
      Object.entries(rtAvailability).forEach(([date, avail]) => {
        availability.set(date, avail);
      });
    }

    return availability;
  }

  /**
   * Get ARI data for a specific rate plan and date
   */
  public getARIForRatePlan(ratePlanId: string, date: Date): ARIData | null {
    const dateStr = this.getDateString(date);
    return this.ariData().ratePlanARI[ratePlanId]?.[dateStr] || null;
  }

  /**
   * Get availability for a specific rate plan and date
   */
  public getAvailabilityForRatePlan(ratePlanId: string, date: Date): number | null {
    return this.getARIForRatePlan(ratePlanId, date)?.availability ?? null;
  }

  /**
   * Get rate price for a specific rate plan and date
   */
  public getRateForRatePlan(ratePlanId: string, date: Date): number | null {
    return this.getARIForRatePlan(ratePlanId, date)?.rate ?? null;
  }

  /**
   * Get stop sell status for a specific rate plan and date
   */
  public isStopSellForRatePlan(ratePlanId: string, date: Date): boolean {
    return this.getARIForRatePlan(ratePlanId, date)?.stopSell ?? false;
  }

  /**
   * Check if closed to arrival for a specific rate plan and date
   */
  public isClosedToArrivalForRatePlan(ratePlanId: string, date: Date): boolean {
    return this.getARIForRatePlan(ratePlanId, date)?.closedToArrival ?? false;
  }

  /**
   * Check if closed to departure for a specific rate plan and date
   */
  public isClosedToDepartureForRatePlan(ratePlanId: string, date: Date): boolean {
    return this.getARIForRatePlan(ratePlanId, date)?.closedToDeparture ?? false;
  }

  /**
   * Get min stay for a specific rate plan and date
   */
  public getMinStayForRatePlan(ratePlanId: string, date: Date): number | null {
    return this.getARIForRatePlan(ratePlanId, date)?.minStay ?? null;
  }

  /**
   * Get max stay for a specific rate plan and date
   */
  public getMaxStayForRatePlan(ratePlanId: string, date: Date): number | null {
    return this.getARIForRatePlan(ratePlanId, date)?.maxStay ?? null;
  }
}
