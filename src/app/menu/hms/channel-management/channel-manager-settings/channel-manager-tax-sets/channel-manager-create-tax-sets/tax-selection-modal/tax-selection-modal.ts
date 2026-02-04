import { ChangeDetectionStrategy, Component, Inject, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Tax, TaxService } from '../../../../../../../shared/services/tax.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChannelManagerCreateTaxModal } from '../../../channel-manager-taxes/channel-manager-create-tax-modal/channel-manager-create-tax-modal';

export interface TaxSelectionDialogData {
  propertyId: string;
  selectedTaxIds: string[];
}

@Component({
  selector: 'app-tax-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './tax-selection-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxSelectionModalComponent {
  private fb = inject(FormBuilder);
  private taxService = inject(TaxService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TaxSelectionModalComponent>);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  @Inject(MAT_DIALOG_DATA) data = inject(MAT_DIALOG_DATA) as TaxSelectionDialogData;

  availableTaxes = signal<Tax[]>([]);
  isLoading = signal(false);
  form!: FormGroup;

  constructor() {
    this.initializeForm();
    this.loadTaxes();
  }

  private initializeForm() {
    this.form = this.fb.group({
      taxId: ['', Validators.required],
    });
  }

  private loadTaxes() {
    if (!this.data.propertyId) {
      this.snackBar.open('Property ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    this.taxService.getTaxes(this.data.propertyId).subscribe({
      next: (taxes: Tax[]) => {
        // Filter out already selected taxes
        const filteredTaxes = taxes.filter(
          (tax) => !this.data.selectedTaxIds.includes(tax.id)
        );
        this.availableTaxes.set(filteredTaxes);
        this.isLoading.set(false);

        if (filteredTaxes.length === 0) {
          this.snackBar.open('All taxes have been selected', 'Close', {
            duration: 3000,
          });
        }
      },
      error: (error: any) => {
        this.isLoading.set(false);
        const errorMessage = error.error?.message || 'Failed to load taxes';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        console.error('Error loading taxes:', error);
      },
    });
  }

  selectTax() {
    if (!this.form.valid) {
      this.snackBar.open('Please select a tax', 'Close', { duration: 3000 });
      return;
    }

    const selectedTaxId = this.form.get('taxId')?.value;
    const selectedTax = this.availableTaxes().find((tax) => tax.id === selectedTaxId);

    if (selectedTax) {
      this.dialogRef.close(selectedTax);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  createNewTax() {
    this.dialog
      .open(ChannelManagerCreateTaxModal, {
        data: { tax: undefined, propertyId: this.data.propertyId },
        width: '600px',
        disableClose: false,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          // Reload taxes after creating a new one
          this.loadTaxes();
          this.snackBar.open('Tax created successfully', 'Close', { duration: 3000 });
        }
      });
  }
}
