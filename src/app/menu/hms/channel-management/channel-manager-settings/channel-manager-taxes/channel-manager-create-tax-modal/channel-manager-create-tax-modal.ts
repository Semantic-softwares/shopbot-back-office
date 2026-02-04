import { ChangeDetectionStrategy, Component, Inject, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tax, TaxService } from '../../../../../../shared/services/tax.service';

export interface CreateTaxModalData {
  tax?: Tax;
  propertyId: string;
}

@Component({
  selector: 'app-channel-manager-create-tax-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonToggleModule,
  ],
  templateUrl: './channel-manager-create-tax-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerCreateTaxModal {
  private fb = inject(FormBuilder);
  private taxService = inject(TaxService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ChannelManagerCreateTaxModal>);
  private destroyRef = inject(DestroyRef);
  @Inject(MAT_DIALOG_DATA) data = inject(MAT_DIALOG_DATA) as CreateTaxModalData;

  taxForm!: FormGroup;
  isSaving = signal(false);
  isEditing = signal(false);
  additionalInfoExpanded = signal(false);
  applicableDatesExpanded = signal(false);

  constructor() {
    this.initializeForm();
    if (this.data.tax) {
      this.isEditing.set(true);
      this.additionalInfoExpanded.set(true);
      this.applicableDatesExpanded.set(true);
      this.populateForm(this.data.tax);
    }
  }

  private initializeForm() {
    this.taxForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      is_inclusive: [false],
      rate: ['', [Validators.required, Validators.min(0)]],
      logic: ['percent', Validators.required],
      type: ['fee', Validators.required],
      currency: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      max_nights: [''],
      skip_nights: [''],
      applicable_date_ranges: this.fb.array([]),
    });
  }

  private populateForm(tax: Tax) {
    this.taxForm.patchValue({
      title: tax.title,
      is_inclusive: tax.is_inclusive || false,
      rate: tax.rate || '',
      logic: tax.logic || 'percent',
      type: tax.type || 'fee',
      currency: tax.currency || '',
      max_nights: tax.max_nights || '',
      skip_nights: tax.skip_nights || '',
    });

    if (tax.applicable_date_ranges && Array.isArray(tax.applicable_date_ranges)) {
      const dateRangesArray = this.taxForm.get('applicable_date_ranges') as FormArray;
      tax.applicable_date_ranges.forEach((range: any) => {
        dateRangesArray.push(
          this.fb.group({
            after: [range.after || null],
            before: [range.before || null],
          })
        );
      });
    }
  }

  get dateRangesArray(): FormArray {
    return this.taxForm.get('applicable_date_ranges') as FormArray;
  }

  addDateRange() {
    this.dateRangesArray.push(
      this.fb.group({
        after: [null],
        before: [null],
      })
    );
  }

  removeDateRange(index: number) {
    this.dateRangesArray.removeAt(index);
  }

  saveTax() {
    if (!this.taxForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);
    const formValue = this.taxForm.getRawValue();
    const taxData = {
      ...formValue,
      rate: String(formValue.rate),
      max_nights: formValue.max_nights ? String(formValue.max_nights) : null,
      skip_nights: formValue.skip_nights ? String(formValue.skip_nights) : null,
      applicable_date_ranges: formValue.applicable_date_ranges.filter(
        (range: any) => range.after || range.before
      ),
    };

    const request = this.isEditing()
      ? this.taxService.updateTax(this.data.propertyId, this.data.tax!.id, taxData)
      : this.taxService.createTax(this.data.propertyId, taxData);

    request
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          const message = this.isEditing() ? 'Tax updated successfully' : 'Tax created successfully';
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isSaving.set(false);
          const errorMessage = error.error?.message || 'Failed to save tax';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Error saving tax:', error);
        },
      });
  }

  cancel() {
    this.dialogRef.close();
  }
}
