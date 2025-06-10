import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  MtxColorpickerModule,
  ColorFormat,
} from '@ng-matero/extensions/colorpicker';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../../shared/services/category.service';
import { StoreStore } from '../../../../shared/stores/store.store';

@Component({
  selector: 'app-category-dialog',
  templateUrl: './category-dialog.component.html',
  styleUrls: ['./category-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MtxColorpickerModule,
    MtxSelectModule,
    MatProgressSpinnerModule,
  ],
})
export class CategoryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  public storeStore = inject(StoreStore);
  public categoryForm = this.fb.group({
    _id: [''],
    name: ['', Validators.required],
    icon: ['', Validators.required],
    color: ['', Validators.required],
    store: [this.storeStore.selectedStore()?._id, Validators.required],
    published: [true],
  });
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  public data: any = inject(MAT_DIALOG_DATA);
  public format: ColorFormat = 'hex';
  public icons = [
    { name: 'Smartphone', value: 'smartphone' },
    { name: 'Laptop', value: 'laptop' },
    { name: 'T-shirt', value: 'checkroom' },
    { name: 'Restaurant', value: 'restaurant' },
    { name: 'Shopping Bag', value: 'shopping_bag' },
    { name: 'Jewelry', value: 'diamond' },
    { name: 'Sports', value: 'sports_soccer' },
    { name: 'Books', value: 'menu_book' },
    { name: 'Home', value: 'home' },
    { name: 'Beauty', value: 'spa' },
  ];
  public isSubmitting = signal(false);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    if (this.data.isEdit && this.data.category) {
      this.categoryForm.patchValue(this.data.category);
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isSubmitting.set(true);
      const formValue:any = this.categoryForm.getRawValue();
      if (!this.data.isEdit) {
        delete formValue?._id; // Remove _id for update
      }
      const request = this.data.isEdit
        ? this.categoryService.updateMenu(this.data.category._id, formValue)
        : this.categoryService.createMenu(formValue);

      request.subscribe({
        next: (category) => {
          this.dialogRef.close(category);
          this.isSubmitting.set(false);
        },
        error: () => {
          this.snackBar.open('Error saving category', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.isSubmitting.set(false);
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
