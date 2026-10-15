import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="max-w-md">
      <div class="flex items-center gap-3 p-6 border-b border-gray-200">
        <mat-icon class="text-green-600">payment</mat-icon>
        <div>
          <h2 class="text-xl font-semibold text-gray-900"><ng-container i18n>Extension Payment</ng-container></h2>
          <p class="text-sm text-gray-600"><ng-container i18n>Update payment information for extension approval</ng-container></p>
        </div>
      </div>

      <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
        <!-- Extension Details -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 class="font-medium text-gray-900"><ng-container i18n>Extension Details</ng-container></h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600"><ng-container i18n>Additional Nights:</ng-container></span>
              <span class="font-medium ml-2">{{ data.additionalNights }}</span>
            </div>
            <div>
              <span class="text-gray-600"><ng-container i18n>Extension Cost:</ng-container></span>
              <span class="font-medium ml-2">{{ data.extensionCost | currency: data.currency }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Status -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Payment Status</ng-container></mat-label>
          <mat-select formControlName="paymentStatus">
            <mat-option value="paid"><ng-container i18n>Paid (Full Amount)</ng-container></mat-option>
            <mat-option value="partial"><ng-container i18n>Partial Payment</ng-container></mat-option>
            <mat-option value="pending"><ng-container i18n>Pending Payment</ng-container></mat-option>
          </mat-select>
          <mat-hint><ng-container i18n>Select the current payment status for this extension</ng-container></mat-hint>
        </mat-form-field>

        <!-- Payment Method -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Payment Method</ng-container></mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="cash"><ng-container i18n>Cash</ng-container></mat-option>
            <mat-option value="credit_card"><ng-container i18n>Credit Card</ng-container></mat-option>
            <mat-option value="debit_card"><ng-container i18n>Debit Card</ng-container></mat-option>
            <mat-option value="bank_transfer"><ng-container i18n>Bank Transfer</ng-container></mat-option>
            <mat-option value="mobile_payment"><ng-container i18n>Mobile Payment</ng-container></mat-option>
            <mat-option value="check"><ng-container i18n>Check</ng-container></mat-option>
            <mat-option value="other"><ng-container i18n>Other</ng-container></mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Payment Amount -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Payment Amount</ng-container></mat-label>
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
              <ng-container i18n>Should equal the full extension cost</ng-container>
            } @else if (paymentForm.get('paymentStatus')?.value === 'partial') {
              <ng-container i18n>Enter the amount paid so far</ng-container>
            } @else {
              <ng-container i18n>Enter 0 for pending payment</ng-container>
            }
          </mat-hint>
        </mat-form-field>

        <!-- Transaction Reference -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Transaction Reference</ng-container></mat-label>
          <input
            matInput
            formControlName="transactionReference"
            placeholder="Optional transaction ID or reference" i18n-placeholder>
          <mat-hint><ng-container i18n>Payment confirmation number, receipt ID, etc.</ng-container></mat-hint>
        </mat-form-field>

        <!-- Notes -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Payment Notes</ng-container></mat-label>
          <textarea
            matInput
            rows="3"
            formControlName="notes"
            placeholder="Optional notes about the payment..." i18n-placeholder></textarea>
        </mat-form-field>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            mat-button
            (click)="onCancel()"
            class="px-6">
            <ng-container i18n>Cancel</ng-container>
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
            <ng-container i18n>Approve Extension</ng-container>
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