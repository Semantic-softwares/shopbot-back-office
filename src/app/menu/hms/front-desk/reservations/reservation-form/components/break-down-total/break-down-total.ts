import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from "@angular/material/list";
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { CommonModule } from '@angular/common';
import { MatInputModule } from "@angular/material/input";
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';

@Component({
  selector: 'break-down-total',
  imports: [MatListModule, CommonModule, ReactiveFormsModule, MatInputModule, CurrencyMaskModule],
  templateUrl: './break-down-total.html',
  styleUrl: './break-down-total.scss',
})
export class BreakDownTotal {
  private reservationFormService = inject(ReservationFormService);
  public reservationForm = toSignal<FormGroup | null>(this.reservationFormService.form$, { initialValue: null });
  public storeStore = inject(StoreStore);

  // Signal to track room array value changes in real-time
  private roomsChangeCounter = signal<number>(0);

  // Getter for rooms form array
  public getRoomsFormArray(): FormArray | null {
    const form = this.reservationForm();
    if (form) {
      return form.get('rooms') as FormArray;
    }
    return null;
  }

  // Computed signal for total number of nights across all rooms
  public totalNumberOfNights = computed(() => {
    this.roomsChangeCounter(); // Track changes
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const stayPeriod = control.get('stayPeriod') as FormGroup;
      return sum + (stayPeriod?.get('numberOfNights')?.value || 0);
    }, 0);
  });

  // Computed signal for subtotal (sum of all rooms' totalPrice)
  public breakdownSubtotal = computed(() => {
    this.roomsChangeCounter(); // Track changes
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const pricing = control.get('pricing') as FormGroup;
      
      if (pricing) {
        const totalPrice = pricing.get('totalPrice')?.value || 0;
        return sum + totalPrice;
      }
      return sum;
    }, 0);
  });

  // Computed signal for service fees
  public breakdownServiceFee = computed(() => {
    this.roomsChangeCounter();
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const fees = control.get('pricing')?.get('fees') as FormGroup;
      return sum + (fees?.get('serviceFee')?.value || 0);
    }, 0);
  });

  // Computed signal for cleaning fees
  public breakdownCleaningFee = computed(() => {
    this.roomsChangeCounter();
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const fees = control.get('pricing')?.get('fees') as FormGroup;
      return sum + (fees?.get('cleaningFee')?.value || 0);
    }, 0);
  });

  // Computed signal for resort fees
  public breakdownResortFee = computed(() => {
    this.roomsChangeCounter();
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const fees = control.get('pricing')?.get('fees') as FormGroup;
      return sum + (fees?.get('resortFee')?.value || 0);
    }, 0);
  });

  // Computed signal for other fees
  public breakdownOtherFees = computed(() => {
    this.roomsChangeCounter();
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const fees = control.get('pricing')?.get('fees') as FormGroup;
      return sum + (fees?.get('other')?.value || 0);
    }, 0);
  });

  // Computed signal for total fees
  public breakdownTotalFees = computed(() => {
    return this.breakdownServiceFee() + this.breakdownCleaningFee() + 
           this.breakdownResortFee() + this.breakdownOtherFees();
  });

  // Computed signal for taxes
  public breakdownTaxes = computed(() => {
    this.roomsChangeCounter();
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const pricing = control.get('pricing') as FormGroup;
      return sum + (pricing?.get('taxes')?.value || 0);
    }, 0);
  });

  // Computed signal for discount
  public breakdownDiscount = computed(() => {
    this.roomsChangeCounter();
    const roomsArray = this.getRoomsFormArray();
    if (!roomsArray) return 0;

    return roomsArray.controls.reduce((sum, control) => {
      const pricing = control.get('pricing') as FormGroup;
      return sum + (pricing?.get('discount')?.value || 0);
    }, 0);
  });

  // Computed signal for grand total
  public breakdownGrandTotal = computed(() => {
    return this.breakdownSubtotal() + this.breakdownTotalFees() + 
           this.breakdownTaxes() - this.breakdownDiscount();
  });

  // Track pricing form changes
  private pricingChangeCounter = signal<number>(0);

  // Computed signal for paid amount
  public paidAmount = computed(() => {
    this.pricingChangeCounter(); // Track changes
    const form = this.reservationForm();
    if (form) {
      const pricingGroup = form.get('pricing') as FormGroup;
      return pricingGroup?.get('paid')?.value || 0;
    }
    return 0;
  });

  // Computed signal for balance
  public breakdownBalance = computed(() => {
    return this.breakdownGrandTotal() - this.paidAmount();
  });

  constructor() {
    // Set up listener for room array changes
    const roomsArray = this.getRoomsFormArray();
    if (roomsArray) {
      roomsArray.valueChanges.subscribe(() => {
        this.roomsChangeCounter.update(count => count + 1);
      });
    }

    // Set up listener for pricing form changes
    effect(() => {
      const form = this.reservationForm();
      if (form) {
        const pricingGroup = form.get('pricing') as FormGroup;
        if (pricingGroup) {
          pricingGroup.valueChanges.subscribe(() => {
            this.pricingChangeCounter.update(count => count + 1);
          });
        }
      }
    }, { allowSignalWrites: true });

    // Effect to update top-level pricing form with breakdown values
    effect(() => {
      const form = this.reservationForm();
      const pricingGroup = form?.get('pricing') as FormGroup;
      
      if (pricingGroup) {
        // Update pricing with calculated values
        pricingGroup.patchValue({
          subtotal: this.breakdownSubtotal(),
          taxes: this.breakdownTaxes(),
          fees: {
            serviceFee: this.breakdownServiceFee(),
            cleaningFee: this.breakdownCleaningFee(),
            resortFee: this.breakdownResortFee(),
            other: this.breakdownOtherFees()
          },
          discounts: this.breakdownDiscount(),
          total: this.breakdownGrandTotal(),
          balance: this.breakdownBalance()
        }, { emitEvent: false });
      }
    });
  }
}
