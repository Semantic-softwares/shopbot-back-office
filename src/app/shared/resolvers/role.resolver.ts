import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';
import { switchMap, tap, of } from 'rxjs';
import { RolesService } from '../services/roles.service';

export const roleResolver: ResolveFn<Role | null> = () => {
  const roleService = inject(RolesService);
  const authService = inject(AuthService);
  console.log('Role Resolver Invoked');
  // Always fetch fresh role from server to get latest changes
  // The RolesService already restores from storage in constructor for quick guard check
  return authService.currentUser.pipe(
    switchMap(user => {
      if (!user?._id) {
        return of(null);
      }
      return roleService.getRoleByMerchantId(user._id);
    }),
    tap(role => {
      if (role) {
        const permissions = role.permissions
          .filter(p => p.isActive)
          .map(p => p.code);
        // isAdmin is only true for actual admin roles, NOT all administrative (global) roles.
        // isAdministrative means "global role, not tied to a store" — POS Manager, Cashier, etc. are also administrative.
        const adminRoleNames = ['super admin', 'admin'];
        const isAdmin = adminRoleNames.includes(role.name.toLowerCase());
        // Update signals and storage with fresh data
        roleService.setAccess({
          role,
          permissions,
          isAdmin,
        });
      }
    })
  );
};
