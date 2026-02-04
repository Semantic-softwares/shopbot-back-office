import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

export interface PaymentDialogData {
  totalAmount: number;
  currency: string;
}

export interface PaymentDialogResult {
  action: 'confirm' | 'skip';
  paymentMethod?: {
    name: string;
    id: string;
  };
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss',
})
export class PaymentDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  readonly data = inject<PaymentDialogData>(MAT_DIALOG_DATA);

  selectedPaymentMethod = signal<string>('');

  paymentMethods = [
    { id: 'POS', name: 'POS Terminal', icon: 'credit_card' },
    { id: 'Transfer', name: 'Transfer', icon: 'swap_horizontal_circle' },
    { id: 'Cash', name: 'Cash', icon: 'payments' }
  ];

  onPaymentMethodChange(methodId: string): void {
    this.selectedPaymentMethod.set(methodId);
  }

  onConfirmPayment(): void {
    const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod());
    const result: PaymentDialogResult = {
      action: 'confirm',
      paymentMethod: method ? { name: method.name, id: method.id } : undefined
    };
    this.dialogRef.close(result);
  }

  onSkipPayment(): void {
    const result: PaymentDialogResult = {
      action: 'skip'
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
