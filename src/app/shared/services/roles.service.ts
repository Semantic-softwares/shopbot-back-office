import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, CreateRoleDto, CreateAdministrativeRoleDto } from '../models/role.model';
import { Permission, GroupedPermissions } from '../models/permission.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private hostServer: string = environment.apiUrl;

  /**
   * Get all roles
   */
  getAllRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.hostServer}/roles`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get all administrative (global) roles
   */
  getAdministrativeRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.hostServer}/roles/administrative`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get store-specific roles only
   */
  getRolesByStore(storeId: string): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.hostServer}/roles/store/${storeId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get all roles available for a store (admin + store-specific)
   */
  getAllRolesForStore(storeId: string): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.hostServer}/roles/store/${storeId}/all`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get a single role by ID
   */
  getRole(roleId: string): Observable<Role> {
    return this.http.get<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get the permissions for a specific role
   */
  getRolePermissions(roleId: string): Observable<Permission[]> {
    return this.getRole(roleId).pipe(
      map(role => role.permissions || [])
    );
  }

  /**
   * Create a new administrative (global) role
   */
  createAdministrativeRole(role: CreateAdministrativeRoleDto): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.hostServer}/roles/administrative`, role).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create a new store-specific role
   */
  createRole(role: CreateRoleDto): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.hostServer}/roles`, role).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update a role
   */
  updateRole(roleId: string, role: Partial<Role>): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}`, role).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete a role
   */
  deleteRole(roleId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.hostServer}/roles/${roleId}`);
  }

  /**
   * Set permissions for a role (replace existing)
   */
  setRolePermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}/permissions`, { permissions: permissionIds }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Add permissions to a role
   */
  addRolePermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}/permissions`, { permissions: permissionIds }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Remove permissions from a role
   */
  removeRolePermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.delete<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}/permissions`, { 
      body: { permissions: permissionIds } 
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Clone a role
   */
  cloneRole(roleId: string, newName: string, storeId?: string): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}/clone`, { name: newName, storeId }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Set role as default for store
   */
  setDefaultRole(roleId: string, storeId: string): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.hostServer}/roles/${roleId}/set-default`, { storeId }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Clear all roles (admin only)
   */
  clearAllRoles(): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.hostServer}/roles/clear/all`);
  }

  /**
   * Clear store-specific roles only (admin only)
   */
  clearStoreRoles(): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.hostServer}/roles/clear/store-roles`);
  }

  // ==================== PERMISSION METHODS ====================

  /**
   * Get all permissions
   */
  getPermissions(query?: any): Observable<Permission[]> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.hostServer}/permissions`, { params: query }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get permissions grouped by module and group
   */
  getGroupedPermissions(): Observable<GroupedPermissions> {
    return this.http.get<ApiResponse<GroupedPermissions>>(`${this.hostServer}/permissions/grouped`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get predefined permissions (from constants)
   */
  getPredefinedPermissions(): Observable<GroupedPermissions> {
    return this.http.get<ApiResponse<GroupedPermissions>>(`${this.hostServer}/permissions/predefined`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get a single permission by ID
   */
  getPermission(permissionId: string): Observable<Permission> {
    return this.http.get<ApiResponse<Permission>>(`${this.hostServer}/permissions/${permissionId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get all permission codes
   */
  getPermissionCodes(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.hostServer}/permissions/codes`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Seed permissions from predefined constants
   */
  seedPermissions(): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.hostServer}/permissions/seed`, {});
  }

  /**
   * Create a new permission
   */
  createPermission(permission: Partial<Permission>): Observable<Permission> {
    return this.http.post<ApiResponse<Permission>>(`${this.hostServer}/permissions`, permission).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update a permission
   */
  updatePermission(permissionId: string, permission: Partial<Permission>): Observable<Permission> {
    return this.http.put<ApiResponse<Permission>>(`${this.hostServer}/permissions/${permissionId}`, permission).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete a permission
   */
  deletePermission(permissionId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.hostServer}/permissions/${permissionId}`);
  }

  /**
   * Clear all permissions (admin only)
   */
  clearAllPermissions(): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.hostServer}/permissions/clear`);
  }

  /**
   * Get permission categories (derived from grouped permissions)
   */
  getPermissionCategories(): Observable<any[]> {
    return this.getGroupedPermissions().pipe(
      map(grouped => {
        const categories: any[] = [];
        Object.keys(grouped).forEach(module => {
          Object.keys(grouped[module]).forEach(group => {
            categories.push({
              _id: `${module}-${group}`,
              name: `${module} - ${group}`,
              module,
              group,
              permissions: grouped[module][group]
            });
          });
        });
        return categories;
      })
    );
  }
}
