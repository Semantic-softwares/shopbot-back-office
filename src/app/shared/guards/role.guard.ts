import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RolesService } from '../services/roles.service';

/**
 * Functional role guard for Angular 19+
 * Checks if the user has the required permissions to access a route
 * 
 * Usage in routes:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard],
 *   data: { 
 *     requiredPermission: 'settings.store.edit' // single permission
 *     // OR
 *     requiredPermissions: ['settings.store.view', 'settings.store.edit'] // multiple
 *     permissionMode: 'any' // 'any' (default) or 'all'
 *   }
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const rolesService = inject(RolesService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const role = rolesService.role();
  
  // Check if user has a role assigned
  if (!role) {
    snackBar.open('Please login to access this page', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
    router.navigate(['/auth']);
    return false;
  }

  // Get permission requirements from route data
  const requiredPermission = route.data['requiredPermission'] as string | undefined;
  const requiredPermissions = route.data['requiredPermissions'] as string[] | undefined;
  const permissionMode = (route.data['permissionMode'] as 'any' | 'all') || 'any';

  // If no permission is required, allow access
  if (!requiredPermission && !requiredPermissions) {
    return true;
  }

  // Build permissions array
  const permissions: string[] = requiredPermissions || (requiredPermission ? [requiredPermission] : []);

  if (permissions.length === 0) {
    return true;
  }

  // Check permissions based on mode
  const hasAccess = permissionMode === 'all'
    ? rolesService.hasAll(permissions)
    : rolesService.hasAny(permissions);

  if (!hasAccess) {
    snackBar.open('Access denied: Insufficient permissions', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
    router.navigate(['/menu']);
    return false;
  }

  return true;
};

/**
 * Functional role guard for child routes
 */
export const roleGuardChild: CanActivateChildFn = (route) => {
  return roleGuard(route, {} as any);
};
