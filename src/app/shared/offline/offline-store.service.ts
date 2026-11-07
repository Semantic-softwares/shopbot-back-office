import { Injectable, computed, signal } from '@angular/core';
import { OfflineDb } from './offline-db';
import { OutboxEntry, ReferenceEntry, RefundOutboxEntry, RegisterEventEntry } from './offline.models';
import { CreateRefundRequest } from '../models/refund.model';
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
  private readonly refundEntries = signal<RefundOutboxEntry[]>([]);
  private readonly registerEntries = signal<RegisterEventEntry[]>([]);
  /** What was done at the register while offline, oldest first. */
  readonly registerEvents = computed(() => [...this.registerEntries()].sort((a, b) => a.seq - b.seq));
  /** Refunds made with no connection, oldest first. */
  readonly refunds = computed(() => [...this.refundEntries()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  // Refunds count with the sales: the toolbar light, the retry timer and "Sync now" all cover both.
  readonly waiting = computed(() => this.entries().filter((e) => e.status !== 'failed').length + this.refundEntries().filter((e) => e.status !== 'failed').length + this.registerEntries().filter((e) => e.status !== 'failed').length);
  readonly failed = computed(() => this.entries().filter((e) => e.status === 'failed').length + this.refundEntries().filter((e) => e.status === 'failed').length + this.registerEntries().filter((e) => e.status === 'failed').length);
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
      const registerEvents = await this.db.getAll<RegisterEventEntry>('registerEvents');
      this.registerEntries.set(registerEvents.map((e) => (e.status === 'syncing' && !this.inFlight.has(e.id) ? { ...e, status: 'pending' as const } : e)));
      const refunds = await this.db.getAll<RefundOutboxEntry>('refunds');
      this.refundEntries.set(refunds.map((e) => (e.status === 'syncing' && !this.inFlight.has(e.id) ? { ...e, status: 'pending' as const } : e)));
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

  // ---- refunds made with no connection ----------------------------------------------------------------------------

  getRefund(id: string): RefundOutboxEntry | undefined { return this.refundEntries().find((e) => e.id === id); }
  refundsFor(orderId: string): RefundOutboxEntry[] { return this.refunds().filter((e) => e.orderId === orderId); }

  /** Saves a refund on the device. Resolves once it is durably stored. */
  async enqueueRefund(input: { store: string; orderId: string; reference?: string; body: CreateRefundRequest; estimate: number; summary: string }): Promise<RefundOutboxEntry> {
    const entry: RefundOutboxEntry = {
      id: String(input.body.idempotencyKey),
      store: input.store,
      orderId: input.orderId,
      reference: input.reference,
      body: input.body,
      estimate: input.estimate,
      summary: input.summary,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
      nextTryAt: 0,
    };
    await this.saveRefund(entry);
    return entry;
  }

  async saveRefund(entry: RefundOutboxEntry): Promise<void> {
    if (OfflineDb.supported()) await this.db.put('refunds', entry);
    this.refundEntries.update((all) => [...all.filter((e) => e.id !== entry.id), entry]);
    this.announce();
  }

  async patchRefund(id: string, change: Partial<RefundOutboxEntry>): Promise<void> {
    const current = this.getRefund(id);
    if (current) await this.saveRefund({ ...current, ...change });
  }

  async removeRefund(id: string): Promise<void> {
    if (OfflineDb.supported()) await this.db.delete('refunds', id);
    this.refundEntries.update((all) => all.filter((e) => e.id !== id));
    this.announce();
  }

  // ---- register events made with no connection ----------------------------------------------------------------------

  getRegisterEvent(id: string): RegisterEventEntry | undefined { return this.registerEntries().find((e) => e.id === id); }
  registerEventsFor(sessionKey: string): RegisterEventEntry[] { return this.registerEvents().filter((e) => e.sessionKey === sessionKey); }

  /** Saves a register event on the device. Resolves once it is durably stored. */
  async enqueueRegisterEvent(input: { id: string; store: string; kind: RegisterEventEntry['kind']; sessionKey: string; body: any; summary: string }): Promise<RegisterEventEntry> {
    const entry: RegisterEventEntry = { ...input, seq: Date.now() * 1000 + (this.registerEntries().length % 1000), status: 'pending', attempts: 0, createdAt: new Date().toISOString(), nextTryAt: 0 };
    await this.saveRegisterEvent(entry);
    return entry;
  }

  async saveRegisterEvent(entry: RegisterEventEntry): Promise<void> {
    if (OfflineDb.supported()) await this.db.put('registerEvents', entry);
    this.registerEntries.update((all) => [...all.filter((e) => e.id !== entry.id), entry]);
    this.announce();
  }

  async patchRegisterEvent(id: string, change: Partial<RegisterEventEntry>): Promise<void> {
    const current = this.getRegisterEvent(id);
    if (current) await this.saveRegisterEvent({ ...current, ...change });
  }

  async removeRegisterEvent(id: string): Promise<void> {
    if (OfflineDb.supported()) await this.db.delete('registerEvents', id);
    this.registerEntries.update((all) => all.filter((e) => e.id !== id));
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
