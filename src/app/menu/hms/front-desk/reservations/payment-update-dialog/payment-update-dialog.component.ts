import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { Reservation } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { QueryParamService } from '../../../../../shared/services/query-param.service';
import { CurrencyMaskModule } from 'ng2-currency-mask';

export interface PaymentUpdateDialogData {
  reservation: Reservation;
  isCheckoutFlow?: boolean;
}

export interface PaymentUpdateResult {
  confirmed: boolean;
  paymentData?: {
    amount?: number;
    status?: 'paid' | 'partial' | 'pending';
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
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    CurrencyMaskModule
  ],
  templateUrl: './payment-update-dialog.component.html',
  styleUrl: './payment-update-dialog.component.scss'
})
export class PaymentUpdateDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentUpdateDialogComponent>);
  public data = inject<PaymentUpdateDialogData>(MAT_DIALOG_DATA);
  public storeStore = inject(StoreStore);
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  
  private currentUser = toSignal(this.authService.currentUser, { initialValue: null });
  private queryParamService = inject(QueryParamService);
  public processing = signal(false);
  public loadingTransactions = signal(false);
  public transactions = signal<any[]>([]);
  public loadError = signal<string | null>(null);
  
  // Payment summary signals
  public totalAmount = signal(0);
  paidAmount = signal(0);
  balanceAmount = signal(0);
  
  // Computed signals
  paymentPercentage = computed(() => {
    const total = this.totalAmount();
    const paid = this.paidAmount();
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  });

  absBalanceAmount = computed(() => {
    return Math.abs(this.balanceAmount());
  });

  displayedColumns: string[] = ['date', 'amount', 'method', 'type', 'notes', 'balance'];
  
  paymentForm: FormGroup = this.fb.group({
    amount: [0],
    status: [''],
    method: ['', Validators.required],
    reference: [''],
    notes: [''],
    type: ['payment'] // 'payment' or 'refund'
  });

  constructor() {
    if (this.data.reservation.status === 'checked_out' && !this.data.isCheckoutFlow) {
      setTimeout(() => {
        this.dialogRef.close({ 
          confirmed: false, 
          error: 'Cannot edit payment information for checked-out reservations' 
        });
      });
      return;
    }
  }

  ngOnInit(): void {
    this.initializePaymentData();
    this.loadTransactions();
  }

  private initializePaymentData(): void {
    const reservation = this.data.reservation;
    this.totalAmount.set(reservation.pricing.total);
    this.paidAmount.set(reservation.pricing.paid);
    this.balanceAmount.set(reservation.pricing.balance);

    const currentStatus = this.getCurrentPaymentStatus();
    const currentMethod = reservation.paymentInfo?.method || 'cash';

    if (this.data.isCheckoutFlow) {
      // If balance is negative, default to refund type
      const isRefund = this.balanceAmount() < 0;
      this.paymentForm.get('type')?.setValue(isRefund ? 'refund' : 'payment');
      this.paymentForm.get('amount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        isRefund
          ? Validators.max(Math.abs(this.balanceAmount()) || 0)
          : Validators.max(this.balanceAmount() || 0)
      ]);
      this.paymentForm.patchValue({
        amount: isRefund ? Math.abs(this.balanceAmount()) : this.balanceAmount() || 0,
        method: currentMethod,
        type: isRefund ? 'refund' : 'payment',
      });
    } else {
      this.paymentForm.get('status')?.setValidators([Validators.required]);
      this.paymentForm.patchValue({
        status: currentStatus,
        method: currentMethod,
      });
    }

    this.paymentForm.updateValueAndValidity();
  }

  private loadTransactions(): void {
    this.loadingTransactions.set(true);
    this.loadError.set(null);
    
    // Get store ID from the store
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      console.error('Store ID not available');
      this.loadingTransactions.set(false);
      this.loadError.set('Store information not available');
      return;
    }

    this.reservationService.getReservationTransactions(storeId, this.data.reservation._id)
      .subscribe({
        next: (transactions) => {
          this.transactions.set(transactions);
          this.loadingTransactions.set(false);
          this.loadError.set(null);
        },
        error: (error) => {
          console.error('Failed to load transactions:', error);
          this.loadingTransactions.set(false);
          
          // Set user-friendly error message
          if (error.status === 404) {
            this.loadError.set('Reservation not found. Please refresh and try again.');
          } else if (error.status === 403) {
            this.loadError.set('You do not have permission to view transactions for this reservation.');
          } else {
            this.loadError.set('Failed to load transaction history. You can still record new payments.');
          }
          
          // Continue even if transaction loading fails - user can still record payments
          this.transactions.set([]);
        }
      });
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

  getCurrentPaymentStatus(): 'pending' | 'partial' | 'paid' {
    const balance = this.balanceAmount();
    const paid = this.paidAmount();
    
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
      // For refund, amount must not exceed abs(balance)
      if (this.paymentForm.get('type')?.value === 'refund') {
        return (
          this.paymentForm.valid &&
          this.balanceAmount() < 0 &&
          this.paymentForm.get('amount')?.value > 0 &&
          this.paymentForm.get('amount')?.value <= Math.abs(this.balanceAmount())
        );
      }
      // For payment, amount must not exceed balance
      return (
        this.paymentForm.valid &&
        this.balanceAmount() > 0 &&
        this.paymentForm.get('amount')?.value > 0 &&
        this.paymentForm.get('amount')?.value <= this.balanceAmount()
      );
    } else {
      const selectedStatus = this.paymentForm.get('status')?.value;
      const balance = this.balanceAmount();
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
    this.queryParamService.remove('paymentRedirection');
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
  this.queryParamService.remove('paymentRedirection');

    if (this.canSave()) {
      this.processing.set(true);
      
      const storeId = this.storeStore.selectedStore()?._id;
      if (!storeId) {
        console.error('Store ID not available');
        this.processing.set(false);
        return;
      }

      // Prepare transaction data
      let transactionData: any;
      const userId = this.currentUser()?._id;

      if (this.data.isCheckoutFlow) {
        // Checkout flow: Create payment or refund transaction
        transactionData = {
          reservation: this.data.reservation._id,
          amount: this.paymentForm.value.amount,
          method: this.paymentForm.value.method,
          type: this.paymentForm.value.type || (this.balanceAmount() < 0 ? 'refund' : 'payment'),
          notes: this.paymentForm.value.notes || undefined,
          processedBy: userId
        };
      } else {
        // Edit flow: Just return the form values for now
        // TODO: Implement actual status update endpoint
        transactionData = {
          reservation: this.data.reservation._id,
          amount: 0,
          method: this.paymentForm.value.method,
          type: 'adjustment',
          notes: this.paymentForm.value.notes || undefined,
          processedBy: userId
        };
      }

      // Create transaction via service
      this.reservationService.createTransaction(
        storeId,
        this.data.reservation._id,
        transactionData
      ).subscribe({
        next: (result) => {
          this.processing.set(false);
          
          // Reload transactions to show the new one
          this.loadTransactions();
          
          // Close dialog with success
          this.dialogRef.close({
            confirmed: true,
            paymentData: transactionData,
            transaction: result
          });
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          this.processing.set(false);
          
          // Show error to user
          let errorMessage = 'Failed to process transaction. Please try again.';
          if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid transaction data';
          } else if (error.status === 404) {
            errorMessage = 'Reservation not found';
          }
          
          alert(errorMessage);
        }
      });
    }
  }
}
