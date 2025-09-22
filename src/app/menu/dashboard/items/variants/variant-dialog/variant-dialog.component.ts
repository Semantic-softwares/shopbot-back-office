import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../../../shared/services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Option, OptionItem } from '../../../../../shared/models';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface DialogData {
  isEdit: boolean;
  variant?: Option;
}

@Component({
  selector: 'app-variant-dialog',
  templateUrl: './variant-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCheckboxModule,
  ],
})
export class VariantDialogComponent {
  private productService = inject(ProductService);
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  public isSubmitting = signal(false);
  variantForm: FormGroup;

  public existingOptions = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.productService.getStoreOptions(params.storeId!),
  });

  selectedOptions: any[] = [];
  newOptionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VariantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.variantForm = this.fb.group({
      name: ['', Validators.required],
      atLeast: [0, [Validators.required, Validators.min(0)]],
      atMost: [0, [Validators.required, Validators.min(0)]],
      enabled: [true],
      store: [this.storeStore.selectedStore()?._id, Validators.required],
    });

    this.newOptionForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      inStock: [true],
      store: [this.storeStore.selectedStore()?._id, Validators.required],
    });

    if (data.isEdit && data.variant) {
      this.variantForm.patchValue(data.variant);
      // Load existing options for this variant
      if (data.variant._id) {
        this.productService.getGroupOptionItems(data.variant._id).subscribe({
          next: (options) => {
            this.selectedOptions = options;
          },
        });
      }
    }
  }

  addNewOption() {
    if (this.newOptionForm.valid) {
      const newOption = {
        ...this.newOptionForm.value,
        store: this.storeStore.selectedStore()?._id,
        variant: this.data.variant?._id,
      };

      this.productService.saveOption(newOption).subscribe({
        next: (savedOption) => {
          this.selectedOptions.push(savedOption);
          this.newOptionForm.reset({
            name: '',
            price: 0,
            store: this.storeStore.selectedStore()?._id,
            inStock: true,
          });
          this.snackBar.open('Option added successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Error adding option', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  removeOption(option: OptionItem) {
    const index = this.selectedOptions.findIndex((o) => o._id === option._id);
    if (index > -1) {
      this.selectedOptions.splice(index, 1);
      this.productService.deleteOptionItem(option._id).subscribe({
        next: () => {
          this.snackBar.open('Option removed successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Error removing option', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.variantForm.valid) {
      this.isSubmitting.set(true);
      const formValue = {
        ...this.variantForm.getRawValue(),
        options: this.selectedOptions.map((o) => o._id),
      };

      const request = this.data.isEdit
        ? this.productService.updateVariant(formValue, this.data.variant!._id)
        : this.productService.createVariant(formValue);

      request.subscribe({
        next: () => {
          this.snackBar.open(
            `Variant ${this.data.isEdit ? 'updated' : 'created'} successfully`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open(
            `Error ${this.data.isEdit ? 'updating' : 'creating'} variant`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
          this.isSubmitting.set(false);
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
