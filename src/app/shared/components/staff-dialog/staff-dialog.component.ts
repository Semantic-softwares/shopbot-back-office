import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';

import { RolesService } from '../../services/roles.service';
import { UserService } from '../../services/user.service';
import { Role } from '../../models/role.model';
import { Employee } from '../../models/employee.model';

export interface StaffDialogData {
  storeId: string;
  staff?: Employee; // Optional staff for edit mode
}

@Component({
  selector: 'app-staff-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './staff-dialog.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StaffDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<StaffDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private data = inject<StaffDialogData>(MAT_DIALOG_DATA);

  staffForm!: FormGroup;
  saving = signal(false);
  hidePassword = signal(true);

  // Fetch roles for the store
  rolesResource = rxResource({
    params: () => ({ storeId: this.data.storeId }),
    stream: ({ params }) => this.rolesService.getAllRolesForStore(params.storeId),
  });

  // Check if we're in edit mode
  isEditMode = signal(false);

  ngOnInit(): void {
    this.isEditMode.set(!!this.data.staff);

    // Get role ID - handle both string and Role object
    const roleId = this.data.staff?.role 
      ? (typeof this.data.staff.role === 'string' ? this.data.staff.role : this.data.staff.role._id)
      : '';

    this.staffForm = this.fb.group({
      name: [this.data.staff?.name || '', Validators.required],
      email: [this.data.staff?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.data.staff?.phoneNumber || '', Validators.required],
      gender: [this.data.staff?.gender || ''],
      password: ['', this.isEditMode() ? [] : [Validators.required, Validators.minLength(6)]],
      role: [roleId, Validators.required],
    });

    // Remove password control in edit mode
    if (this.isEditMode()) {
      this.staffForm.removeControl('password');
    }
  }

  getRoleIcon(role: Role): string {
    const name = role.name.toLowerCase();
    if (name.includes('admin') || name.includes('owner')) return 'admin_panel_settings';
    if (name.includes('manager')) return 'manage_accounts';
    if (name.includes('front desk') || name.includes('receptionist')) return 'support_agent';
    if (name.includes('housekeeper') || name.includes('housekeeping')) return 'cleaning_services';
    if (name.includes('accountant') || name.includes('finance')) return 'account_balance';
    return 'person';
  }

  saveStaff(): void {
    if (this.staffForm.invalid) return;

    this.saving.set(true);

    const staffData: any = {
      ...this.staffForm.value,
      stores: [this.data.storeId], // Use stores array instead of single store
      pin: this.generatePin(), // Generate a random PIN
    };

    if (this.isEditMode()) {
      // Update existing staff
      this.userService.updateMerchant(this.data.staff!._id!, staffData).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.snackBar.open('Staff member updated successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message || 'Failed to update staff member', 'Close', { duration: 5000 });
        }
      });
    } else {
      // Create new staff
      this.userService.createMerchant(staffData).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.snackBar.open('Staff member created successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message || 'Failed to create staff member', 'Close', { duration: 5000 });
        }
      });
    }
  }

  private generatePin(): string {
    // Generate a random 4-digit PIN
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}
