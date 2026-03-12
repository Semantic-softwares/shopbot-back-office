import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RolesService } from '../services/roles.service';

/**
 * Functional guard that restricts access to super admins only.
 * 
 * Usage in routes:
 * {
 *   path: 'admin',
 *   canActivate: [adminGuard],
 *   ...
 * }
 */
export const adminGuard: CanActivateFn = () => {
  const rolesService = inject(RolesService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const role = rolesService.role();

  if (!role) {
    snackBar.open('Please login to access this page', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
    router.navigate(['/auth']);
    return false;
  }

  if (rolesService.isAdmin()) {
    return true;
  }

  snackBar.open('Access denied: Only administrators can access this section', 'Close', {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  });
  router.navigate(['/menu']);
  return false;
};
