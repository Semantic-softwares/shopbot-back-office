import { Component, Input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

interface RoomPricingDisplay {
  roomType: string;
  roomNumber?: string;
  nights: number;
  pricePerNight: number;
  subtotal: number;
}

@Component({
  selector: 'app-pricing-summary-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
    MatIconModule,
    CurrencyPipe,
  ],
  template: `
    <div class="space-y-6">
      <!-- Room Pricing Breakdown -->
      @if (roomPricingBreakdown() && roomPricingBreakdown().length > 0) {
        <mat-card class="shadow-sm">
          <mat-card-header>
            <mat-card-title>Room Pricing Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="text-left px-4 py-2 font-semibold text-gray-700">Room Type</th>
                    <th class="text-center px-4 py-2 font-semibold text-gray-700">Nights</th>
                    <th class="text-right px-4 py-2 font-semibold text-gray-700">Per Night</th>
                    <th class="text-right px-4 py-2 font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (room of roomPricingBreakdown(); track room.roomType + room.roomNumber) {
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="px-4 py-3">
                        <div>
                          <p class="font-medium">{{ room.roomType }}</p>
                          @if (room.roomNumber) {
                            <p class="text-xs text-gray-500">#{{ room.roomNumber }}</p>
                          }
                        </div>
                      </td>
                      <td class="text-center px-4 py-3">{{ room.nights }}</td>
                      <td class="text-right px-4 py-3">{{ room.pricePerNight | currency }}</td>
                      <td class="text-right px-4 py-3 font-semibold">{{ room.subtotal | currency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Pricing Summary -->
      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Pricing Summary</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="space-y-4">
            <!-- Subtotal -->
            <div class="flex items-center justify-between pb-3 border-b border-gray-200">
              <span class="text-gray-700">Subtotal</span>
              <span class="font-semibold">{{ pricing().subtotal | currency }}</span>
            </div>

            <!-- Taxes -->
            @if (pricing().taxes > 0) {
              <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <span class="text-gray-700">Taxes & Fees</span>
                <span class="font-semibold text-orange-600">
                  +{{ pricing().taxes | currency }}
                </span>
              </div>
            }

            <!-- Service Fee -->
            @if (pricing().serviceFee > 0) {
              <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <span class="text-gray-700">Service Fee</span>
                <span class="font-semibold text-orange-600">
                  +{{ pricing().serviceFee | currency }}
                </span>
              </div>
            }

            <!-- Discounts -->
            @if (pricing().totalDiscount > 0) {
              <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <span class="text-gray-700">Discounts Applied</span>
                <span class="font-semibold text-green-600">
                  -{{ pricing().totalDiscount | currency }}
                </span>
              </div>
            }

            <!-- Early Bird Discount -->
            @if (pricing().earlyBirdDiscount > 0) {
              <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <span class="text-gray-700 flex items-center gap-2">
                  <mat-icon class="text-green-600" [ngStyle]="{ fontSize: '18px', height: '18px', width: '18px' }">
                    local_offer
                  </mat-icon>
                  Early Bird Discount
                </span>
                <span class="font-semibold text-green-600">
                  -{{ pricing().earlyBirdDiscount | currency }}
                </span>
              </div>
            }

            <!-- Total -->
            <div class="flex items-center justify-between pt-3 bg-blue-50 px-4 py-3 rounded-lg border-l-4 border-l-blue-500">
              <span class="font-semibold text-lg text-gray-800">Total Amount</span>
              <span class="font-bold text-2xl text-blue-600">{{ pricing().total | currency }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Payment Info Summary -->
      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Payment Information</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-1">Payment Method</p>
              <p class="font-semibold capitalize">
                {{ paymentInfo().method || 'Not selected' }}
              </p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-1">Payment Status</p>
              <p class="font-semibold">
                @switch (paymentInfo().status) {
                  @case ('pending') {
                    <span class="text-yellow-600">Pending</span>
                  }
                  @case ('completed') {
                    <span class="text-green-600">Completed</span>
                  }
                  @case ('failed') {
                    <span class="text-red-600">Failed</span>
                  }
                  @default {
                    {{ paymentInfo().status || 'Not set' }}
                  }
                }
              </p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Important Notes -->
      <mat-card class="shadow-sm border-l-4 border-l-amber-500">
        <mat-card-header>
          <mat-card-title class="text-amber-700">Important Notes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ul class="space-y-2 text-sm text-gray-700">
            <li class="flex gap-2">
              <mat-icon class="text-amber-500 flex-shrink-0" [ngStyle]="{ fontSize: '18px', height: '18px', width: '18px' }">
                info
              </mat-icon>
              <span>Prices shown include all applicable taxes and service fees</span>
            </li>
            <li class="flex gap-2">
              <mat-icon class="text-amber-500 flex-shrink-0" [ngStyle]="{ fontSize: '18px', height: '18px', width: '18px' }">
                info
              </mat-icon>
              <span>Cancellation policies may apply. Review terms before confirming</span>
            </li>
            <li class="flex gap-2">
              <mat-icon class="text-amber-500 flex-shrink-0" [ngStyle]="{ fontSize: '18px', height: '18px', width: '18px' }">
                info
              </mat-icon>
              <span>A confirmation email will be sent to the guest's email address</span>
            </li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class PricingSummaryStepComponent {
  @Input() reservationForm!: FormGroup;

  roomPricingBreakdown = computed(() => {
    const pricingFormValue = this.reservationForm?.get('pricing')?.value;
    const roomsFormArray = this.reservationForm?.get('rooms') as any;

    if (!roomsFormArray?.controls || !pricingFormValue) return [];

    return roomsFormArray.controls.map((control: any) => {
      const roomValue = control.value;
      return {
        roomType: roomValue.roomType || 'Unknown Room',
        roomNumber: roomValue.roomNumber,
        nights: roomValue.stayPeriod || 1,
        pricePerNight: roomValue.pricing || 0,
        subtotal: (roomValue.stayPeriod || 1) * (roomValue.pricing || 0),
      } as RoomPricingDisplay;
    });
  });

  pricing = computed(() => {
    const pricingControl = this.reservationForm?.get('pricing')?.value;

    return {
      subtotal: pricingControl?.subtotal || 0,
      taxes: pricingControl?.taxes || 0,
      serviceFee: pricingControl?.serviceFee || 0,
      totalDiscount: pricingControl?.totalDiscount || 0,
      earlyBirdDiscount: pricingControl?.earlyBirdDiscount || 0,
      total: pricingControl?.total || 0,
    };
  });

  paymentInfo = computed(() => {
    const paymentControl = this.reservationForm?.get('paymentInfo')?.value;

    return {
      method: paymentControl?.method || 'Not selected',
      status: paymentControl?.status || 'pending',
    };
  });
}
