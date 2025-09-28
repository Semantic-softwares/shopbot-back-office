import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface ExtensionPaymentData {
  extensionId: string;
  reservationId: string;
  extensionCost: number;
  currency: string;
  additionalNights: number;
}

export interface ExtensionPaymentResult {
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod: string;
  paymentAmount: number;
  transactionReference?: string;
  notes?: string;
}

@Component({
  selector: 'app-extension-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="max-w-md">
      <div class="flex items-center gap-3 p-6 border-b border-gray-200">
        <mat-icon class="text-green-600">payment</mat-icon>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Extension Payment</h2>
          <p class="text-sm text-gray-600">Update payment information for extension approval</p>
        </div>
      </div>

      <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
        <!-- Extension Details -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 class="font-medium text-gray-900">Extension Details</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Additional Nights:</span>
              <span class="font-medium ml-2">{{ data.additionalNights }}</span>
            </div>
            <div>
              <span class="text-gray-600">Extension Cost:</span>
              <span class="font-medium ml-2">{{ data.extensionCost | currency: data.currency }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Status -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Payment Status</mat-label>
          <mat-select formControlName="paymentStatus">
            <mat-option value="paid">Paid (Full Amount)</mat-option>
            <mat-option value="partial">Partial Payment</mat-option>
            <mat-option value="pending">Pending Payment</mat-option>
          </mat-select>
          <mat-hint>Select the current payment status for this extension</mat-hint>
        </mat-form-field>

        <!-- Payment Method -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="cash">Cash</mat-option>
            <mat-option value="credit_card">Credit Card</mat-option>
            <mat-option value="debit_card">Debit Card</mat-option>
            <mat-option value="bank_transfer">Bank Transfer</mat-option>
            <mat-option value="mobile_payment">Mobile Payment</mat-option>
            <mat-option value="check">Check</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Payment Amount -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Payment Amount</mat-label>
          <input
            matInput
            type="number"
            step="0.01"
            min="0"
            [max]="data.extensionCost"
            formControlName="paymentAmount"
            placeholder="0.00">
          <span matSuffix>{{ data.currency }}</span>
          <mat-hint>
            @if (paymentForm.get('paymentStatus')?.value === 'paid') {
              Should equal the full extension cost
            } @else if (paymentForm.get('paymentStatus')?.value === 'partial') {
              Enter the amount paid so far
            } @else {
              Enter 0 for pending payment
            }
          </mat-hint>
        </mat-form-field>

        <!-- Transaction Reference -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Transaction Reference</mat-label>
          <input
            matInput
            formControlName="transactionReference"
            placeholder="Optional transaction ID or reference">
          <mat-hint>Payment confirmation number, receipt ID, etc.</mat-hint>
        </mat-form-field>

        <!-- Notes -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Payment Notes</mat-label>
          <textarea
            matInput
            rows="3"
            formControlName="notes"
            placeholder="Optional notes about the payment..."></textarea>
        </mat-form-field>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            mat-button
            (click)="onCancel()"
            class="px-6">
            Cancel
          </button>
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="paymentForm.invalid || submitting()"
            class="px-6">
            @if (submitting()) {
              <mat-icon class="animate-spin mr-2">refresh</mat-icon>
            }
            Approve Extension
          </button>
        </div>
      </form>
    </div>
  `
})
export class ExtensionPaymentDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ExtensionPaymentDialogComponent>);
  private fb = inject(FormBuilder);
  
  data: ExtensionPaymentData = inject(MAT_DIALOG_DATA);
  submitting = signal(false);

  paymentForm: FormGroup = this.fb.group({
    paymentStatus: ['paid', [Validators.required]],
    paymentMethod: ['', [Validators.required]],
    paymentAmount: [0, [Validators.required, Validators.min(0)]],
    transactionReference: [''],
    notes: ['']
  });

  ngOnInit(): void {
    // Set default payment amount to full extension cost
    this.paymentForm.patchValue({
      paymentAmount: this.data.extensionCost
    });

    // Update payment amount based on status
    this.paymentForm.get('paymentStatus')?.valueChanges.subscribe(status => {
      const amountControl = this.paymentForm.get('paymentAmount');
      if (status === 'paid') {
        amountControl?.setValue(this.data.extensionCost);
        amountControl?.setValidators([
          Validators.required, 
          Validators.min(this.data.extensionCost)
        ]);
      } else if (status === 'pending') {
        amountControl?.setValue(0);
        amountControl?.setValidators([
          Validators.required, 
          Validators.min(0), 
          Validators.max(0)
        ]);
      } else { // partial
        amountControl?.setValidators([
          Validators.required, 
          Validators.min(0.01), 
          Validators.max(this.data.extensionCost - 0.01)
        ]);
      }
      amountControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.submitting.set(true);
      
      const result: ExtensionPaymentResult = {
        paymentStatus: this.paymentForm.value.paymentStatus,
        paymentMethod: this.paymentForm.value.paymentMethod,
        paymentAmount: this.paymentForm.value.paymentAmount,
        transactionReference: this.paymentForm.value.transactionReference || undefined,
        notes: this.paymentForm.value.notes || undefined
      };

      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}