import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RateInventoryService, RatePlan } from '../../../../../shared/services/rate-inventory.service';

export interface RatePlanDialogData {
  storeId: string;
  roomTypes: any[];
  ratePlan?: RatePlan; // null = create, populated = edit
  storeCurrency: string;
  selectedRoomTypeId?: string; // Pre-select room type in create mode
}

@Component({
  selector: 'app-rate-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rate-plan-dialog.component.html',
})
export class RatePlanDialogComponent implements OnInit {
  private rateInventoryService = inject(RateInventoryService);
  private dialogRef = inject(MatDialogRef<RatePlanDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  data = inject<RatePlanDialogData>(MAT_DIALOG_DATA);

  saving = signal<boolean>(false);
  isEdit = signal<boolean>(false);

  form!: FormGroup;

  readonly dayLabels: { key: string; label: string }[] = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  ngOnInit(): void {
    this.isEdit.set(!!this.data.ratePlan);
    this.buildForm();
  }

  private buildForm(): void {
    const rp = this.data.ratePlan;

    this.form = this.fb.group({
      name: [rp?.name || '', Validators.required],
      description: [rp?.description || ''],
      roomType: [rp?.roomType?._id || rp?.roomType || this.data.selectedRoomTypeId || '', Validators.required],
      baseRate: [rp?.baseRate || 0, [Validators.required, Validators.min(0)]],
      otaBaseRate: [rp?.otaBaseRate ?? null, [Validators.min(0)]],
      isDefault: [rp?.isDefault ?? false],
      active: [rp?.active ?? true],
      // Day-of-week overrides
      monday: [rp?.dayOfWeekRates?.monday ?? null],
      tuesday: [rp?.dayOfWeekRates?.tuesday ?? null],
      wednesday: [rp?.dayOfWeekRates?.wednesday ?? null],
      thursday: [rp?.dayOfWeekRates?.thursday ?? null],
      friday: [rp?.dayOfWeekRates?.friday ?? null],
      saturday: [rp?.dayOfWeekRates?.saturday ?? null],
      sunday: [rp?.dayOfWeekRates?.sunday ?? null],
      // Restrictions
      minStay: [rp?.restrictions?.minStay ?? 1, [Validators.min(1)]],
      maxStay: [rp?.restrictions?.maxStay ?? 365, [Validators.min(1)]],
    });

    // Disable roomType when editing
    if (this.isEdit()) {
      this.form.get('roomType')?.disable();
    }
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    const v = this.form.getRawValue();

    const payload: any = {
      name: v.name,
      description: v.description,
      roomType: v.roomType,
      baseRate: v.baseRate,
      otaBaseRate: v.otaBaseRate ?? null,
      isDefault: v.isDefault,
      active: v.active,
      dayOfWeekRates: {
        monday: v.monday || null,
        tuesday: v.tuesday || null,
        wednesday: v.wednesday || null,
        thursday: v.thursday || null,
        friday: v.friday || null,
        saturday: v.saturday || null,
        sunday: v.sunday || null,
      },
      restrictions: {
        minStay: v.minStay || 1,
        maxStay: v.maxStay || 365,
      },
    };

    const req$ = this.isEdit()
      ? this.rateInventoryService.updateRatePlan(this.data.ratePlan!._id, payload)
      : this.rateInventoryService.createRatePlan(this.data.storeId, payload);

    req$.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.snackBar.open(
          `Rate plan ${this.isEdit() ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 },
        );
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(
          `Failed to ${this.isEdit() ? 'update' : 'create'} rate plan: ${err?.error?.message || err.message}`,
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
