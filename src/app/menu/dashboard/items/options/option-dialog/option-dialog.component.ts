import { Component, inject, Inject, signal } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OptionItem } from '../../../../../shared/models';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { ProductService } from '../../../../../shared/services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-option-dialog',
  templateUrl: './option-dialog.component.html',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
]
})
export class OptionDialogComponent {
  private productService = inject(ProductService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  public isSubmitting = signal(false);
  optionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean; option?: OptionItem }
  ) {
    this.optionForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      inStock: [true],
      store: [this.storeStore.selectedStore()?._id, Validators.required]
    });

    if (data.isEdit && data.option) {
      this.optionForm.patchValue(data.option);
    }
  }

  onSubmit(): void {
    if (this.optionForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.optionForm.getRawValue();

      const request = this.data.isEdit 
        ? this.productService.updateOption(formValue, this.data.option!._id)
        : this.productService.saveOption(formValue);

      request.subscribe({
        next: () => {
          this.snackBar.open(
            `Option ${this.data.isEdit ? 'updated' : 'created'} successfully`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open(
            `Error ${this.data.isEdit ? 'updating' : 'creating'} option`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }
          );
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
