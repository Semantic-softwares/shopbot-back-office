import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { AccountContext } from '../models/platform-billing.model';
import { PlatformBillingService } from '../services/platform-billing.service';
import { StoreStore } from '../stores/store.store';

/**
 * What the signed-in store's subscription looks like right now, shared by the banner, the route guard, the paywall and the billing
 * screen. Only stores billed by the platform (billingVersion 2) are described here; older ones keep the old screens until they are moved.
 */
@Injectable({ providedIn: 'root' })
export class BillingStateService {
  private readonly api = inject(PlatformBillingService);
  private readonly storeStore = inject(StoreStore);

  readonly account = signal<AccountContext | null>(null);
  readonly subscription = computed(() => this.account()?.subscription ?? null);
  readonly isPlatformBilled = computed(() => this.subscription()?.billingVersion === 2);
  readonly locked = computed(() => this.isPlatformBilled() && !!this.subscription()?.blocked);

  constructor() {
    // Follows the selected store, like roles and the old feature gating: a different store means a different subscription.
    effect(() => {
      const id = this.storeStore.selectedStore()?._id;
      if (!id) this.account.set(null);
      else this.refresh().subscribe({ error: () => undefined });
    });
  }

  refresh(): Observable<AccountContext> {
    return this.api.context().pipe(tap((a) => this.account.set(a)));
  }

  /** Reads the subscription fresh; the guard and the paywall use it so a payment that just went through is seen at once. */
  load(): Promise<AccountContext> {
    return firstValueFrom(this.refresh());
  }

  /** The server just refused a request because the account is locked: remember it now rather than waiting for the next refresh. */
  markLocked(): void {
    const a = this.account();
    if (a) this.account.set({ ...a, subscription: { ...a.subscription, blocked: true } });
  }
}

/** Where Paystack sends the customer back to after paying. The app uses hash routes, so the route goes after the hash. */
export function billingCallbackUrl(): string {
  return `${window.location.origin}${window.location.pathname}#/billing-callback`;
}
