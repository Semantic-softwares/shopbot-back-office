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
    amount: number;
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
          @if (data.isCheckoutFlow) {
            Payment Required for Checkout
          } @else {
            Update Payment
          }
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Confirmation: {{ data.reservation.confirmationNumber }}
        </p>
        @if (data.isCheckoutFlow) {
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div class="flex items-center">
              <mat-icon class="text-amber-600 mr-2">warning</mat-icon>
              <div class="text-sm text-amber-800">
                <strong>Payment Required:</strong> This reservation has an outstanding balance that must be cleared before checkout.
              </div>
            </div>
          </div>
        }
      </div>

      <mat-dialog-content class="space-y-4">
        <!-- Current Payment Summary -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Current Payment Status</h3>
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
              <span class="text-gray-600">Payment Status:</span>
              <div class="font-semibold" 
                   [class]="data.reservation.paymentInfo?.status === 'paid' ? 'text-green-600' : 'text-orange-600'">
                {{ data.reservation.paymentInfo?.status | titlecase }}
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Form -->
        <form [formGroup]="paymentForm" class="space-y-4">
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
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-2 pt-4">
        <button mat-button 
                (click)="onCancel()"
                class="text-gray-600 hover:text-gray-800">
          @if (data.isCheckoutFlow) {
            Cancel Checkout
          } @else {
            Cancel
          }
        </button>
        <button mat-raised-button 
                color="primary"
                [disabled]="paymentForm.invalid || processing()"
                (click)="onConfirm()"
                class="min-w-[160px]">
          @if (processing()) {
            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
          }
          <span>
            @if (data.isCheckoutFlow) {
              {{ processing() ? 'Processing...' : 'Pay & Checkout' }}
            } @else {
              {{ processing() ? 'Processing...' : 'Record Payment' }}
            }
          </span>
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

  paymentForm: FormGroup = this.fb.group({
    amount: [
      this.data.reservation.pricing.balance || 0, 
      [
        Validators.required, 
        Validators.min(0.01),
        Validators.max(this.data.reservation.pricing.balance || 0)
      ]
    ],
    method: ['', Validators.required],
    reference: [''],
    notes: ['']
  });

  get currency(): string {
    return this.storeStore.selectedStore()?.currencyCode || this.storeStore.selectedStore()?.currency || '$';
  }

  setAmount(amount: number): void {
    this.paymentForm.patchValue({ amount });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (this.paymentForm.valid) {
      this.processing.set(true);
      
      const result: PaymentUpdateResult = {
        confirmed: true,
        paymentData: {
          amount: this.paymentForm.value.amount,
          method: this.paymentForm.value.method,
          reference: this.paymentForm.value.reference || undefined,
          notes: this.paymentForm.value.notes || undefined
        }
      };

      // Simulate processing delay (remove in production)
      setTimeout(() => {
        this.processing.set(false);
        this.dialogRef.close(result);
      }, 1000);
    }
  }
}