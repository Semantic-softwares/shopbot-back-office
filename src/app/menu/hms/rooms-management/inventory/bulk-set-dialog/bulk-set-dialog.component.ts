import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RateInventoryService, RatePlan } from '../../../../../shared/services/rate-inventory.service';

export interface BulkSetDialogData {
  storeId: string;
  roomTypes: Array<{ _id: string; name: string; basePrice: number; totalRooms: number; ratePlans: RatePlan[] }>;
  selectedRoomTypeId?: string | null;
  selectedRatePlanId?: string | null;
  storeCurrency: string;
  channexConnected?: boolean;
}

@Component({
  selector: 'app-bulk-set-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './bulk-set-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkSetDialogComponent {
  private dialogRef = inject(MatDialogRef<BulkSetDialogComponent>);
  private data: BulkSetDialogData = inject(MAT_DIALOG_DATA);
  private rateInventoryService = inject(RateInventoryService);
  private snackBar = inject(MatSnackBar);

  readonly roomTypes = this.data.roomTypes;
  readonly storeCurrency = this.data.storeCurrency;
  readonly channexConnected = this.data.channexConnected ?? false;
  readonly saving = signal<boolean>(false);
  readonly useDayOverrides = signal<boolean>(false);

  readonly form = new FormGroup({
    roomTypeId: new FormControl<string>(this.data.selectedRoomTypeId ?? '', [Validators.required]),
    ratePlanId: new FormControl<string>(this.data.selectedRatePlanId ?? '', [Validators.required]),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(new Date(), [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    }),
    rate: new FormControl<number | null>(null, [Validators.min(0)]),
    otaRate: new FormControl<number | null>(null, [Validators.min(0)]),
    availability: new FormControl<number | null>(null, [Validators.min(0)]),
    stopSell: new FormControl<boolean>(false),
    minStay: new FormControl<number | null>(null, [Validators.min(1)]),
    maxStay: new FormControl<number | null>(null, [Validators.min(1)]),
  });

  readonly dayOverrides = new FormGroup({
    mon: new FormControl<number | null>(null),
    tue: new FormControl<number | null>(null),
    wed: new FormControl<number | null>(null),
    thu: new FormControl<number | null>(null),
    fri: new FormControl<number | null>(null),
    sat: new FormControl<number | null>(null),
    sun: new FormControl<number | null>(null),
  });

  readonly dayLabels: { key: string; label: string }[] = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  // Computed: rate plans for the selected room type
  readonly availableRatePlans = computed(() => {
    const rtId = this.form.get('roomTypeId')!.value;
    if (!rtId) return [];
    const rt = this.roomTypes.find((r) => r._id === rtId);
    return rt?.ratePlans || [];
  });

  constructor() {
    // When room type changes, update rate plans and auto-select first
    this.form.get('roomTypeId')!.valueChanges.subscribe((roomTypeId) => {
      const rt = this.roomTypes.find((r: any) => r._id === roomTypeId);
      if (rt?.totalRooms != null) {
        this.form.patchValue({ availability: rt.totalRooms });
      }
      // Auto-select the first/default rate plan
      const plans = rt?.ratePlans || [];
      const defaultPlan = plans.find((p: RatePlan) => p.isDefault) || plans[0];
      this.form.patchValue({ ratePlanId: defaultPlan?._id || '' });

      // Pre-fill rate from the selected rate plan's base rate
      if (defaultPlan) {
        this.form.patchValue({ rate: defaultPlan.baseRate });
      }
    });

    // When rate plan changes, pre-fill the base rate
    this.form.get('ratePlanId')!.valueChanges.subscribe((ratePlanId) => {
      const rtId = this.form.get('roomTypeId')!.value;
      const rt = this.roomTypes.find((r: any) => r._id === rtId);
      const plan = rt?.ratePlans?.find((p: RatePlan) => p._id === ratePlanId);
      if (plan) {
        this.form.patchValue({ rate: plan.baseRate });
      }
    });

    // Set initial values if room type and rate plan are pre-selected
    if (this.data.selectedRoomTypeId) {
      const rt = this.roomTypes.find((r: any) => r._id === this.data.selectedRoomTypeId);
      if (rt?.totalRooms != null) {
        this.form.patchValue({ availability: rt.totalRooms });
      }
      // If a specific rate plan was provided, use it; otherwise pick default
      if (this.data.selectedRatePlanId) {
        const plan = rt?.ratePlans?.find((p: RatePlan) => p._id === this.data.selectedRatePlanId);
        if (plan) {
          this.form.patchValue({ rate: plan.baseRate });
        }
      } else {
        const defaultPlan = rt?.ratePlans?.find((p: RatePlan) => p.isDefault) || rt?.ratePlans?.[0];
        if (defaultPlan) {
          this.form.patchValue({ ratePlanId: defaultPlan._id, rate: defaultPlan.baseRate });
        }
      }
    }
  }

  setQuickRange(days: number): void {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days - 1);
    this.form.get('dateRange')!.patchValue({ start, end });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const startDate = val.dateRange.start;
    const endDate = val.dateRange.end;
    if (!val.roomTypeId || !val.ratePlanId || !startDate || !endDate) return;

    // Must provide at least one value to update
    const hasRate = val.rate !== null && val.rate !== undefined && !isNaN(val.rate);
    const hasOtaRate = val.otaRate !== null && val.otaRate !== undefined && !isNaN(val.otaRate);
    const hasAvailability = val.availability !== null && val.availability !== undefined && !isNaN(val.availability);
    const hasRestrictions = val.stopSell || val.minStay || val.maxStay;

    if (!hasRate && !hasOtaRate && !hasAvailability && !hasRestrictions) {
      this.snackBar.open('Please provide at least one value to update (rate, OTA rate, availability, or restrictions)', 'OK', { duration: 4000 });
      return;
    }

    const dayOfWeekOverrides: Record<string, number> = {};
    if (this.useDayOverrides()) {
      const overrides = this.dayOverrides.getRawValue();
      for (const [key, value] of Object.entries(overrides)) {
        if (value !== null && value !== undefined) {
          dayOfWeekOverrides[key] = value;
        }
      }
    }

    const formatLocal = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const body: any = {
      startDate: formatLocal(startDate),
      endDate: formatLocal(endDate),
      ratePlanId: val.ratePlanId,
      source: 'bulk',
    };

    if (hasRate) {
      body.rate = val.rate;
    }

    if (hasOtaRate) {
      body.otaRate = val.otaRate;
    }

    if (hasAvailability) {
      body.availability = val.availability;
    }

    if (Object.keys(dayOfWeekOverrides).length > 0) {
      body.dayOfWeekRates = dayOfWeekOverrides;
    }

    if (val.stopSell || val.minStay || val.maxStay) {
      body.restrictions = {};
      if (val.stopSell) body.restrictions.stopSell = true;
      if (val.minStay) body.restrictions.minStay = val.minStay;
      if (val.maxStay) body.restrictions.maxStay = val.maxStay;
    }

    this.saving.set(true);
    this.rateInventoryService.bulkSetInventory(this.data.storeId, val.roomTypeId, body).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.snackBar.open(
          `Successfully updated ${(result.modifiedCount || 0) + (result.upsertedCount || 0)} dates`,
          'OK',
          { duration: 3000 }
        );
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open('Failed to update rates: ' + (err?.error?.message || err.message), 'OK', {
          duration: 5000,
        });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
