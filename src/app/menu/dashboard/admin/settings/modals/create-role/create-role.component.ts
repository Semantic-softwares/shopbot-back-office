import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Role } from '../../../../../../shared/models/role.model';
import { RolesService } from '../../../../../shared/services/role.service';
import { PermissionService } from '../../../../../shared/services/permission.service';
import { Permission, PermissionCategory } from '../../../../../../shared/models/permission.model';

@Component({
  selector: 'app-create-role',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './create-role.component.html'
})
export class CreateRoleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateRoleComponent>);
  private data: Role = inject(MAT_DIALOG_DATA);
  private rolesService = inject(RolesService);
  private permissionService = inject(PermissionService);

  public isEditMode = signal(!!this.data?._id);
  public modalTitle = this.isEditMode() ? 'Edit Role' : 'Create Role';
  public isLoading = signal(false);
  public permissions: any[] = [];
  public groupedPermissions: Map<string, Permission[]> = new Map();

  public roleForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    permissions: this.fb.array([])
  });

  get permissionsFormArray() {
    return this.roleForm.get('permissions') as FormArray;
  }

  constructor() {}

  ngOnInit() {
    this.loadPermissions();
    if (this.isEditMode()) {
      this.patchRoleData();
    }
  }

  private loadPermissions() {
    this.permissionService.getPermissions().subscribe({
      next: (permissions: Permission[]) => {
        this.groupPermissionsByCategory(permissions);
        this.initializePermissionsForm(permissions);
      }
    });
  }

  private groupPermissionsByCategory(permissions: Permission[]) {
    this.groupedPermissions.clear();
    permissions.forEach(permission => {
      const categoryName = permission.categoryId.name;
      if (!this.groupedPermissions.has(categoryName)) {
        this.groupedPermissions.set(categoryName, []);
      }
      this.groupedPermissions.get(categoryName)?.push(permission);
    });
  }

  private initializePermissionsForm(permissions: Permission[]) {
    const permissionsArray = this.roleForm.get('permissions') as FormArray;
    permissionsArray.clear();
    
    if (this.isEditMode() && this.data.permissions) {
      this.data.permissions.forEach(permissionId => {
        permissionsArray.push(this.fb.control(permissionId));
      });
    }
  }

  private patchRoleData() {
    this.roleForm.patchValue({
      name: this.data.name,
      description: this.data.description
    });
  }

  togglePermission(permission: Permission, event: any): void {
    const permissionsArray = this.permissionsFormArray;
    if (event.checked) {
      permissionsArray.push(this.fb.control(permission._id));
    } else {
      const index = permissionsArray.controls.findIndex(
        control => control.value === permission._id
      );
      if (index >= 0) {
        permissionsArray.removeAt(index);
      }
    }
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.permissionsFormArray.controls.some(
      control => control.value === permissionId
    );
  }

  onSubmit(): void {
    if (this.roleForm.valid) {
      this.isLoading.set(true);
      const roleData = {
        ...this.roleForm.value,
        permissions: this.permissionsFormArray.value
      };

      const request$ = this.isEditMode() 
        ? this.rolesService.updateRole(this.data._id!, roleData)
        : this.rolesService.createRole(roleData);

      request$.subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.dialogRef.close(result);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.roleForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    return '';
  }
}
