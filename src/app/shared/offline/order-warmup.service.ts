import { Injectable, effect, inject } from '@angular/core';
import { firstValueFrom, catchError, of } from 'rxjs';
import { OfflineStore } from './offline-store.service';
import { ConnectivityService } from './connectivity.service';
import { OrderService } from '../services/orders.service';
import { RefundService } from '../services/refund.service';
import { FiscalisationService } from '../services/fiscalisation.service';
import { StoreStore } from '../stores/store.store';

const FRESH_MS = 15 * 60 * 1000;
const PER_PASS = 300;
const PARALLEL = 4;

/**
 * Keeps receipts openable with no connection. While the device is online it quietly saves, for the newest sales, everything the
 * receipt page shows: the sale itself, its refund tickets and (when the store reports to a tax authority) its fiscal view.
 * Failures are ignored: this only ever makes the offline experience better, it never gets in the way of a sale.
 */
@Injectable({ providedIn: 'root' })
export class OrderWarmupService {
  private readonly offline = inject(OfflineStore);
  private readonly net = inject(ConnectivityService);
  private readonly orders = inject(OrderService);
  private readonly refunds = inject(RefundService);
  private readonly fiscal = inject(FiscalisationService);
  private readonly storeStore = inject(StoreStore);
  private running = false;
  private readonly inQueue = new Set<string>();

  /** Starts keeping the current store's recent receipts on the device. Call once, from a long-lived component. */
  start(): void {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      if (storeId && this.net.online()) void this.warmRecent(storeId);
    });
  }

  /** This month's receipts list (the page's own default view) and the receipts in it. */
  async warmRecent(storeId: string): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(last)}`;
      const list: any = await firstValueFrom(this.orders.getSalesReceipts(storeId, { start, end, employee: 'all' }).pipe(catchError(() => of(null))));
      await this.warm(storeId, (list?.orders ?? []).map((o: any) => String(o._id)));
    } catch { /* best effort */ } finally {
      this.running = false;
    }
  }

  /** Saves these receipts for offline use, a few at a time, skipping the ones saved a moment ago. */
  async warm(storeId: string, ids: string[]): Promise<void> {
    const todo = ids.filter(Boolean).slice(0, PER_PASS).filter((id) => !this.inQueue.has(id));
    todo.forEach((id) => this.inQueue.add(id));
    const next = async (): Promise<void> => {
      for (let id = todo.shift(); id; id = todo.shift()) {
        try {
          if (!this.net.online()) return;
          const hit = await this.offline.getReference(`order:${id}`);
          const hasRefunds = await this.offline.getReference(`order-refunds:${id}`);
          if (!hit || !hasRefunds || Date.now() - hit.fetchedAt > FRESH_MS) {
            await firstValueFrom(this.orders.getOrder(id).pipe(catchError(() => of(null))), { defaultValue: null });
            await firstValueFrom(this.refunds.listForOrder(id).pipe(catchError(() => of([]))), { defaultValue: [] });
            if (this.fiscal.active()) await firstValueFrom(this.fiscal.orderView(storeId, id), { defaultValue: null });
          }
        } catch { /* skip this one */ } finally { this.inQueue.delete(id); }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, next));
  }
}
