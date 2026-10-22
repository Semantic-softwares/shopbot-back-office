import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OrdersService } from '../services/order.service';
import { OrderStore } from '../stores/order.store';
import { ConnectivityService } from './connectivity.service';
import { OfflineStore } from './offline-store.service';
import { OutboxEntry } from './offline.models';

const MAX_ATTEMPTS = 6;
const LOCK = 'shopbot-outbox-drain';
/** 5 s, 10 s, 20 s … up to 5 minutes. */
export const backoffMs = (attempts: number): number => Math.min(5 * 60_000, 5_000 * 2 ** Math.max(0, attempts - 1));

/**
 * Sends the orders saved on this device to the server, oldest first, one at a time (so one bad order can never hide the
 * others). It runs when the app opens, when the network comes back, when the tab is focused, and on a timer while something
 * waits. A Web Lock makes sure only one tab drains at once. An order is deleted from the device only after the server says
 * it saved THAT order.
 */
@Injectable({ providedIn: 'root' })
export class OutboxSyncService {
  private readonly store = inject(OfflineStore);
  private readonly net = inject(ConnectivityService);
  private readonly orders = inject(OrdersService);
  private readonly orderStore = inject(OrderStore);

  readonly draining = signal(false);
  /** The server refused the saved sign-in: the orders wait until the person signs in again. */
  readonly needsSignIn = signal(false);

  constructor() {
    this.net.watch(() => this.store.waiting() > 0);
    effect(() => {
      if (this.net.online() && this.store.ready() && this.store.waiting() > 0) void this.drain();
    });
    if (typeof window !== 'undefined') setInterval(() => { if (this.store.waiting() > 0 && this.net.online()) void this.drain(); }, 20_000);
  }

  /** Tries now, whatever the timer says (the "Sync now" button). */
  async syncNow(): Promise<void> {
    await this.net.probe();
    await this.drain(true);
  }

  async drain(force = false): Promise<void> {
    if (this.draining()) return;
    if (!force && this.net.offline()) return;
    const run = () => this.run(force);
    const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined;
    if (locks?.request) await locks.request(LOCK, { ifAvailable: true }, async (lock: unknown) => { if (lock) await run(); });
    else await run();
  }

  private async run(force: boolean): Promise<void> {
    this.draining.set(true);
    try {
      await this.store.reload();
      for (const entry of this.store.outbox()) {
        if (entry.status === 'failed') continue; // needs a person; it does not hold up the sales behind it
        // Sales go oldest first. One that is waiting out a retry delay holds the later ones back too, so the tax
        // authority invoices are issued in the order the sales were made.
        if (!force && entry.nextTryAt > Date.now()) break;
        const keepGoing = await this.send(entry);
        if (!keepGoing) break;
      }
    } finally {
      this.draining.set(false);
    }
  }

  /** Sends one order. Returns false when the rest should wait too (no network, or the sign-in was refused). */
  private async send(entry: OutboxEntry): Promise<boolean> {
    const attempt = entry.attempts + 1;
    this.store.markInFlight(entry.id, true);
    await this.store.patch(entry.id, { status: 'syncing', attempts: attempt });
    try {
      const result = await firstValueFrom(this.orders.syncOrdersDetailed([{ ...entry.order, clientSync: { attempt } } as any]));
      const saved = result.syncedOrders.find((o) => String(o._id) === entry.id);
      if (saved) {
        this.needsSignIn.set(false);
        this.orderStore.applySyncedOrder(saved);
        await this.store.remove(entry.id);
        return true;
      }
      const why = result.failed.find((f) => String(f.id) === entry.id)?.error ?? 'The server did not confirm this order.';
      await this.retryLater(entry.id, attempt, why);
      return true;
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const message = error instanceof HttpErrorResponse ? (error.error?.message ?? error.message) : String(error);
      if (status === 401 || status === 403) {
        this.needsSignIn.set(true);
        await this.store.patch(entry.id, { status: 'pending', lastError: 'Sign in again to send this order.', nextTryAt: 0, attempts: entry.attempts });
        return false;
      }
      if (status === 0) {
        // No network at all is not the order's fault: it does not use up an attempt or start a retry delay.
        await this.store.patch(entry.id, { status: 'pending', attempts: entry.attempts, nextTryAt: 0, lastError: 'No connection.' });
        return false;
      }
      if (status >= 500 || status === 408 || status === 429) {
        await this.retryLater(entry.id, attempt, message || 'The server had a problem.');
        return false; // keep the order of the queue: the oldest one goes first when it is due
      }
      // The server read it and refused it (bad data): a person has to look at it. It is never deleted automatically.
      await this.store.patch(entry.id, { status: 'failed', lastError: String(message).slice(0, 300) });
      return true;
    } finally {
      this.store.markInFlight(entry.id, false);
    }
  }

  private async retryLater(id: string, attempts: number, error: string): Promise<void> {
    if (attempts >= MAX_ATTEMPTS) await this.store.patch(id, { status: 'failed', lastError: error.slice(0, 300) });
    else await this.store.patch(id, { status: 'pending', lastError: error.slice(0, 300), nextTryAt: Date.now() + backoffMs(attempts) });
  }

  /** Puts a failed order back in the queue (the "Retry" button). */
  async retry(id: string): Promise<void> {
    await this.store.patch(id, { status: 'pending', attempts: 0, nextTryAt: 0, lastError: undefined });
    void this.drain(true);
  }

  /** Throws a saved order away. Only ever called after the person confirms. */
  async discard(id: string): Promise<void> {
    await this.store.remove(id);
  }
}
