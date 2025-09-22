import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { RolesService } from '../../../../shared/services/role.service';
import { Role } from '../../../../../shared/models/role.model';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CreateRoleComponent } from '../modals/create-role/create-role.component';
import { PermissionService } from '../../../../shared/services/permission.service';
import { CreatePermissionComponent } from '../modals/create-permission/create-permission.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent {
  private rolesService = inject(RolesService);
  private permissionService = inject(PermissionService);
  private dialog = inject(MatDialog);
  public displayedColumns = ['name', 'description', 'actions'];



  public roles = rxResource({
    loader: () => this.rolesService.getAllRoles()
  });

  public permissions = rxResource({
    request: () => this.selectedRole(),
    loader: () => this.permissionService.getPermissions()
  });

  public selectedRolePermissionsGranted = rxResource({
    request: () => this.selectedRole(),
    loader: ({ request }) => this.rolesService.getRolePermissions(request!._id!)
  });


  public selectedRolePermissionsNotGranted = computed(() => {
    const allPermissions = this.permissions.value() || [];
    const rolePermissions = this.selectedRolePermissionsGranted.value() || [];
    
    // Return permissions that are not in the role's granted permissions
    return allPermissions.filter(permission => 
      !rolePermissions.some(rolePermission => 
        rolePermission._id === permission._id
      )
    );
  });
  
  public selectedRole = signal<null | Role>(null);

  // Add these computed signals to your component
  groupedGrantedPermissions = computed(() => {
    const permissions = this.selectedRolePermissionsGranted.value() || [];
    return this.groupPermissionsByCategory(permissions);
  });

  groupedNotGrantedPermissions = computed(() => {
    const permissions = this.selectedRolePermissionsNotGranted() || [];
    return this.groupPermissionsByCategory(permissions);
  });

  private groupPermissionsByCategory(permissions: any[]): any[] {
    // Create a map of categories with their permissions
    const categoryMap = permissions.reduce((acc, permission) => {
      const categoryId = permission.categoryId?._id;
      const category = acc.get(categoryId) || {
        _id: permission.categoryId?._id,
        name: permission.categoryId?.name,
        permissions: []
      };
      category.permissions.push(permission);
      acc.set(categoryId, category);
      return acc;
    }, new Map());

    // Convert map to array
    return Array.from(categoryMap.values());
  }

  onRoleSelect(event: MatSelectionListChange): void {
    this.selectedRole.set(event.options[0].value);
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateRoleComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roles.reload();
      }
    });
  }

  onEdit(role: Role): void {
    const dialogRef = this.dialog.open(CreateRoleComponent, {
      width: '600px',
      data: role
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.permissions.reload();
        this.roles.reload();
        this.selectedRolePermissionsGranted.reload();
      }
    });
  }

  onDelete(role: Role): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: `Are you sure you want to delete ${role.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.rolesService.deleteRole(role._id!).subscribe(() => {
          this.roles.reload();
          this.permissions.reload();
          this.selectedRolePermissionsGranted.reload();
        });
      }
    });
  }

  onAddPermission(): void {
    const dialogRef = this.dialog.open(CreatePermissionComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.permissions.reload();
        this.selectedRolePermissionsGranted.reload();
        
      }
    });
  }
}
