import { Component, Inject, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface CreateRatePlanDialogData {
  storeId: string;
  roomTypeId: string;
  roomTypeName: string;
  propertyId: string;
  channexRoomTypeId?: string;
  roomTypeOccupancy?: number;
  currency?: string;
}

@Component({
  selector: 'app-create-rate-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Create Rate Plan</ng-container></h2>
    <mat-dialog-content class="space-y-4">
      <form [formGroup]="ratePlanForm" class="space-y-4">
        <!-- Title -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Rate Plan Title</ng-container></mat-label>
          <input 
            matInput 
            formControlName="title"
            placeholder="e.g., Standard Rate, Promotional Rate" i18n-placeholder
            required>
          <mat-error *ngIf="ratePlanForm.get('title')?.hasError('required')">
            <ng-container i18n>Title is required</ng-container>
          </mat-error>
          <mat-error *ngIf="ratePlanForm.get('title')?.hasError('maxlength')">
            <ng-container i18n>Title must not exceed 255 characters</ng-container>
          </mat-error>
        </mat-form-field>

        <!-- Sell Mode -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Sell Mode</ng-container></mat-label>
          <mat-select formControlName="sellMode">
            <mat-option value="per_room"><ng-container i18n>Per Room (same price for all guests)</ng-container></mat-option>
            <mat-option value="per_person"><ng-container i18n>Per Person (price per guest)</ng-container></mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Rate Mode -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Rate Mode</ng-container></mat-label>
          <mat-select formControlName="rateMode">
            <mat-option value="manual"><ng-container i18n>Manual (set rates manually)</ng-container></mat-option>
            <mat-option value="derived"><ng-container i18n>Derived (from parent rate plan)</ng-container></mat-option>
            <mat-option value="cascade"><ng-container i18n>Cascade (for each occupancy option)</ng-container></mat-option>
            <mat-option value="auto"><ng-container i18n>Auto (calculated automatically)</ng-container></mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Currency -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Currency</ng-container></mat-label>
          <mat-select formControlName="currency">
            <mat-option value="NGN"><ng-container i18n>NGN (₦)</ng-container></mat-option>
            <mat-option value="USD"><ng-container i18n>USD ($)</ng-container></mat-option>
            <mat-option value="EUR"><ng-container i18n>EUR (€)</ng-container></mat-option>
            <mat-option value="GBP"><ng-container i18n>GBP (£)</ng-container></mat-option>
            <mat-option value="ZAR"><ng-container i18n>ZAR (R)</ng-container></mat-option>
            <mat-option value="KES"><ng-container i18n>KES (Ks)</ng-container></mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Occupancy -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Occupancy</ng-container></mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="occupancy"
            min="1"
            required>
          <mat-hint><ng-container i18n>Maximum number of guests for this rate plan</ng-container></mat-hint>
          <mat-error *ngIf="ratePlanForm.get('occupancy')?.hasError('required')">
            <ng-container i18n>Occupancy is required</ng-container>
          </mat-error>
          <mat-error *ngIf="ratePlanForm.get('occupancy')?.hasError('min')">
            <ng-container i18n>Occupancy must be at least 1</ng-container>
          </mat-error>
        </mat-form-field>

        <!-- Base Rate -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Base Rate</ng-container></mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="baseRate"
            min="0"
            step="0.01">
          <mat-hint><ng-container i18n>Default rate for this rate plan</ng-container></mat-hint>
        </mat-form-field>

        <!-- Min Stay Arrival -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Min Stay (Arrival)</ng-container></mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="minStayArrival"
            min="0">
          <mat-hint><ng-container i18n>Minimum stay nights for arrival</ng-container></mat-hint>
        </mat-form-field>

        <!-- Meal Type -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Meal Type</ng-container></mat-label>
          <mat-select formControlName="mealType">
            <mat-option value="room_only"><ng-container i18n>Room Only</ng-container></mat-option>
            <mat-option value="breakfast"><ng-container i18n>Breakfast</ng-container></mat-option>
            <mat-option value="half_board"><ng-container i18n>Half Board</ng-container></mat-option>
            <mat-option value="full_board"><ng-container i18n>Full Board</ng-container></mat-option>
            <mat-option value="all_inclusive"><ng-container i18n>All Inclusive</ng-container></mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Closed to Arrival -->
        <mat-checkbox formControlName="closedToArrival">
          <ng-container i18n>Closed to Arrival (guests cannot check-in on this rate plan)</ng-container>
        </mat-checkbox>

        <!-- Closed to Departure -->
        <mat-checkbox formControlName="closedToDeparture">
          <ng-container i18n>Closed to Departure (guests cannot check-out on this rate plan)</ng-container>
        </mat-checkbox>

        <!-- Stop Sell -->
        <mat-checkbox formControlName="stopSell">
          <ng-container i18n>Stop Sell (rate plan is not available for booking)</ng-container>
        </mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pt-4">
      <button 
        matButton 
        (click)="dialogRef.close()"
        [disabled]="isCreating()">
        <ng-container i18n>Cancel</ng-container>
      </button>
      <button 
        matButton="filled" 
        color="primary"
        (click)="createRatePlan()"
        [disabled]="isCreating() || ratePlanForm.invalid">
        @if (isCreating()) {<ng-container i18n>Creating...</ng-container>} @else {<ng-container i18n>Create Rate Plan</ng-container>}
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateRatePlanDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private baseUrl = environment.apiUrl;
  
  readonly dialogRef = inject(MatDialogRef<CreateRatePlanDialogComponent>);
  readonly data = inject<CreateRatePlanDialogData>(MAT_DIALOG_DATA);

  isCreating = signal(false);
  errorMessage = signal<string | null>(null);

  ratePlanForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    sellMode: ['per_room'],
    rateMode: ['manual'],
    currency: [this.data.currency || 'NGN'],
    occupancy: [this.data.roomTypeOccupancy || 2, [Validators.required, Validators.min(1)]],
    baseRate: [0, Validators.min(0)],
    minStayArrival: [1, Validators.min(0)],
    mealType: ['room_only'],
    closedToArrival: [false],
    closedToDeparture: [false],
    stopSell: [false],
  });

  createRatePlan(): void {
    if (!this.ratePlanForm.valid) {
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set(null);

    const formValue = this.ratePlanForm.value;

    // Build the payload according to Channex API spec
    // Matches: https://staging.channex.io/api/v1/rate_plans/
    const payload = {
      rate_plan: {
        title: formValue.title,
        property_id: this.data.propertyId,
        // Use Channex room type ID if available, otherwise pass MongoDB ID (backend will resolve it)
        room_type_id: this.data.channexRoomTypeId || this.data.roomTypeId,
        parent_rate_plan_id: null,
        sell_mode: formValue.sellMode || 'per_room',
        rate_mode: formValue.rateMode || 'manual',
        currency: formValue.currency,
        inherit_rate: false,
        inherit_closed_to_arrival: false,
        inherit_closed_to_departure: false,
        inherit_stop_sell: false,
        inherit_min_stay_arrival: false,
        inherit_max_stay: false,
        inherit_max_sell: false,
        inherit_max_availability: false,
        inherit_availability_offset: false,
        auto_rate_settings: null,
        options: [
          {
            occupancy: formValue.occupancy || 1,
            is_primary: true,
            children_fee: '0.00',
            infant_fee: '0.00',
          },
        ],
      },
    };

    // Call backend API to create the rate plan
    this.http
      .post(
        `${this.baseUrl}/admin/channex/stores/${this.data.storeId}/rate-plans`,
        payload,
      )
      .subscribe({
        next: (response: any) => {
          this.isCreating.set(false);
          this.snackBar.open(
            $localize`Rate plan "${formValue.title}" created successfully`,
            $localize`Close`,
            { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
          );
          this.dialogRef.close({
            success: true,
            ratePlan: response.data || response,
            message: `Rate plan "${formValue.title}" created successfully`,
          });
        },
        error: (error: any) => {
          this.isCreating.set(false);
          const errorMsg =
            error.error?.message ||
            error.message ||
            'Failed to create rate plan';
          this.errorMessage.set(errorMsg);
          this.snackBar.open(
            $localize`Error: ${errorMsg}`,
            $localize`Close`,
            { duration: 7000, horizontalPosition: 'end', verticalPosition: 'bottom', panelClass: ['error-snackbar'] }
          );
          console.error('Error creating rate plan:', error);
        },
      });
  }
}
