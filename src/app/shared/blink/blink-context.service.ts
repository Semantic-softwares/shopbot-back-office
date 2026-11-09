import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { ConnectivityService } from '../offline/connectivity.service';
import { cachedFetch } from '../offline/cached-fetch';
import { OfflineStore } from '../offline/offline-store.service';
import { StoreStore } from '../stores/store.store';
import { BlinkApiService } from './blink-api.service';
import { BlinkStatus } from './blink.models';

/** Blink is for Mauritius stores trading in rupees: the same rule the server enforces, mirrored so a store that cannot use it sees nothing. */
export function isMauritiusStore(store: { country?: string | null; currencyCode?: string | null; contactInfo?: { country?: string | null } | null } | null | undefined): boolean {
  if (!store) return false;
  const country = String(store.country || store.contactInfo?.country || '').trim().toLowerCase();
  return ['mauritius', 'maurice', 'mu', 'mus'].includes(country) && String(store.currencyCode ?? '').trim().toUpperCase() === 'MUR';
}

/**
 * Whether the selected store takes Blink payments. A store that is not in Mauritius never asks the server and never shows anything.
 * The answer is kept on the device, so the POS knows Blink is on even with no connection (where it is shown as unavailable).
 */
@Injectable({ providedIn: 'root' })
export class BlinkContextService {
  private readonly storeStore = inject(StoreStore);
  private readonly api = inject(BlinkApiService);
  private readonly offline = inject(OfflineStore);
  readonly net = inject(ConnectivityService);

  readonly status = signal<BlinkStatus | null>(null);

  /** Blink is switched on for this store (and the store may use it). */
  readonly enabled = computed(() => !!this.status()?.eligible && !!this.status()?.enabled);
  /** The store may use Blink at all (so the settings page is worth showing). */
  readonly eligible = computed(() => isMauritiusStore(this.storeStore.selectedStore()));
  /** Blink can take a payment right now: on, and online. */
  readonly available = computed(() => this.enabled() && this.net.online());

  constructor() {
    effect(() => {
      const store = this.storeStore.selectedStore();
      untracked(() => {
        if (!store?._id || !isMauritiusStore(store)) {
          this.status.set(null);
          return;
        }
        cachedFetch(this.offline, `blink-status:${store._id}`, this.api.status(store._id)).subscribe({
          next: (s) => this.status.set(s),
          error: () => this.status.set(null),
        });
      });
    });
  }

  refresh(): void {
    const store = this.storeStore.selectedStore();
    if (store?._id && isMauritiusStore(store)) this.api.status(store._id).subscribe({ next: (s) => this.status.set(s), error: () => undefined });
  }
}
