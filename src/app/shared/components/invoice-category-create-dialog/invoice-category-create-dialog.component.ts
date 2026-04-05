import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoiceCategoryApiService } from '../../services/invoice-category-api.service';
import { FinancialSide } from '../../enums/financial.enums';

@Component({
  selector: 'app-invoice-category-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './invoice-category-create-dialog.component.html',
  styleUrl: './invoice-category-create-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceCategoryCreateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InvoiceCategoryCreateDialogComponent>);
  private categoryApi = inject(InvoiceCategoryApiService);
  private snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);
  readonly sideOptions = Object.values(FinancialSide);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.minLength(2)]],
    side: [FinancialSide.INCOME, Validators.required],
    description: [''],
  });

  normalizeCode(): void {
    const current = this.form.controls.code.value || '';
    const normalized = current
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    this.form.controls.code.setValue(normalized);
  }

  useNameAsCode(): void {
    const name = this.form.controls.name.value || '';
    const generated = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    this.form.controls.code.setValue(generated);
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const value = this.form.getRawValue();
    const name = value.name?.trim() || '';
    const code = value.code?.trim().toUpperCase() || '';

    this.categoryApi
      .create({
        name,
        code,
        side: value.side!,
        description: value.description?.trim() || undefined,
        allowOnLeaseTransactions: true,
        allowManualInvoiceCreation: true,
      })
      .subscribe({
        next: (res) => {
          this.snackBar.open('Invoice category created', 'Close', { duration: 2500 });
          this.dialogRef.close(res.data);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to create category', 'Close', {
            duration: 4500,
          });
        },
      });
  }
}
