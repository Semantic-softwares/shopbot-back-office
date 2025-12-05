import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableService } from '../../../../../../shared/services/table.service';
import { TableCategoryService } from '../../../../../../shared/services/table-category.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { Table, TableCategory } from '../../../../../../shared/models';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-table',
  templateUrl: './create-table.component.html',
  styleUrls: ['./create-table.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
]
})
export class CreateTableComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tableService = inject(TableService);
  private tableCategoryService = inject(TableCategoryService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateTableComponent>);
  public data = inject(MAT_DIALOG_DATA);

  tableForm!: FormGroup;
  isEdit = false;
  isLoading = false;

  public categories = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.tableCategoryService.getStoreTableCategories(params.storeId!)
  });

  ngOnInit() {
    this.isEdit = this.data?.mode === 'edit';
    this.initForm();
    
    if (this.isEdit && this.data.table) {
      this.populateForm(this.data.table);
    }
  }

  private initForm() {
    this.tableForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      numberOfGuest: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      active: [true],
      store: [this.storeStore.selectedStore()?._id]
    });
  }

  private populateForm(table: Table) {
    this.tableForm.patchValue({
      name: table.name,
      category: typeof table.category === 'object' ? table.category._id : table.category,
      numberOfGuest: table.numberOfGuest,
      active: table.active,
      storeId: table.storeId
    });
  }

  onSubmit() {
    if (this.tableForm.valid) {
      this.isLoading = true;
      const formValue = this.tableForm.value;

      if (this.isEdit) {
        this.tableService.updateTable(this.data.table._id, formValue).subscribe({
          next: () => {
            this.snackBar.open('Table updated successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error updating table:', error);
            this.snackBar.open('Error updating table', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.isLoading = false;
          }
        });
      } else {
        this.tableService.createTable(formValue).subscribe({
          next: () => {
            this.snackBar.open('Table created successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error creating table:', error);
            this.snackBar.open('Error creating table', 'Close', {
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
