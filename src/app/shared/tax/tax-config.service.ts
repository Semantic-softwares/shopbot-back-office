import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { StoreStore } from '../stores/store.store';
import { OfflineStore } from '../offline/offline-store.service';
import { cachedFetch } from '../offline/cached-fetch';
import { AccountingTaxService } from '../services/accounting-tax.service';
import { Tax, TaxView } from '../models/tax.model';
import { Product, TaxLine, TaxLineRule } from '../models/product.model';
import { resolvePricingMode } from './tax-engine';

/**
 * The selected store's tax rules and tax settings, kept on the device (the same offline cache the rest of the POS reference data
 * uses) so a sale can be priced without a connection. A store that has not turned tax management on, or whose configuration
 * cannot be read at all, reads as "not enabled": the POS then behaves exactly as it always did.
 */
@Injectable({ providedIn: 'root' })
export class TaxConfigService {
  private readonly storeStore = inject(StoreStore);
  private readonly api = inject(AccountingTaxService);
  private readonly offline = inject(OfflineStore);

  private readonly loadedFor = signal<string | null>(null);
  readonly view = signal<TaxView | null>(null);

  readonly settings = computed(() => this.view()?.settings ?? null);
  readonly taxes = computed<Tax[]>(() => this.view()?.taxes ?? []);
  readonly enabled = computed(() => !!this.settings()?.taxesEnabled);
  readonly version = computed(() => this.settings()?.version ?? 0);
  readonly defaultPricingMode = computed(() => this.settings()?.defaultPricingMode ?? 'exclusive');
  readonly defaultTax = computed(() => this.taxes().find((t) => t._id === this.settings()?.defaultTaxId) ?? null);

  constructor() {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      untracked(() => {
        if (storeId) this.load(storeId);
        else {
          this.view.set(null);
          this.loadedFor.set(null);
        }
      });
    });
  }

  load(storeId: string): void {
    this.loadedFor.set(storeId);
    cachedFetch(this.offline, `tax-config:${storeId}`, this.api.view(storeId)).subscribe({
      next: (view) => {
        if (this.loadedFor() === storeId) this.view.set(view);
      },
      error: () => {
        /* nothing saved and no connection: tax management reads as off, the POS keeps its legacy behaviour */
      },
    });
  }

  /** After an admin changes taxes or settings. */
  refresh(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) this.load(storeId);
  }

  /** Replaces what is held with a fresh answer from the server (used by the admin pages after a save). */
  apply(view: TaxView): void {
    this.view.set(view);
  }

  /**
   * The tax rules that apply to a product right now: its own active taxes, else the store's default tax. Null when the store
   * does not use tax management (the product is then priced the legacy way).
   */
  resolveLine(product: Pick<Product, 'tax'>): TaxLine | null {
    if (!this.enabled()) return null;
    const byId = new Map(this.taxes().map((t) => [t._id, t]));
    const assigned = (product.tax?.taxIds ?? []).map((id) => byId.get(String(id))).filter((t): t is Tax => !!t && t.isActive);
    const fallback = this.defaultTax();
    const applicable = assigned.length ? assigned : fallback && fallback.isActive ? [fallback] : [];
    const taxes: TaxLineRule[] = [...applicable]
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .map((t) => ({ taxId: t._id, name: t.name, code: t.code, mraTaxCode: t.mraTaxCode ?? null, kind: t.kind, rate: t.rate, compound: !!t.compound }));
    return { pricingMode: resolvePricingMode(product.tax?.pricingMode, this.defaultPricingMode()), taxes, configVersion: this.version() };
  }

  /** Puts the tax snapshot on a product going into a sale. A store that does not use tax management gets the product back untouched. */
  stamp<T extends Product>(product: T): T {
    const taxLine = this.resolveLine(product);
    return taxLine ? { ...product, taxLine } : product;
  }
}
