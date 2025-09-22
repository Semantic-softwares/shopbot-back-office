import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PermissionService } from '../../../../../shared/services/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermissionCategory } from '../../../../../../shared/models/permission.model';

@Component({
  selector: 'app-create-permission-category',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './create-permission-category.component.html'
})
export class CreatePermissionCategoryComponent {
  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  isEditMode: boolean;

  constructor(
    public dialogRef: MatDialogRef<CreatePermissionCategoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', category?: PermissionCategory }
  ) {
    this.isEditMode = data.mode === 'edit';
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', Validators.required]
    });

    if (this.isEditMode && data.category) {
      this.form.patchValue(data.category);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const operation = this.isEditMode
        ? this.permissionService.updatePermissionCategory(this.data.category!._id!, this.form.value)
        : this.permissionService.createPermissionCategory(this.form.value);

      operation.subscribe({
        next: () => {
          this.snackBar.open(
            `Category ${this.isEditMode ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000, panelClass: ['success-snackbar'] }
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open(
            `Failed to ${this.isEditMode ? 'update' : 'create'} category`,
            'Close',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        }
      });
    }
  }
}
