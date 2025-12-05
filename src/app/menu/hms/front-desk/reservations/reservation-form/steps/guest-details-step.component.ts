import { Component, Input, Output, EventEmitter } from '@angular/core';

import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-guest-details-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
],
  template: `
    <div class="space-y-6">
      <!-- Primary Guest -->
      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Primary Guest</mat-card-title>
          <mat-card-subtitle>Main contact for this reservation</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content [formGroup]="guestDetailsForm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>First Name</mat-label>
              <input
                matInput
                formControlName="firstName"
                placeholder="Enter first name"
              />
              @if (guestDetailsForm.get('firstName')?.hasError('required')) {
                <mat-error>First name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Last Name</mat-label>
              <input
                matInput
                formControlName="lastName"
                placeholder="Enter last name"
              />
              @if (guestDetailsForm.get('lastName')?.hasError('required')) {
                <mat-error>Last name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="guest@example.com"
              />
              @if (guestDetailsForm.get('email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (guestDetailsForm.get('email')?.hasError('email')) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Phone Number</mat-label>
              <input
                matInput
                formControlName="phone"
                placeholder="+234 800 000 0000"
              />
              @if (guestDetailsForm.get('phone')?.hasError('required')) {
                <mat-error>Phone number is required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Address</mat-label>
              <input
                matInput
                formControlName="address"
                placeholder="Street address"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>City</mat-label>
              <input
                matInput
                formControlName="city"
                placeholder="City"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>State/Province</mat-label>
              <input
                matInput
                formControlName="stateProvince"
                placeholder="State or Province"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Postal Code</mat-label>
              <input
                matInput
                formControlName="postalCode"
                placeholder="Postal/ZIP code"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Country</mat-label>
              <input
                matInput
                formControlName="country"
                placeholder="Country"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>National ID</mat-label>
              <input
                matInput
                formControlName="nationalId"
                placeholder="National ID/Passport"
              />
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Additional Guests -->
      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Additional Guests</mat-card-title>
          <mat-card-subtitle>Other people staying in this reservation</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div [formGroup]="guestDetailsForm">
            @if (additionalGuestsArray.length > 0) {
              <div class="space-y-3 mb-6">
                @for (guest of additionalGuestsArray.controls; track $index) {
                  <div
                    class="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    [formGroup]="getGuestFormGroup($index)"
                  >
                    <div class="flex items-start justify-between gap-4 mb-4">
                      <h4 class="font-semibold text-sm">Guest {{ $index + 2 }}</h4>
                      <button
                        mat-icon-button
                        (click)="removeGuest($index)"
                        color="warn"
                        matTooltip="Remove guest"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>First Name</mat-label>
                        <input
                          matInput
                          formControlName="firstName"
                          placeholder="First name"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Last Name</mat-label>
                        <input
                          matInput
                          formControlName="lastName"
                          placeholder="Last name"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Email</mat-label>
                        <input
                          matInput
                          type="email"
                          formControlName="email"
                          placeholder="email@example.com"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Phone Number</mat-label>
                        <input
                          matInput
                          formControlName="phone"
                          placeholder="Phone number"
                        />
                      </mat-form-field>
                    </div>
                  </div>
                }
              </div>
            }

            <button
              mat-raised-button
              color="primary"
              (click)="addGuest()"
              class="w-full"
            >
              <mat-icon>person_add</mat-icon>
              Add Another Guest
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class GuestDetailsStepComponent {
  @Input() guestDetailsForm!: FormGroup;
  @Output() guestAdded = new EventEmitter<void>();
  @Output() guestRemoved = new EventEmitter<number>();

  get additionalGuestsArray(): FormArray {
    return this.guestDetailsForm?.get('additionalGuests') as FormArray;
  }

  getGuestFormGroup(index: number): FormGroup {
    return this.additionalGuestsArray.at(index) as FormGroup;
  }

  addGuest(): void {
    this.guestAdded.emit();
  }

  removeGuest(index: number): void {
    this.guestRemoved.emit(index);
  }
}
