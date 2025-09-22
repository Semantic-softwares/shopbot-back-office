import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Permission } from '../../../../../../shared/models/permission.model';
import { PermissionService } from '../../../../../shared/services/permission.service';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { CreatePermissionCategoryComponent } from '../create-permission-category/create-permission-category.component';
import { PermissionCategory } from '../../../../../../shared/models/permission.model';
import { switchMap, tap } from 'rxjs/operators';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-create-permission',
  templateUrl: './create-permission.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ]
})
export class CreatePermissionComponent  {
  
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  isLoading = signal(false);
  private fb = inject(FormBuilder);
  private permissionService =  inject(PermissionService);
  private dialogRef = inject(MatDialogRef<CreatePermissionComponent>)
  public form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    categoryId: ['', Validators.required],
    action: ['', Validators.required],
    resource: ['', Validators.required]
  });
  public categories = rxResource({
    loader: () => this.permissionService.getPermissionCategories().pipe(tap(() => {
      this.form.patchValue({ categoryId: this.data?.permission?.categoryId._id! });
      
    }))
  });
  
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', permission?: Permission }) {
    if (this.data.mode === 'edit' && this.data.permission) {
      this.form.patchValue({
        ...this.data.permission,
        categoryId: this.data.permission.categoryId._id
      });
    }
  }

  onCreateCategory(): void {
    const dialogRef = this.dialog.open(CreatePermissionCategoryComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.categories.reload();
        }
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.isLoading.set(true);
      const permission   = this.form.value as Partial<Permission>;
      
      const request = this.data.mode === 'create' 
        ? this.permissionService.createPermission(permission)
        : this.permissionService.updatePermission(this.data.permission!._id!, permission);

      request.pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (error) => {
            this.snackBar.open(
              `Failed to ${this.data.mode} permission`, 
              'Close', 
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
