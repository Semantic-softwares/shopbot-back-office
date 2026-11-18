import { Injectable, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfflineStore } from './offline-store.service';
import { ConnectivityService } from './connectivity.service';
import { StoreStore } from '../stores/store.store';
import { generateReference } from '../constants/identity.constant';

interface Range { first: number; last: number }
interface NumberBlock { prefix: string; pad: number; ranges: Range[] }

const BLOCK_SIZE = 25;
/** Top up in the background when fewer than this are left, so a till never goes offline with an empty block. */
const REFILL_BELOW = 10;

/**
 * Order numbers for sales made at this till, in order (ORD-000003, ORD-000004 ...) even with no connection. While online the till
 * reserves a small block of real numbers from the server and keeps it on the device; each sale takes the next one. The server never
 * gives those numbers to anyone else. A till that has never been online has no block, and uses a temporary number that the server
 * replaces when the sale syncs.
 */
@Injectable({ providedIn: 'root' })
export class OrderNumberService {
  private readonly http = inject(HttpClient);
  private readonly offline = inject(OfflineStore);
  private readonly net = inject(ConnectivityService);
  private readonly storeStore = inject(StoreStore);
  private queue: Promise<unknown> = Promise.resolve();

  /** The next order number for this store. Calls are served one at a time so two quick sales can never take the same number. */
  next(storeId: string): Promise<string> {
    const run = this.queue.then(() => this.take(storeId), () => this.take(storeId));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private key(storeId: string): string { return `order-numbers:${storeId}`; }

  private async load(storeId: string): Promise<NumberBlock | null> {
    try { return (await this.offline.getReference<NumberBlock>(this.key(storeId)))?.value ?? null; } catch { return null; }
  }

  private async fetchBlock(storeId: string): Promise<{ prefix: string; first: number; last: number; pad: number } | null> {
    try {
      return await firstValueFrom(this.http.post<{ prefix: string; first: number; last: number; pad: number }>(`${environment.apiUrl}/orders/store/${storeId}/reference-block`, { size: BLOCK_SIZE }).pipe(timeout(20000)));
    } catch { return null; }
  }

  private remaining(block: NumberBlock | null): number {
    return (block?.ranges ?? []).reduce((sum, r) => sum + Math.max(r.last - r.first + 1, 0), 0);
  }

  private async topUp(storeId: string, block: NumberBlock | null): Promise<NumberBlock | null> {
    const got = await this.fetchBlock(storeId);
    if (!got) return block;
    const merged: NumberBlock = { prefix: got.prefix, pad: got.pad, ranges: [...(block?.ranges ?? []), { first: got.first, last: got.last }] };
    try { await this.offline.setReference(this.key(storeId), merged); } catch { /* the numbers are still used for this sale */ }
    return merged;
  }

  private topping = false;

  /** Keeps a block of numbers on this device from the moment it is online, so even the first sale made offline gets a real number. */
  start(): void {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      if (storeId && this.net.online()) void this.load(storeId).then((block) => { if (this.remaining(block) < REFILL_BELOW) void this.topUpLater(storeId); });
    });
  }

  /** Fetches another block without holding up the sale that noticed the block was running low. */
  private async topUpLater(storeId: string): Promise<void> {
    if (this.topping) return;
    this.topping = true;
    try {
      const got = await this.fetchBlock(storeId);
      if (!got) return;
      // Added to what is left (read again, since sales may have used numbers meanwhile), serialised with the sales.
      await this.queue.then(async () => {
        const block = await this.load(storeId);
        const merged: NumberBlock = { prefix: got.prefix, pad: got.pad, ranges: [...(block?.ranges ?? []), { first: got.first, last: got.last }] };
        try { await this.offline.setReference(this.key(storeId), merged); } catch { /* the numbers are unused; skipped */ }
      }, () => undefined);
    } finally {
      this.topping = false;
    }
  }

  private async take(storeId: string): Promise<string> {
    let block = await this.load(storeId);
    // Only when nothing is left to use does a sale wait for more numbers; running low just tops up in the background.
    if (this.remaining(block) === 0 && this.net.online()) block = await this.topUp(storeId, block);
    else if (this.remaining(block) < REFILL_BELOW && this.net.online()) void this.topUpLater(storeId);
    const range = block?.ranges.find((r) => r.first <= r.last);
    if (!block || !range) return generateReference();
    const number = range.first++;
    block.ranges = block.ranges.filter((r) => r.first <= r.last);
    try { await this.offline.setReference(this.key(storeId), block); } catch { /* see above */ }
    return `${block.prefix}${String(number).padStart(block.pad, '0')}`;
  }
}
