import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Reservation } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';

export interface PaymentUpdateDialogData {
  reservation: Reservation;
  isCheckoutFlow?: boolean; // Flag to indicate this is part of checkout process
}

export interface PaymentUpdateResult {
  confirmed: boolean;
  paymentData?: {
    // For checkout flow (amount-based payment)
    amount?: number;
    // For status update flow
    status?: 'paid' | 'partial' | 'pending';
    // Common fields
    method: string;
    reference?: string;
    notes?: string;
  };
}

@Component({
  selector: 'app-payment-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="payment-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title class="text-xl font-semibold text-gray-900 mb-1">
          Update Payment Information
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Confirmation: {{ data.reservation.confirmationNumber }}
        </p>
      </div>

      <mat-dialog-content class="space-y-4">
        <!-- Current Payment Summary -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Current Status</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Total Amount:</span>
              <div class="font-semibold">{{ currency }}{{ data.reservation.pricing.total | number:'1.2-2' }}</div>
            </div>
            <div>
              <span class="text-gray-600">Amount Paid:</span>
              <div class="font-semibold text-green-600">{{ currency }}{{ data.reservation.pricing.paid | number:'1.2-2' }}</div>
            </div>
            <div>
              <span class="text-gray-600">Balance Due:</span>
              <div class="font-semibold" [class]="data.reservation.pricing.balance > 0 ? 'text-red-600' : 'text-green-600'">
                {{ currency }}{{ data.reservation.pricing.balance | number:'1.2-2' }}
              </div>
            </div>
            <div>
              <span class="text-gray-600">Current Status:</span>
              <div class="font-semibold" 
                   [class]="getCurrentStatusClass()">
                {{ getCurrentPaymentStatus() | titlecase }}
              </div>
            </div>
          </div>
        </div>

        <!-- Extension Information -->
        @if (hasApprovedExtensions()) {
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <mat-icon class="text-orange-600 text-sm">info</mat-icon>
              <div class="text-sm text-orange-800">
                <strong>Extensions Included:</strong> 
                {{ getApprovedExtensionNights() }} extension night(s) totaling 
                {{ currency }}{{ getApprovedExtensionCost() | number:'1.2-2' }} 
                are included in the total above.
              </div>
            </div>
          </div>
        }

        <!-- Payment Form -->
        <form [formGroup]="paymentForm" class="space-y-4">
          @if (data.isCheckoutFlow) {
            <!-- Amount-based form for checkout flow -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Payment Amount -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Payment Amount</mat-label>
                <span matPrefix>{{ currency }}&nbsp;</span>
                <input matInput 
                       type="number" 
                       step="0.01" 
                       min="0"
                       [max]="data.reservation.pricing.balance"
                       formControlName="amount"
                       placeholder="0.00">
                <mat-icon matSuffix>attach_money</mat-icon>
                @if (paymentForm.get('amount')?.hasError('required')) {
                  <mat-error>Amount is required</mat-error>
                }
                @if (paymentForm.get('amount')?.hasError('min')) {
                  <mat-error>Amount must be greater than 0</mat-error>
                }
                @if (paymentForm.get('amount')?.hasError('max')) {
                  <mat-error>Amount cannot exceed balance due</mat-error>
                }
              </mat-form-field>

              <!-- Payment Method -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="method">
                  <mat-option value="cash">Cash</mat-option>
                  <mat-option value="credit_card">Credit Card</mat-option>
                  <mat-option value="debit_card">Debit Card</mat-option>
                  <mat-option value="bank_transfer">Bank Transfer</mat-option>
                  <mat-option value="check">Check</mat-option>
                  <mat-option value="mobile_payment">Mobile Payment</mat-option>
                  <mat-option value="other">Other</mat-option>
                </mat-select>
                @if (paymentForm.get('method')?.hasError('required')) {
                  <mat-error>Payment method is required</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Reference Number -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Reference Number (Optional)</mat-label>
              <input matInput 
                     formControlName="reference"
                     placeholder="Transaction ID, Check number, etc.">
              <mat-icon matSuffix>receipt</mat-icon>
            </mat-form-field>

            <!-- Notes -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Notes (Optional)</mat-label>
              <textarea matInput 
                        formControlName="notes"
                        rows="3"
                        placeholder="Additional payment notes..."></textarea>
              <mat-icon matSuffix>note</mat-icon>
            </mat-form-field>

            <!-- Quick Amount Buttons -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700">Quick Amounts</h4>
              <div class="flex flex-wrap gap-2">
                <button type="button" 
                        class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                        (click)="setAmount(data.reservation.pricing.balance)">
                  Full Balance ({{ currency }}{{ data.reservation.pricing.balance | number:'1.2-2' }})
                </button>
                @if (data.reservation.pricing.balance >= 100) {
                  <button type="button" 
                          class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                          (click)="setAmount(100)">
                    {{ currency }}100
                  </button>
                }
                @if (data.reservation.pricing.balance >= 50) {
                  <button type="button" 
                          class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                          (click)="setAmount(50)">
                    {{ currency }}50
                  </button>
                }
              </div>
            </div>
          } @else {
            <!-- Status-based form for regular updates -->
            <!-- Payment Status -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Payment Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="pending">Pending Payment</mat-option>
                <mat-option value="partial">Partial Payment</mat-option>
                <mat-option value="paid">Paid in Full</mat-option>
              </mat-select>
              <mat-icon matSuffix>payment</mat-icon>
              <mat-hint>Select the current payment status</mat-hint>
              @if (paymentForm.get('status')?.hasError('required')) {
                <mat-error>Payment status is required</mat-error>
              }
            </mat-form-field>

            <!-- Payment Method -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Payment Method</mat-label>
              <mat-select formControlName="method">
                <mat-option value="cash">Cash</mat-option>
                <mat-option value="credit_card">Credit Card</mat-option>
                <mat-option value="debit_card">Debit Card</mat-option>
                <mat-option value="bank_transfer">Bank Transfer</mat-option>
                <mat-option value="check">Check</mat-option>
                <mat-option value="mobile_payment">Mobile Payment</mat-option>
                <mat-option value="other">Other</mat-option>
              </mat-select>
              <mat-icon matSuffix>account_balance</mat-icon>
              <mat-hint>How was/will the payment be made?</mat-hint>
              @if (paymentForm.get('method')?.hasError('required')) {
                <mat-error>Payment method is required</mat-error>
              }
            </mat-form-field>

            <!-- Reference Number -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Transaction Reference (Optional)</mat-label>
              <input matInput 
                     formControlName="reference"
                     placeholder="Transaction ID, Receipt number, etc.">
              <mat-icon matSuffix>receipt</mat-icon>
            </mat-form-field>

            <!-- Notes -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Payment Notes (Optional)</mat-label>
              <textarea matInput 
                        formControlName="notes"
                        rows="3"
                        placeholder="Additional notes about the payment..."></textarea>
              <mat-icon matSuffix>note</mat-icon>
            </mat-form-field>

            <!-- Balance Warning for "Paid" Status -->
            @if (paymentForm.get('status')?.value === 'paid' && data.reservation.pricing.balance > 0) {
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <div class="flex items-start gap-2">
                  <mat-icon class="text-red-600 text-sm mt-0.5">warning</mat-icon>
                  <div class="text-sm text-red-800">
                    <strong>Cannot mark as "Paid in Full":</strong> 
                    There is still an outstanding balance of 
                    <strong>{{ currency }}{{ data.reservation.pricing.balance | number:'1.2-2' }}</strong>.
                    <br>
                    Please use "Partial Payment" status or record additional payments to clear the balance first.
                  </div>
                </div>
              </div>
            }
          }
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-2 pt-4">
        <button mat-button 
                (click)="onCancel()"
                class="text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button mat-raised-button 
                color="primary"
                [disabled]="!canSave() || processing()"
                (click)="onConfirm()"
                class="min-w-[140px]">
          @if (processing()) {
            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
            Updating...
          } @else {
            Update Payment
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .payment-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    .dialog-header {
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      border-top: 1px solid #e5e7eb;
      margin-top: 16px;
      padding-top: 16px;
    }

    .mat-mdc-form-field {
      margin-bottom: 0;
    }
  `]
})
export class PaymentUpdateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentUpdateDialogComponent>);
  public data = inject<PaymentUpdateDialogData>(MAT_DIALOG_DATA);
  private storeStore = inject(StoreStore);

  processing = signal(false);
  
  constructor() {
    // Validate that the reservation can be edited
    if (this.data.reservation.status === 'checked_out' && !this.data.isCheckoutFlow) {
      // For non-checkout flows, prevent editing of checked-out reservations
      setTimeout(() => {
        this.dialogRef.close({ 
          confirmed: false, 
          error: 'Cannot edit payment information for checked-out reservations' 
        });
      });
      return;
    }

    // Debug: Log reservation data when dialog opens
    console.log('PaymentUpdateDialog opened with reservation:', this.data.reservation);
    console.log('Reservation extensions:', this.data.reservation.extensions);
    if (this.data.reservation.extensions) {
      this.data.reservation.extensions.forEach((ext, index) => {
        console.log(`Extension ${index}:`, {
          status: ext.status,
          additionalCost: ext.additionalCost,
          additionalNights: ext.additionalNights
        });
      });
    }

    // Initialize form with current values
    this.initializeForm();
  }

  private initializeForm(): void {
    const currentStatus = this.getCurrentPaymentStatus();
    const currentMethod = this.data.reservation.paymentInfo?.method || 'cash';
    
    if (this.data.isCheckoutFlow) {
      // For checkout flow, add amount validation and set default amount
      this.paymentForm.get('amount')?.setValidators([
        Validators.required, 
        Validators.min(0.01),
        Validators.max(this.data.reservation.pricing.balance || 0)
      ]);
      this.paymentForm.patchValue({
        amount: this.data.reservation.pricing.balance || 0,
        method: currentMethod,
        reference: '',
        notes: ''
      });
    } else {
      // For status update flow
      this.paymentForm.get('status')?.setValidators([Validators.required]);
      this.paymentForm.patchValue({
        status: currentStatus,
        method: currentMethod,
        reference: '',
        notes: ''
      });
    }
    
    this.paymentForm.updateValueAndValidity();
  }

  paymentForm: FormGroup = this.fb.group({
    // Fields for checkout flow (amount-based)
    amount: [0],
    // Fields for status update flow
    status: [''],
    // Common fields
    method: ['', Validators.required],
    reference: [''],
    notes: ['']
  });

  get currency(): string {
    return this.storeStore.selectedStore()?.currencyCode || this.storeStore.selectedStore()?.currency || '$';
  }

  get isReservationCheckedOut(): boolean {
    return this.data.reservation.status === 'checked_out';
  }

  getApprovedExtensionCost(): number {
    console.log('Extension debugging:', {
      hasExtensions: !!this.data.reservation.extensions,
      extensions: this.data.reservation.extensions,
      extensionCount: this.data.reservation.extensions?.length || 0
    });
    
    if (this.data.reservation.extensions) {
      const approvedExtensions = this.data.reservation.extensions.filter(ext => ext.status === 'approved');
      console.log('Approved extensions:', approvedExtensions);
      const cost = approvedExtensions.reduce((total, ext) => total + (ext.additionalCost || 0), 0);
      console.log('Total approved extension cost:', cost);
      return cost;
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

  getCurrentPaymentStatus(): 'pending' | 'partial' | 'paid' {
    const balance = this.data.reservation.pricing.balance || 0;
    const paid = this.data.reservation.pricing.paid || 0;
    
    if (balance <= 0) {
      return 'paid';
    } else if (paid > 0) {
      return 'partial';
    } else {
      return 'pending';
    }
  }

  getCurrentStatusClass(): string {
    const status = this.getCurrentPaymentStatus();
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'partial':
        return 'text-orange-600';
      case 'pending':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  canSave(): boolean {
    if (!this.paymentForm.valid) {
      return false;
    }

    if (this.data.isCheckoutFlow) {
      // For checkout flow, just validate the form
      return this.paymentForm.valid;
    } else {
      // For status updates, prevent marking as "paid" when there's still a balance
      const selectedStatus = this.paymentForm.get('status')?.value;
      const balance = this.data.reservation.pricing.balance || 0;
      
      if (selectedStatus === 'paid' && balance > 0) {
        return false;
      }
    }

    return true;
  }

  setAmount(amount: number): void {
    this.paymentForm.patchValue({ amount });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (this.canSave()) {
      this.processing.set(true);
      
      let result: PaymentUpdateResult;
      
      if (this.data.isCheckoutFlow) {
        // For checkout flow, return amount-based data
        result = {
          confirmed: true,
          paymentData: {
            amount: this.paymentForm.value.amount,
            method: this.paymentForm.value.method,
            reference: this.paymentForm.value.reference || undefined,
            notes: this.paymentForm.value.notes || undefined
          }
        };
      } else {
        // For status update flow, return status-based data
        result = {
          confirmed: true,
          paymentData: {
            status: this.paymentForm.value.status,
            method: this.paymentForm.value.method,
            reference: this.paymentForm.value.reference || undefined,
            notes: this.paymentForm.value.notes || undefined
          }
        };
      }

      // Simulate processing delay (remove in production)
      setTimeout(() => {
        this.processing.set(false);
        this.dialogRef.close(result);
      }, 1000);
    }
  }
}