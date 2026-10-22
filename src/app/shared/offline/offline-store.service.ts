import { Injectable, computed, signal } from '@angular/core';
import { OfflineDb } from './offline-db';
import { OutboxEntry, ReferenceEntry } from './offline.models';
import { Order } from '../models/order.model';

const CHANNEL = 'shopbot-offline';

/**
 * Everything the POS keeps on this device so it can keep selling without a connection: the outbox of orders not yet
 * accepted by the server, and a cache of the data a sale needs (products, tables…). Other tabs hear about changes
 * through a BroadcastChannel so each tab's screen stays right.
 */
@Injectable({ providedIn: 'root' })
export class OfflineStore {
  protected db = new OfflineDb();
  private readonly channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  private readonly entries = signal<OutboxEntry[]>([]);

  /** Orders waiting to reach the server, oldest first. Newest state is in memory; IndexedDB is the durable copy. */
  readonly outbox = computed(() => [...this.entries()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  readonly waiting = computed(() => this.entries().filter((e) => e.status !== 'failed').length);
  readonly failed = computed(() => this.entries().filter((e) => e.status === 'failed').length);
  readonly ready = signal(false);

  constructor() {
    this.channel && (this.channel.onmessage = () => void this.reload());
    void this.reload().finally(() => this.ready.set(true));
    void this.askToKeepData();
  }

  /** Asks the browser not to clear this data when disk space is short. Harmless if refused or unsupported. */
  private async askToKeepData(): Promise<void> {
    try { await navigator.storage?.persist?.(); } catch { /* not available */ }
  }

  async reload(): Promise<void> {
    if (!OfflineDb.supported()) return;
    try {
      const all = await this.db.getAll<OutboxEntry>('outbox');
      // A tab that closed while an order was being sent leaves it "syncing": it is simply waiting again.
      this.entries.set(all.map((e) => (e.status === 'syncing' && !this.inFlight.has(e.id) ? { ...e, status: 'pending' as const } : e)));
    } catch (e) {
      console.warn('Offline store could not be read', e);
    }
  }
  protected readonly inFlight = new Set<string>();

  private announce(): void { try { this.channel?.postMessage('changed'); } catch { /* closed */ } }

  has(id: string): boolean { return this.entries().some((e) => e.id === id); }
  get(id: string): OutboxEntry | undefined { return this.entries().find((e) => e.id === id); }

  /** Saves an order on the device. Resolves only once it is durably stored, which is the moment a sale is safe. */
  async enqueue(order: Order, storeId: string): Promise<OutboxEntry> {
    const entry: OutboxEntry = { id: String(order._id), store: storeId, order, status: 'pending', attempts: 0, createdAt: new Date().toISOString(), nextTryAt: 0 };
    await this.save(entry);
    return entry;
  }

  async save(entry: OutboxEntry): Promise<void> {
    if (OfflineDb.supported()) await this.db.put('outbox', entry);
    this.entries.update((all) => [...all.filter((e) => e.id !== entry.id), entry]);
    this.announce();
  }

  async patch(id: string, change: Partial<OutboxEntry>): Promise<void> {
    const current = this.get(id);
    if (!current) return;
    await this.save({ ...current, ...change });
  }

  /** Replaces the order inside an entry that is still waiting (an edit made before it synced). */
  async updateOrder(id: string, order: Order): Promise<void> {
    await this.patch(id, { order, status: 'pending', attempts: 0, nextTryAt: 0, lastError: undefined });
  }

  async remove(id: string): Promise<void> {
    if (OfflineDb.supported()) await this.db.delete('outbox', id);
    this.entries.update((all) => all.filter((e) => e.id !== id));
    this.announce();
  }

  markInFlight(id: string, on: boolean): void { on ? this.inFlight.add(id) : this.inFlight.delete(id); }

  // ---- reference data (what a sale needs to be rung up) ------------------------------------------------------------

  async getReference<T>(key: string): Promise<ReferenceEntry<T> | undefined> {
    if (!OfflineDb.supported()) return undefined;
    try { return await this.db.get<ReferenceEntry<T>>('reference', key); } catch { return undefined; }
  }

  async setReference<T>(key: string, value: T): Promise<void> {
    if (!OfflineDb.supported()) return;
    try { await this.db.put<ReferenceEntry<T>>('reference', { key, value, fetchedAt: Date.now() }); } catch (e) { console.warn('Could not cache', key, e); }
  }

  /** Wipes the device's cached reference data (not the outbox: an unsent sale is never thrown away silently). */
  async clearReference(): Promise<void> {
    if (OfflineDb.supported()) { try { await this.db.clear('reference'); } catch { /* nothing to clear */ } }
  }
}
