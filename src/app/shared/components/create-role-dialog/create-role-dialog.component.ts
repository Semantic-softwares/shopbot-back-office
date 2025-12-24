import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';

import { RolesService } from '../../services/roles.service';
import { Permission, GroupedPermissions } from '../../models/permission.model';
import { Role } from '../../models/role.model';

export interface CreateRoleDialogData {
  storeId: string;
  role?: Role; // Optional role for edit mode
}

@Component({
  selector: 'app-create-role-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './create-role-dialog.component.html'
})
export class CreateRoleDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private dialogRef = inject(MatDialogRef<CreateRoleDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private data = inject<CreateRoleDialogData>(MAT_DIALOG_DATA);

  roleForm!: FormGroup;
  saving = signal(false);
  selectedPermissions = signal<Set<string>>(new Set());

  // Fetch grouped permissions from backend
  permissionsResource = rxResource({
    params: () => ({}),
    stream: () => this.rolesService.getGroupedPermissions(),
  });

  groupedPermissions = computed(() => {
    return this.permissionsResource.value() || {};
  });

  allPermissions = computed((): Permission[] => {
    const grouped = this.groupedPermissions();
    const permissions: Permission[] = [];
    for (const module of Object.keys(grouped)) {
      for (const group of Object.keys(grouped[module])) {
        permissions.push(...grouped[module][group]);
      }
    }
    return permissions;
  });

  modules = computed(() => Object.keys(this.groupedPermissions()));

  // Check if we're in edit mode
  isEditMode = computed(() => !!this.data.role);

  ngOnInit(): void {
    this.roleForm = this.fb.group({
      name: [this.data.role?.name || '', Validators.required],
      description: [this.data.role?.description || ''],
    });

    // Pre-select permissions if editing
    if (this.data.role?.permissions) {
      const permCodes = new Set(this.data.role.permissions.map(p => p.code));
      this.selectedPermissions.set(permCodes);
    }
  }

  togglePermission(code: string, checked: boolean): void {
    const current = new Set(this.selectedPermissions());
    if (checked) {
      current.add(code);
    } else {
      current.delete(code);
    }
    this.selectedPermissions.set(current);
  }

  toggleGroup(module: string, group: string, checked: boolean): void {
    const perms = this.groupedPermissions()[module]?.[group] || [];
    const current = new Set(this.selectedPermissions());
    for (const perm of perms) {
      if (checked) {
        current.add(perm.code);
      } else {
        current.delete(perm.code);
      }
    }
    this.selectedPermissions.set(current);
  }

  toggleModule(module: string, checked: boolean): void {
    const modulePerms = this.groupedPermissions()[module] || {};
    const current = new Set(this.selectedPermissions());
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (checked) {
          current.add(perm.code);
        } else {
          current.delete(perm.code);
        }
      }
    }
    this.selectedPermissions.set(current);
  }

  selectAll(): void {
    const all = new Set(this.allPermissions().map(p => p.code));
    this.selectedPermissions.set(all);
  }

  deselectAll(): void {
    this.selectedPermissions.set(new Set());
  }

  isModuleFullySelected(module: string): boolean {
    const modulePerms = this.groupedPermissions()[module] || {};
    const selected = this.selectedPermissions();
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (!selected.has(perm.code)) return false;
      }
    }
    return Object.keys(modulePerms).length > 0;
  }

  isModulePartiallySelected(module: string): boolean {
    const modulePerms = this.groupedPermissions()[module] || {};
    const selected = this.selectedPermissions();
    let hasSelected = false;
    let hasUnselected = false;
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (selected.has(perm.code)) {
          hasSelected = true;
        } else {
          hasUnselected = true;
        }
      }
    }
    return hasSelected && hasUnselected;
  }

  isGroupFullySelected(module: string, group: string): boolean {
    const perms = this.groupedPermissions()[module]?.[group] || [];
    const selected = this.selectedPermissions();
    return perms.length > 0 && perms.every(p => selected.has(p.code));
  }

  isGroupPartiallySelected(module: string, group: string): boolean {
    const perms = this.groupedPermissions()[module]?.[group] || [];
    const selected = this.selectedPermissions();
    const selectedCount = perms.filter(p => selected.has(p.code)).length;
    return selectedCount > 0 && selectedCount < perms.length;
  }

  getSelectedModuleCount(module: string): number {
    const modulePerms = this.groupedPermissions()[module] || {};
    const selected = this.selectedPermissions();
    let count = 0;
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (selected.has(perm.code)) count++;
      }
    }
    return count;
  }

  getTotalModulePermissions(module: string): number {
    const modulePerms = this.groupedPermissions()[module];
    if (!modulePerms) return 0;
    return Object.values(modulePerms).reduce((sum, perms) => sum + perms.length, 0);
  }

  getGroupsForModule(module: string): string[] {
    return Object.keys(this.groupedPermissions()[module] || {});
  }

  getModuleIcon(module: string): string {
    switch (module) {
      case 'Hotel Management': return 'hotel';
      case 'ERP': return 'inventory_2';
      case 'Finance': return 'payments';
      case 'Settings': return 'settings';
      default: return 'folder';
    }
  }

  getModuleColor(module: string): string {
    switch (module) {
      case 'Hotel Management': return 'text-blue-600';
      case 'ERP': return 'text-green-600';
      case 'Finance': return 'text-purple-600';
      case 'Settings': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  }

  saveRole(): void {
    if (this.roleForm.invalid || this.selectedPermissions().size === 0) return;

    this.saving.set(true);

    // Convert selected permission codes to permission IDs
    const selectedCodes = this.selectedPermissions();
    const permissionIds = this.allPermissions()
      .filter(p => selectedCodes.has(p.code))
      .map(p => p._id);

    const roleData: any = {
      name: this.roleForm.get('name')?.value,
      description: this.roleForm.get('description')?.value,
      store: this.data.storeId,
      permissions: permissionIds,
    };

    if (this.isEditMode()) {
      // Update existing role
      this.rolesService.updateRole(this.data.role!._id!, roleData).subscribe({
        next: (role) => {
          this.saving.set(false);
          this.snackBar.open('Role updated successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(role);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message || 'Failed to update role', 'Close', { duration: 5000 });
        }
      });
    } else {
      // Create new role
      this.rolesService.createRole(roleData).subscribe({
        next: (role) => {
          this.saving.set(false);
          this.snackBar.open('Role created successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(role);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message || 'Failed to create role', 'Close', { duration: 5000 });
        }
      });
    }
  }
}
