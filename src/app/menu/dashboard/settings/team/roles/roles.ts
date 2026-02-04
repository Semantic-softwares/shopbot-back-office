import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Location, NgClass } from '@angular/common';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CreateRoleDialogComponent } from '../../../../../shared/components/create-role-dialog/create-role-dialog.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { Permission } from '../../../../../shared/models/permission.model';
import { Role } from '../../../../../shared/models/role.model';
import { RolesService } from '../../../../../shared/services/roles.service';
import { StoreStore } from '../../../../../shared/stores/store.store';


@Component({
  selector: 'app-roles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    NoRecordComponent,
    NgClass,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles {
  private rolesService = inject(RolesService);
  private storeStore = inject(StoreStore);
  private dialog = inject(MatDialog);
  location = inject(Location);


  // Selected role
  selectedRole = signal<Role | null>(null);

  // Fetch roles using rxResource - gets both administrative AND store-specific roles
  roles = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id! }),
    stream: ({ params }) => this.rolesService.getAllRolesForStore(params.storeId),
  });

  // Fetch grouped permissions from backend
  permissionsResource = rxResource({
    stream: () => this.rolesService.getGroupedPermissions(),
  });

  // Get grouped permissions (from backend)
  groupedPermissions = computed(() => {
    return this.permissionsResource.value() || {};
  });

  // Flatten permissions for counting
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

  // Get modules list
  modules = computed(() => Object.keys(this.groupedPermissions()));

  // Separate administrative roles from custom (store-specific) roles
  administrativeRoles = computed(() => {
    return this.roles.value()?.filter(role => role.isAdministrative) || [];
  });

  customRoles = computed(() => {
    return this.roles.value()?.filter(role => !role.isAdministrative) || [];
  });

  // Get the permission codes from the selected role
  private rolePermissionCodes = computed(() => {
    const role = this.selectedRole();
    if (!role || !role.permissions) return new Set<string>();
    return new Set(role.permissions.map(p => p.code));
  });

  // Check if role has permission
  hasPermission(permissionCode: string): boolean {
    return this.rolePermissionCodes().has(permissionCode);
  }

  // Get granted permissions for selected role (permissions the role has)
  allowedPermissions = computed(() => {
    const permCodes = this.rolePermissionCodes();
    if (permCodes.size === 0) return [];
    return this.allPermissions().filter(p => permCodes.has(p.code));
  });

  // Get denied permissions for selected role (permissions the role doesn't have)
  deniedPermissions = computed(() => {
    const role = this.selectedRole();
    if (!role) return [];
    const permCodes = this.rolePermissionCodes();
    return this.allPermissions().filter(p => !permCodes.has(p.code));
  });

  // Select a role
  selectRole(role: Role): void {
    this.selectedRole.set(role);
  }

  // Open create role dialog
  openCreateRoleDialog(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { storeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the roles list
        this.roles.reload();
        this.permissionsResource.reload();
      }
    });
  }

  // Open edit role dialog
  openEditRoleDialog(): void {
    const role = this.selectedRole();
    if (!role || role.isAdministrative) return;

    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { storeId, role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update selected role and refresh list
        this.selectedRole.set(result);        
        this.roles.reload();
        this.permissionsResource.reload();
       
      }
    });
  }

  // Delete role with confirmation
  deleteRole(): void {
    const role = this.selectedRole();
    if (!role || role.isAdministrative) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Role',
        message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rolesService.deleteRole(role._id!).subscribe({
          next: () => {
            this.selectedRole.set(null);
            this.roles.reload();
          },
          error: (err) => {
            console.error('Failed to delete role:', err);
          }
        });
      }
    });
  }

  // Get role icon based on name
  getRoleIcon(role: Role): string {
    const name = role.name.toLowerCase();
    if (name.includes('admin') || name.includes('owner')) return 'admin_panel_settings';
    if (name.includes('manager')) return 'manage_accounts';
    if (name.includes('front desk') || name.includes('receptionist')) return 'support_agent';
    if (name.includes('housekeeper') || name.includes('housekeeping')) return 'cleaning_services';
    if (name.includes('accountant') || name.includes('finance')) return 'account_balance';
    return 'person';
  }

  // Get role color class
  getRoleColor(role: Role): string {
    const name = role.name.toLowerCase();
    if (name.includes('admin') || name.includes('owner')) return 'bg-purple-100 text-purple-700';
    if (name.includes('manager')) return 'bg-blue-100 text-blue-700';
    if (name.includes('front desk') || name.includes('receptionist')) return 'bg-green-100 text-green-700';
    if (name.includes('housekeeper') || name.includes('housekeeping')) return 'bg-yellow-100 text-yellow-700';
    if (name.includes('accountant') || name.includes('finance')) return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-700';
  }

  // Get module icon
  getModuleIcon(module: string): string {
    switch (module) {
      case 'Hotel Management': return 'hotel';
      case 'ERP': return 'inventory_2';
      case 'Finance': return 'payments';
      case 'Settings': return 'settings';
      default: return 'folder';
    }
  }

  // Get module color
  getModuleColor(module: string): string {
    switch (module) {
      case 'Hotel Management': return 'text-blue-600';
      case 'ERP': return 'text-green-600';
      case 'Finance': return 'text-purple-600';
      case 'Settings': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  }

  // Get groups for a module
  getGroupsForModule(module: string): string[] {
    return Object.keys(this.groupedPermissions()[module] || {});
  }

  // Get total permissions count for a module
  getTotalModulePermissions(module: string): number {
    const modulePerms = this.groupedPermissions()[module];
    if (!modulePerms) return 0;
    return Object.values(modulePerms).reduce((sum, perms) => sum + perms.length, 0);
  }

  // Get granted permissions count for a module
  getGrantedModulePermissions(module: string): number {
    const modulePerms = this.groupedPermissions()[module];
    if (!modulePerms) return 0;
    const permCodes = this.rolePermissionCodes();
    let count = 0;
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (permCodes.has(perm.code)) {
          count++;
        }
      }
    }
    return count;
  }

  // Get granted permissions for a specific module
  getGrantedPermissionsForModule(module: string): Permission[] {
    const modulePerms = this.groupedPermissions()[module];
    if (!modulePerms) return [];
    const permCodes = this.rolePermissionCodes();
    const granted: Permission[] = [];
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (permCodes.has(perm.code)) {
          granted.push(perm);
        }
      }
    }
    return granted;
  }

  // Get denied permissions for a specific module
  getDeniedPermissionsForModule(module: string): Permission[] {
    const modulePerms = this.groupedPermissions()[module];
    if (!modulePerms) return [];
    const permCodes = this.rolePermissionCodes();
    const denied: Permission[] = [];
    for (const group of Object.values(modulePerms)) {
      for (const perm of group) {
        if (!permCodes.has(perm.code)) {
          denied.push(perm);
        }
      }
    }
    return denied;
  }
}
