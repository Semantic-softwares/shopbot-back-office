import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-reservation-details-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatDatepickerModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="space-y-6">
      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Stay Dates & Times</mat-card-title>
          <mat-card-subtitle>Check-in and check-out information</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Check-in Date</mat-label>
              <input
                matInput
                [matDatepicker]="checkInPicker"
                formControlName="checkInDate"
                required
              />
              <mat-datepicker-toggle matSuffix [for]="checkInPicker"></mat-datepicker-toggle>
              <mat-datepicker #checkInPicker></mat-datepicker>
              @if (reservationForm.get('checkInDate')?.hasError('required')) {
                <mat-error>Check-in date is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Check-out Date</mat-label>
              <input
                matInput
                [matDatepicker]="checkOutPicker"
                formControlName="checkOutDate"
                required
              />
              <mat-datepicker-toggle matSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
              <mat-datepicker #checkOutPicker></mat-datepicker>
              @if (reservationForm.get('checkOutDate')?.hasError('required')) {
                <mat-error>Check-out date is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Expected Check-in Time</mat-label>
              <input
                matInput
                type="time"
                formControlName="expectedCheckInTime"
              />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Expected Check-out Time</mat-label>
              <input
                matInput
                type="time"
                formControlName="expectedCheckOutTime"
              />
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Stay Duration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p class="text-sm text-gray-600">Number of Nights</p>
              <p class="text-2xl font-bold text-blue-600">{{ numberOfNights() }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ReservationDetailsStepComponent {
  @Input() reservationForm!: FormGroup;
  @Input() numberOfNights!: () => number;
}
