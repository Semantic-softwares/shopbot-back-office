import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface ValueOverrideData {
  roomTypeName: string;
  ratePlanName?: string;
  startDate: Date;
  endDate?: Date;
  currentValue: number | null;
  restrictionType: 'availability' | 'rate' | 'min-stay' | 'max-stay' | 'cta' | 'ctd' | 'stop-sell';
  isAvailabilityOnly?: boolean;
  currentToggleValue?: boolean;
  // All ARI data fields
  ariRate?: number | null;
  ariAvailability?: number | null;
  ariMinStay?: number | null;
  ariMaxStay?: number | null;
  ariClosedToArrival?: boolean;
  ariClosedToDeparture?: boolean;
  ariStopSell?: boolean;
}

@Component({
  selector: 'app-value-override-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="p-6 min-w-96">
      <h2 class="text-xl font-bold mb-6">Value Override</h2>

      <form [formGroup]="form" class="space-y-6">
        <!-- Room Type Display -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Room Type:</label>
          <div class="text-base font-semibold text-gray-900">{{ data.roomTypeName }}</div>
        </div>

        <!-- Rate Plan Display (if applicable) -->
        @if (data.ratePlanName) {
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Rate Plan:</label>
            <div class="text-base font-semibold text-gray-900">{{ data.ratePlanName }}</div>
          </div>
        }

        <!-- Date Range (Material Range Picker) -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Date Range:</label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Select date range</mat-label>
            <mat-date-range-input [formGroup]="form" [rangePicker]="picker">
              <input matStartDate formControlName="startDate" readonly>
              <input matEndDate formControlName="endDate" readonly>
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-date-range-picker #picker></mat-date-range-picker>
          </mat-form-field>
        </div>

        <!-- Restriction Type Selection (only for rate plans) -->
        @if (!data.isAvailabilityOnly) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Restriction</mat-label>
            <mat-select formControlName="restrictionType" (selectionChange)="onRestrictionTypeChange()">
              <mat-option value="rate">Rate</mat-option>
              <mat-option value="min-stay">Min Stay</mat-option>
              <mat-option value="max-stay">Max Stay</mat-option>
              <mat-option value="cta">Closed to Arrival</mat-option>
              <mat-option value="ctd">Closed to Departure</mat-option>
              <mat-option value="stop-sell">Stop Sell</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <!-- Value Input (for Rate, Min Stay, Max Stay) -->
        @if (isNumericRestriction()) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ getValueLabel() }}</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="value"
              placeholder="Enter value"
              min="0">
          </mat-form-field>
        }

        <!-- Toggle Input (for CTA, CTD, Stop Sell) -->
        @if (isToggleRestriction()) {
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <label class="text-sm font-medium text-gray-700">{{ getToggleLabel() }}</label>
            <mat-slide-toggle formControlName="toggleValue"></mat-slide-toggle>
          </div>
        }
      </form>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end mt-8">
        <button 
          matButton 
          (click)="dialogRef.close()">
          Cancel
        </button>
        <button 
          matButton="filled"
          color="primary"
          (click)="save()"
          [disabled]="form.invalid">
          OK
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class ValueOverrideDialogComponent {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<ValueOverrideDialogComponent>);
  public data = inject<ValueOverrideData>(MAT_DIALOG_DATA);

  private restrictionType = this.data.isAvailabilityOnly ? 'availability' : (this.data.restrictionType || 'rate');

  public form = this.fb.group({
    startDate: [this.data.startDate, Validators.required],
    endDate: [this.data.endDate || this.data.startDate, Validators.required],
    restrictionType: [this.restrictionType, Validators.required],
    value: [this.getInitialValue(), ''],
    toggleValue: [this.getInitialToggleValue(), false],
  });

  private getInitialValue(): number | null {
    switch (this.restrictionType) {
      case 'rate':
        return this.data.ariRate ?? null;
      case 'min-stay':
        return this.data.ariMinStay ?? null;
      case 'max-stay':
        return this.data.ariMaxStay ?? null;
      case 'availability':
        return this.data.ariAvailability ?? null;
      default:
        return null;
    }
  }

  private getInitialToggleValue(): boolean {
    switch (this.restrictionType) {
      case 'cta':
        return this.data.ariClosedToArrival ?? false;
      case 'ctd':
        return this.data.ariClosedToDeparture ?? false;
      case 'stop-sell':
        return this.data.ariStopSell ?? false;
      default:
        return false;
    }
  }

  public isNumericRestriction(): boolean {
    const type = this.form.get('restrictionType')?.value as string;
    return ['rate', 'min-stay', 'max-stay', 'availability'].includes(type);
  }

  public isToggleRestriction(): boolean {
    const type = this.form.get('restrictionType')?.value as string;
    return ['cta', 'ctd', 'stop-sell'].includes(type);
  }

  public getValueLabel(): string {
    const type = this.form.get('restrictionType')?.value as string;
    switch (type) {
      case 'rate':
        return 'Rate';
      case 'min-stay':
        return 'Minimum Stay (nights)';
      case 'max-stay':
        return 'Maximum Stay (nights)';
      case 'availability':
        return 'Availability';
      default:
        return 'Value';
    }
  }

  public getToggleLabel(): string {
    const type = this.form.get('restrictionType')?.value as string;
    switch (type) {
      case 'cta':
        return 'Closed to Arrival';
      case 'ctd':
        return 'Closed to Departure';
      case 'stop-sell':
        return 'Stop Sell';
      default:
        return '';
    }
  }

  public onRestrictionTypeChange(): void {
    const type = this.form.get('restrictionType')?.value as string;
    
    // Update the value based on restriction type
    if (['rate', 'min-stay', 'max-stay', 'availability'].includes(type)) {
      const newValue = this.getValueForRestrictionType(type);
      this.form.get('value')?.setValue(newValue);
    } else if (['cta', 'ctd', 'stop-sell'].includes(type)) {
      const newToggle = this.getToggleForRestrictionType(type);
      this.form.get('toggleValue')?.setValue(newToggle);
    }
    
    // Clear validators and set appropriate ones
    const valueControl = this.form.get('value');
    const toggleControl = this.form.get('toggleValue');

    if (['rate', 'min-stay', 'max-stay', 'availability'].includes(type)) {
      valueControl?.setValidators([Validators.required, Validators.min(0)]);
      toggleControl?.clearValidators();
    } else {
      valueControl?.clearValidators();
      toggleControl?.setValidators([]);
    }

    valueControl?.updateValueAndValidity();
    toggleControl?.updateValueAndValidity();
  }

  private getValueForRestrictionType(type: string): number | null {
    switch (type) {
      case 'rate':
        return this.data.ariRate ?? null;
      case 'min-stay':
        return this.data.ariMinStay ?? null;
      case 'max-stay':
        return this.data.ariMaxStay ?? null;
      case 'availability':
        return this.data.ariAvailability ?? null;
      default:
        return null;
    }
  }

  private getToggleForRestrictionType(type: string): boolean {
    switch (type) {
      case 'cta':
        return this.data.ariClosedToArrival ?? false;
      case 'ctd':
        return this.data.ariClosedToDeparture ?? false;
      case 'stop-sell':
        return this.data.ariStopSell ?? false;
      default:
        return false;
    }
  }

  public save(): void {
    if (this.form.valid) {
      const type = this.form.get('restrictionType')?.value as string;
      const isToggle = ['cta', 'ctd', 'stop-sell'].includes(type);

      this.dialogRef.close({
        startDate: this.form.value.startDate,
        endDate: this.form.value.endDate,
        restrictionType: this.form.value.restrictionType,
        value: isToggle ? this.form.value.toggleValue : this.form.value.value,
      });
    }
  }
}
