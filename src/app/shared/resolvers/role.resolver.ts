import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';
import { switchMap, tap, of, catchError } from 'rxjs';
import { RolesService } from '../services/roles.service';
import { StoreStore } from '../stores/store.store';

export const roleResolver: ResolveFn<Role | null> = () => {
  const roleService = inject(RolesService);
  const authService = inject(AuthService);
  const storeStore = inject(StoreStore);
  // Always fetch fresh role from server to get latest changes.
  // The RolesService already restores from storage in constructor for quick guard check.
  return authService.currentUser.pipe(
    switchMap(user => {
      if (!user?._id) {
        return of(null);
      }
      // A merchant can hold a different role at each store they belong to
      // (via Membership), so the role must be resolved for whichever store
      // is currently selected — not a single global merchant.role. No
      // selected store here means the store-selection step was skipped
      // (shouldn't happen: selecting a store is mandatory before /menu is
      // reachable), so fall back to the legacy global lookup rather than
      // failing outright.
      const storeId = storeStore.selectedStore()?._id;
      const role$ = !storeId
        ? roleService.getRoleByMerchantId(user._id).pipe(tap(role => role && roleService.applyRole(role)))
        : roleService.loadForStore(user._id, storeId);

      // No role on record comes back as a 404 — land with no permissions instead of cancelling navigation.
      return role$.pipe(
        catchError(() => {
          roleService.clearAccess();
          return of(null);
        })
      );
    })
  );
};
