import { Component, Inject, inject, signal, computed } from '@angular/core';
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
  template: `
    <h2 mat-dialog-title>Create Rate Plan</h2>
    <mat-dialog-content class="space-y-4">
      <form [formGroup]="ratePlanForm" class="space-y-4">
        <!-- Title -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Rate Plan Title</mat-label>
          <input 
            matInput 
            formControlName="title"
            placeholder="e.g., Standard Rate, Promotional Rate"
            required>
          <mat-error *ngIf="ratePlanForm.get('title')?.hasError('required')">
            Title is required
          </mat-error>
          <mat-error *ngIf="ratePlanForm.get('title')?.hasError('maxlength')">
            Title must not exceed 255 characters
          </mat-error>
        </mat-form-field>

        <!-- Sell Mode -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Sell Mode</mat-label>
          <mat-select formControlName="sellMode">
            <mat-option value="per_room">Per Room (same price for all guests)</mat-option>
            <mat-option value="per_person">Per Person (price per guest)</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Rate Mode -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Rate Mode</mat-label>
          <mat-select formControlName="rateMode">
            <mat-option value="manual">Manual (set rates manually)</mat-option>
            <mat-option value="derived">Derived (from parent rate plan)</mat-option>
            <mat-option value="cascade">Cascade (for each occupancy option)</mat-option>
            <mat-option value="auto">Auto (calculated automatically)</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Currency -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Currency</mat-label>
          <mat-select formControlName="currency">
            <mat-option value="NGN">NGN (₦)</mat-option>
            <mat-option value="USD">USD ($)</mat-option>
            <mat-option value="EUR">EUR (€)</mat-option>
            <mat-option value="GBP">GBP (£)</mat-option>
            <mat-option value="ZAR">ZAR (R)</mat-option>
            <mat-option value="KES">KES (Ks)</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Occupancy -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Occupancy</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="occupancy"
            min="1"
            required>
          <mat-hint>Maximum number of guests for this rate plan</mat-hint>
          <mat-error *ngIf="ratePlanForm.get('occupancy')?.hasError('required')">
            Occupancy is required
          </mat-error>
          <mat-error *ngIf="ratePlanForm.get('occupancy')?.hasError('min')">
            Occupancy must be at least 1
          </mat-error>
        </mat-form-field>

        <!-- Base Rate -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Base Rate</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="baseRate"
            min="0"
            step="0.01">
          <mat-hint>Default rate for this rate plan</mat-hint>
        </mat-form-field>

        <!-- Min Stay Arrival -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Min Stay (Arrival)</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="minStayArrival"
            min="0">
          <mat-hint>Minimum stay nights for arrival</mat-hint>
        </mat-form-field>

        <!-- Meal Type -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Meal Type</mat-label>
          <mat-select formControlName="mealType">
            <mat-option value="room_only">Room Only</mat-option>
            <mat-option value="breakfast">Breakfast</mat-option>
            <mat-option value="half_board">Half Board</mat-option>
            <mat-option value="full_board">Full Board</mat-option>
            <mat-option value="all_inclusive">All Inclusive</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Closed to Arrival -->
        <mat-checkbox formControlName="closedToArrival">
          Closed to Arrival (guests cannot check-in on this rate plan)
        </mat-checkbox>

        <!-- Closed to Departure -->
        <mat-checkbox formControlName="closedToDeparture">
          Closed to Departure (guests cannot check-out on this rate plan)
        </mat-checkbox>

        <!-- Stop Sell -->
        <mat-checkbox formControlName="stopSell">
          Stop Sell (rate plan is not available for booking)
        </mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pt-4">
      <button 
        matButton 
        (click)="dialogRef.close()"
        [disabled]="isCreating()">
        Cancel
      </button>
      <button 
        matButton="filled" 
        color="primary"
        (click)="createRatePlan()"
        [disabled]="isCreating() || ratePlanForm.invalid">
        {{isCreating() 
          ? 'Creating...'
          : 'Create Rate Plan'
        }}
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
            `Rate plan "${formValue.title}" created successfully`,
            'Close',
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
            `Error: ${errorMsg}`,
            'Close',
            { duration: 7000, horizontalPosition: 'end', verticalPosition: 'bottom', panelClass: ['error-snackbar'] }
          );
          console.error('Error creating rate plan:', error);
        },
      });
  }
}
