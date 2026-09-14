import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { StoreStore } from '../stores/store.store';

/**
 * Guards routes that need an actual selected store (role resolution, POS,
 * etc.) against the gap between login and store selection: a merchant with
 * more than one store lands on /select-store first, and if they reload or
 * navigate away before picking one, `stores` is restored from session
 * storage but `selectedStore` stays null. Without this, resolvers like
 * roleResolver would silently fall back to the legacy single-role lookup
 * instead of sending them back to finish picking.
 */
export const storeSelectedGuard = () => {
  const router = inject(Router);
  const storeStore = inject(StoreStore);

  if (storeStore.selectedStore()) {
    return true;
  }

  const stores = storeStore.stores();
  if (stores.length === 1) {
    // Recoverable without a prompt — just the one option.
    storeStore.setSelectedStore(stores[0]);
    return true;
  }

  if (stores.length > 1) {
    router.navigate(['/select-store']);
    return false;
  }

  // No stores at all — not this guard's job to explain why; send back to login.
  router.navigate(['/auth/login']);
  return false;
};
