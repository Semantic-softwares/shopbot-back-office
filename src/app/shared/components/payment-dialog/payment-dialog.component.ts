import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

export interface PaymentDialogData {
  totalAmount: number;
  currency: string;
  /** When true (quick sales), payment can't be skipped — "Skip Payment" is hidden. */
  requirePayment?: boolean;
}

export interface PaymentDialogResult {
  action: 'confirm' | 'skip';
  paymentMethod?: {
    name: string;
    id: string;
  };
  note?: string;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './payment-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './payment-dialog.component.scss',
})
export class PaymentDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  readonly data = inject<PaymentDialogData>(MAT_DIALOG_DATA);

  selectedPaymentMethod = signal<string>('');
  note = signal<string>('');

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
      paymentMethod: method ? { name: method.name, id: method.id } : undefined,
      note: this.note().trim()
    };
    this.dialogRef.close(result);
  }

  onSkipPayment(): void {
    const result: PaymentDialogResult = {
      action: 'skip',
      note: this.note().trim()
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
