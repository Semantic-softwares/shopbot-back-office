import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeRole, Employee } from '../../../shared/models/employee.model';
import { StoreStore } from '../../../shared/stores/store.store';
import { UserService } from '../../../shared/services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionStorageService } from '../../../shared/services/session-storage.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-employee-dialog',
  templateUrl: './employee-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class EmployeeDialogComponent {
  private storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<EmployeeDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private sessionStorage = inject(SessionStorageService);

  
  public isSubmitting = signal(false);
  public roles: EmployeeRole[] = ['Owner', 'Cashier', 'Waiter', 'Admin', 'Courier', 'Kitchen'];
  public genders = ['Male', 'Female'];
  public isEdit = this.data.isEdit;
  public form = this.fb.group({
    name: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
    role: [{value: '', disabled: this.isRoleDisabled()}, [Validators.required]],
    store: [this.storeStore.selectedStore()?._id, Validators.required],
  });

  isRoleDisabled(): boolean {
    return this.isEdit && this.data.employee?.role === 'Owner';
  }

  ngOnInit() {
    
    if (this.isEdit && this.data.employee) {
      this.form.patchValue(this.data.employee);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const formData = this.form.getRawValue();
      
      const request = this.isEdit
        ? this.userService.updateMerchant(this.data.employee!._id, formData as Partial<Employee>)
        : this.userService.createMerchant(formData as Partial<Employee>);

      request.subscribe({
        next: (res:any) => {
          // Handle server validation error in success response
          if (
            res?.err?.code === 11000 &&
            res?.err?.keyPattern
          ) {
            let message = 'Error creating/updating employee';
            if (res.err.keyPattern.email) {
              message = 'Email already exists';
            } else if (res.err.keyPattern.phoneNumber) {
              message = 'Phone number already exists';
            }
            this.snackBar.open(
              message,
              'Close',
              { duration: 3000 }
            );
            this.isSubmitting.set(false);
            return;
          }
          this.snackBar.open(
            `Employee ${this.isEdit ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open(
            `Error ${this.isEdit ? 'updating' : 'creating'} employee`,
            'Close',
            { duration: 3000 }
          );
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
