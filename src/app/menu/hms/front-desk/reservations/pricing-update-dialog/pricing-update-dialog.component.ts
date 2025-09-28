import { Component, Inject, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { Reservation } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';

export interface PricingUpdateDialogData {
  reservation: Reservation;
}

export interface PricingUpdateDialogResult {
  success: boolean;
  updatedReservation?: Reservation;
}

@Component({
  selector: 'app-pricing-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './pricing-update-dialog.component.html',
  styleUrls: ['./pricing-update-dialog.component.scss']
})
export class PricingUpdateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PricingUpdateDialogComponent>);
  private reservationService = inject(ReservationService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  pricingForm: FormGroup;
  loading = signal(false);
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PricingUpdateDialogData
  ) {
    // Validate that the reservation can be edited
    if (this.data.reservation.status === 'checked_out') {
      // Create a minimal form to prevent compilation errors
      this.pricingForm = this.fb.group({});
      
      setTimeout(() => {
        this.dialogRef.close({ 
          confirmed: false, 
          error: 'Cannot edit pricing for checked-out reservations' 
        });
      });
      return;
    }

    const pricing = this.data.reservation.pricing;
    
    this.pricingForm = this.fb.group({
      subtotal: [{value: pricing.subtotal || 0, disabled: true}], // Read-only
      taxes: [{value: pricing.taxes || 0, disabled: true}], // Read-only
      fees: this.fb.group({
        serviceFee: [{value: pricing.fees?.serviceFee || 0, disabled: true}], // Read-only
        cleaningFee: [{value: pricing.fees?.cleaningFee || 0, disabled: true}], // Read-only
        resortFee: [{value: pricing.fees?.resortFee || 0, disabled: true}], // Read-only
        other: [{value: pricing.fees?.other || 0, disabled: true}] // Read-only
      }),
      discounts: this.fb.group({
        amount: [pricing.discounts?.amount || 0, [Validators.min(0)]], // Editable
        reason: [pricing.discounts?.reason || ''], // Editable
        code: [pricing.discounts?.code || ''] // Editable
      }),
      paid: [pricing.paid || 0, [Validators.min(0)]] // Editable - Amount Paid
    });

    // Listen for form changes to update total
    this.pricingForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  get currency(): string {
    return this.storeStore.selectedStore()?.currency || this.storeStore.selectedStore()?.currencyCode || 'USD';
  }

  getApprovedExtensionCost(): number {
    if (this.data.reservation.extensions) {
      const approvedExtensions = this.data.reservation.extensions.filter(ext => ext.status === 'approved');
      return approvedExtensions.reduce((total, ext) => total + (ext.additionalCost || 0), 0);
    }
    return 0;
  }

  getApprovedExtensionNights(): number {
    if (this.data.reservation.extensions) {
      const approvedExtensions = this.data.reservation.extensions.filter(ext => ext.status === 'approved');
      return approvedExtensions.reduce((total, ext) => total + (ext.additionalNights || 0), 0);
    }
    return 0;
  }

  hasApprovedExtensions(): boolean {
    return this.getApprovedExtensionCost() > 0;
  }

  get currentTotal(): number {
    // Use the original pricing values (read-only) but apply the new discount
    const originalPricing = this.data.reservation.pricing;
    const formValue = this.pricingForm.value;
    
    const subtotal = originalPricing.subtotal || 0;
    const taxes = originalPricing.taxes || 0;
    const serviceFee = originalPricing.fees?.serviceFee || 0;
    const cleaningFee = originalPricing.fees?.cleaningFee || 0;
    const resortFee = originalPricing.fees?.resortFee || 0;
    const otherFee = originalPricing.fees?.other || 0;
    const extensionCost = this.getApprovedExtensionCost(); // Add extension costs
    const discount = formValue.discounts?.amount || 0;

    const totalFees = serviceFee + cleaningFee + resortFee + otherFee;
    return subtotal + taxes + totalFees + extensionCost - discount;
  }

  get currentBalance(): number {
    const amountPaid = this.pricingForm.get('paid')?.value || 0;
    return this.currentTotal - amountPaid;
  }

  private calculateTotal(): void {
    // This method exists to trigger change detection for computed values
    // The actual calculation is done in the getter
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  onSave(): void {
    if (this.pricingForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading.set(true);

    const formValue = this.pricingForm.value;
    const originalPricing = this.data.reservation.pricing;
    
    const updatedPricing = {
      // Keep original values for subtotal, taxes, and fees (read-only)
      subtotal: originalPricing.subtotal,
      taxes: originalPricing.taxes,
      fees: {
        serviceFee: originalPricing.fees?.serviceFee || 0,
        cleaningFee: originalPricing.fees?.cleaningFee || 0,
        resortFee: originalPricing.fees?.resortFee || 0,
        other: originalPricing.fees?.other || 0
      },
      // Update discounts and paid amount (editable)
      discounts: {
        amount: formValue.discounts.amount,
        reason: formValue.discounts.reason,
        code: formValue.discounts.code
      },
      total: this.currentTotal,
      paid: formValue.paid || 0,
      balance: this.currentBalance
    };

    this.reservationService.updateReservation(this.data.reservation._id, { pricing: updatedPricing })
      .subscribe({
        next: (updatedReservation: Reservation) => {
          this.loading.set(false);
          this.snackBar.open('Pricing updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close({ success: true, updatedReservation });
        },
        error: (error: any) => {
          this.loading.set(false);
          console.error('Error updating pricing:', error);
          this.snackBar.open(
            error.message || 'Failed to update pricing', 
            'Close', 
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }
}