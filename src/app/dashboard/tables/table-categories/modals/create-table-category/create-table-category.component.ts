import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableCategoryService } from '../../../../../shared/services/table-category.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { TableCategory } from '../../../../../shared/models';

@Component({
  selector: 'app-create-table-category',
  templateUrl: './create-table-category.component.html',
  styleUrls: ['./create-table-category.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ]
})
export class CreateTableCategoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tableCategoryService = inject(TableCategoryService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateTableCategoryComponent>);
  public data = inject(MAT_DIALOG_DATA);

  categoryForm!: FormGroup;
  isEdit = false;
  isLoading = false;

  ngOnInit() {
    this.isEdit = this.data?.mode === 'edit';
    this.initForm();
    
    if (this.isEdit && this.data.category) {
      this.populateForm(this.data.category);
    }
  }

  private initForm() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      active: [true],
      store: [this.storeStore.selectedStore()?._id]
    });
  }

  private populateForm(category: TableCategory) {
    this.categoryForm.patchValue({
      name: category.name,
      active: category.active,
      store: typeof category.store === 'object' ? category.store._id : category.store
    });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.isLoading = true;
      const formValue = this.categoryForm.value;

      if (this.isEdit) {
        this.tableCategoryService.updateTableCategory(this.data.category._id, formValue).subscribe({
          next: () => {
            this.snackBar.open('Table category updated successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error updating table category:', error);
            this.snackBar.open('Error updating table category', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.isLoading = false;
          }
        });
      } else {
        this.tableCategoryService.createTableCategory(formValue).subscribe({
          next: () => {
            this.snackBar.open('Table category created successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error creating table category:', error);
            this.snackBar.open('Error creating table category', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.isLoading = false;
          }
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
