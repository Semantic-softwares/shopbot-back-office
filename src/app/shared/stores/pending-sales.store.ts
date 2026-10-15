import { DestroyRef, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { PendingSale } from '../models/pending-sale.model';
import { AuthService } from '../services/auth.service';
import { StoreStore } from './store.store';

/** localStorage key. Cleared on logout (see SessionStorageService.clearAll and the auth watcher below). */
export const PENDING_SALES_STORAGE_KEY = 'shopbot.pendingSales';

type PendingSalesState = { sales: PendingSale[] };

/** Defensive: this is read back from storage that anything (or any older build) may have written. */
function readStoredSales(): PendingSale[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_SALES_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is PendingSale =>
        !!s && typeof s.id === 'string' && typeof s.storeId === 'string' && Array.isArray(s.cart?.products),
    );
  } catch {
    return [];
  }
}

/**
 * Sales set aside at the till. Held in memory as signals, mirrored to localStorage so a page refresh
 * doesn't lose them, and wiped when the cashier logs out.
 */
export const PendingSalesStore = signalStore(
  { providedIn: 'root' },
  withState<PendingSalesState>({ sales: [] }),

  withComputed((store) => {
    const storeStore = inject(StoreStore);
    /** Only this store's sales, newest first. */
    const forCurrentStore = computed(() => {
      const storeId = storeStore.selectedStore()?._id;
      return store
        .sales()
        .filter((sale) => sale.storeId === storeId)
        .sort((a, b) => b.createdAt - a.createdAt);
    });
    return { forCurrentStore, count: computed(() => forCurrentStore().length) };
  }),

  withMethods((store) => ({
    add(sale: PendingSale): void {
      patchState(store, (state) => ({ sales: [...state.sales, sale] }));
    },
    remove(id: string): void {
      patchState(store, (state) => ({ sales: state.sales.filter((sale) => sale.id !== id) }));
    },
    clear(): void {
      patchState(store, { sales: [] });
    },
    /** Re-reads storage (another tab changed it, or it was cleared by a logout there). */
    reloadFromStorage(): void {
      patchState(store, { sales: readStoredSales() });
    },
  })),

  withHooks({
    onInit(store) {
      const auth = inject(AuthService);
      const destroyRef = inject(DestroyRef);

      // 1. Survive a refresh.
      store.reloadFromStorage();

      // 2. Mirror every change to storage. Empty list -> remove the key rather than store "[]".
      effect(() => {
        const sales = store.sales();
        try {
          if (sales.length) localStorage.setItem(PENDING_SALES_STORAGE_KEY, JSON.stringify(sales));
          else localStorage.removeItem(PENDING_SALES_STORAGE_KEY);
        } catch {
          // Storage full or blocked: the sales still work for this session, they just won't survive a refresh.
        }
      });

      // 3. Logout clears everything; a different cashier never sees someone else's held sales.
      auth.currentUser.pipe(takeUntilDestroyed(destroyRef)).subscribe((user) => {
        const sales = store.sales();
        const keep = user ? sales.filter((sale) => sale.staffId === user._id) : [];
        if (keep.length !== sales.length) patchState(store, { sales: keep });
      });

      // 4. Another tab changed the same storage (including logging out there): follow it.
      const onStorage = (event: StorageEvent) => {
        if (event.key === PENDING_SALES_STORAGE_KEY || event.key === null) store.reloadFromStorage();
      };
      window.addEventListener('storage', onStorage);
      destroyRef.onDestroy(() => window.removeEventListener('storage', onStorage));
    },
  }),
);
