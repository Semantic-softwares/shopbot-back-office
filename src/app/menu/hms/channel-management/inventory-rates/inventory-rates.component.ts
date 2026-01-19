import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

// Models
import { RateUpdatePayload, DateRateEntry } from '../../../../shared/models/hotel.models';

// Services
import { RoomsService } from '../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// Components
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-inventory-rates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MatTabsModule,
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
  private baseUrl = environment.apiUrl;

  // Form for date range selection
  dateRangeForm = this.fb.group({
    startDate: [new Date(), Validators.required],
    endDate: [this.getDateAfter(14), Validators.required],
  });

  // rxResource for loading room types
  public roomTypesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => this.roomsService.getRoomTypes(params.storeId),
  });

  // State Signals
  private dateRange = signal({ startDate: new Date(), endDate: this.getDateAfter(14) });
  private calendarDates = signal<Date[]>([]);
  private selectedCurrency = signal<string>('NGN');
  private rateData = signal<Map<string, Map<string, number>>>(new Map());
  private availabilityData = signal<Map<string, Map<string, number>>>(new Map());
  private isSaving = signal<boolean>(false);
  private saveStatus = signal<'success' | 'error' | null>(null);
  private selectedRoomTypeId = signal<string>('');
  private editMode = signal<boolean>(false);

  // Readonly signals for template
  public readonly getRoomTypes = computed(() => this.roomTypesResource.value() || []);
  public readonly getIsLoading = computed(() => this.roomTypesResource.isLoading());
  public readonly getError = computed(() => this.roomTypesResource.error());
  public readonly getCalendarDates = this.calendarDates.asReadonly();
  public readonly getSelectedCurrency = this.selectedCurrency.asReadonly();
  public readonly getIsSaving = this.isSaving.asReadonly();
  public readonly getSaveStatus = this.saveStatus.asReadonly();
  public readonly getEditMode = this.editMode.asReadonly();

  constructor() {
    // Generate calendar dates when form changes
    effect(() => {
      const startDate = this.dateRangeForm.get('startDate')?.value;
      const endDate = this.dateRangeForm.get('endDate')?.value;

      if (startDate && endDate) {
        this.dateRange.set({ startDate: new Date(startDate), endDate: new Date(endDate) });
        this.generateCalendarDates(new Date(startDate), new Date(endDate));
      }
    });

    // Initialize first room type when they load
    effect(() => {
      const roomTypes = this.getRoomTypes();
      if (roomTypes.length > 0 && !this.selectedRoomTypeId()) {
        this.selectedRoomTypeId.set(roomTypes[0]._id || roomTypes[0].id || '');
      }
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

  public updateRate(roomTypeId: string, date: Date, value: number): void {
    const dateStr = this.getDateString(date);

    const roomRates = this.rateData();
    if (!roomRates.has(roomTypeId)) {
      roomRates.set(roomTypeId, new Map());
    }

    roomRates.get(roomTypeId)!.set(dateStr, value);
    this.rateData.set(roomRates);
  }

  public updateAvailability(roomTypeId: string, date: Date, value: number): void {
    const dateStr = this.getDateString(date);

    const availability = this.availabilityData();
    if (!availability.has(roomTypeId)) {
      availability.set(roomTypeId, new Map());
    }

    availability.get(roomTypeId)!.set(dateStr, value);
    this.availabilityData.set(availability);
  }

  public selectRoomType(roomTypeId: string): void {
    this.selectedRoomTypeId.set(roomTypeId);
  }

  public toggleEditMode(): void {
    this.editMode.set(!this.editMode());
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

  public saveChanges(): void {
    this.isSaving.set(true);
    this.saveStatus.set(null);

    // Build payload
    const { startDate, endDate } = this.dateRange();
    const rates: DateRateEntry[] = [];

    // Collect all rate entries
    this.getRoomTypes().forEach(roomType => {
      const roomTypeId = roomType._id || roomType.id || '';
      const roomRates = this.rateData().get(roomTypeId);

      this.getCalendarDates().forEach(date => {
        const dateStr = this.getDateString(date);
        const rate = roomRates?.get(dateStr) || 0;
        const availability = this.availabilityData().get(roomTypeId)?.get(dateStr) || 0;

        if (rate > 0 || availability > 0) {
          rates.push({
            date: dateStr,
            roomTypeId,
            rate,
            availability,
          });
        }
      });
    });

    const payload: RateUpdatePayload = {
      storeId: this.storeStore.selectedStore()?._id || '',
      startDate: this.getDateString(startDate),
      endDate: this.getDateString(endDate),
      rates,
      currency: this.selectedCurrency(),
    };

    // Call backend to push rates to Channex
    this.http.post(`${this.baseUrl}/admin/channex/stores/${payload.storeId}/rates`, payload)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saveStatus.set('success');
          this.editMode.set(false);

          setTimeout(() => this.saveStatus.set(null), 3000);
        },
        error: (err) => {
          console.error('Failed to save rates:', err);
          this.isSaving.set(false);
          this.saveStatus.set('error');

          setTimeout(() => this.saveStatus.set(null), 3000);
        }
      });
  }

  public resetChanges(): void {
    this.rateData.set(new Map());
    this.availabilityData.set(new Map());
    this.editMode.set(false);
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

  public updateCurrency(currency: string): void {
    this.selectedCurrency.set(currency);
  }

  public getDateAfterPublic(days: number): Date {
    return this.getDateAfter(days);
  }
}
