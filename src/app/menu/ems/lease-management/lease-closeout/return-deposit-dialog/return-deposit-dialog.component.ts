import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface ReturnDepositDialogTenant {
  id: string;
  name: string;
}

export interface ReturnDepositDialogData {
  currencyCode: string;
  totalDeposit: number;
  availableDeposit: number;
  tenants: ReturnDepositDialogTenant[];
}

export interface ReturnDepositDialogResult {
  tenantId?: string;
  amount: number;
  markAsPaid: boolean;
}

@Component({
  selector: 'app-return-deposit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './return-deposit-dialog.component.html',
  styleUrl: './return-deposit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnDepositDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<ReturnDepositDialogComponent, ReturnDepositDialogResult>,
  );
  readonly data = inject<ReturnDepositDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    tenantId: [
      this.data.tenants.length === 1 ? this.data.tenants[0].id : '',
    ],
    amount: [this.data.availableDeposit, [Validators.required, Validators.min(0.01)]],
    markAsPaid: [true],
  });

  readonly maxAmount = computed(() => this.data.availableDeposit || 0);

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const amount = Number(rawValue.amount || 0);

    if (amount > this.maxAmount()) {
      this.form.controls.amount.setErrors({ exceedsDeposit: true });
      return;
    }

    const tenantId = rawValue.tenantId?.trim();

    this.dialogRef.close({
      tenantId: tenantId || undefined,
      amount,
      markAsPaid: !!rawValue.markAsPaid,
    });
  }
}
