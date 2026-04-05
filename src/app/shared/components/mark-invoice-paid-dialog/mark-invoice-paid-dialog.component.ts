import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EstateInvoice, EstatePaymentMethod } from '../../models/estate.model';

export interface MarkInvoicePaidDialogData {
  invoice: EstateInvoice;
}

export interface MarkInvoicePaidDialogResult {
  paymentDate: string;
  amount: number;
  paymentMethod: EstatePaymentMethod;
  note?: string;
}

@Component({
  selector: 'app-mark-invoice-paid-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './mark-invoice-paid-dialog.component.html',
  styleUrl: './mark-invoice-paid-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkInvoicePaidDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<MarkInvoicePaidDialogComponent, MarkInvoicePaidDialogResult>,
  );
  readonly data = inject<MarkInvoicePaidDialogData>(MAT_DIALOG_DATA);
  readonly form = this.fb.group({
    paymentDate: [this.defaultDate(), Validators.required],
    amount: [this.data.invoice.balance, [Validators.required, Validators.min(0.01)]],
    paymentMethod: [EstatePaymentMethod.CASH, Validators.required],
    note: ['', [Validators.maxLength(150)]],
  });

  readonly paymentMethodOptions = [
    EstatePaymentMethod.CASH,
    EstatePaymentMethod.BANK_TRANSFER,
    EstatePaymentMethod.CARD,
    EstatePaymentMethod.ONLINE,
    EstatePaymentMethod.OTHER,
  ];

  get balance(): number {
    return this.data.invoice.balance;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const amount = Number(value.amount || 0);

    if (amount > this.balance) {
      this.form.controls.amount.setErrors({ exceedsBalance: true });
      return;
    }

    const date = value.paymentDate as Date;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    this.dialogRef.close({
      paymentDate: `${yyyy}-${mm}-${dd}`,
      amount,
      paymentMethod: (value.paymentMethod || EstatePaymentMethod.CASH) as EstatePaymentMethod,
      note: value.note?.trim() || undefined,
    });
  }

  private defaultDate(): Date {
    return new Date();
  }
}
