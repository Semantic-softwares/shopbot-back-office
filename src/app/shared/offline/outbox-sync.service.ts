import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OrdersService } from '../services/order.service';
import { RefundService } from '../services/refund.service';
import { RegisterApiService } from '../register/register-api.service';
import { RegisterContextService } from '../register/register-context.service';
import { OrderStore } from '../stores/order.store';
import { ConnectivityService } from './connectivity.service';
import { OfflineStore } from './offline-store.service';
import { OutboxEntry, RefundOutboxEntry, RegisterEventEntry } from './offline.models';

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
  private readonly refunds = inject(RefundService);
  private readonly registerApi = inject(RegisterApiService);
  private readonly register = inject(RegisterContextService);

  readonly draining = signal(false);
  /** The server refused the saved sign-in: the orders wait until the person signs in again. */
  readonly needsSignIn = signal(false);
  /** The server refused the queue because the subscription is locked. The orders wait; they are not lost. */
  readonly accountLocked = signal(false);

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
      // A register opened offline is sent FIRST: the sales made against it name the session this device made, and the server must know it.
      if (!(await this.runRegisterEvents(['open'], force))) return;
      for (const entry of this.store.outbox()) {
        if (entry.status === 'failed') continue; // needs a person; it does not hold up the sales behind it
        // Sales go oldest first. One that is waiting out a retry delay holds the later ones back too, so the tax
        // authority invoices are issued in the order the sales were made.
        if (!force && entry.nextTryAt > Date.now()) break;
        const keepGoing = await this.send(entry);
        if (!keepGoing) return;
      }
      await this.runRefunds(force);
      // After the sales and refunds: the cash movements, then what this till still has waiting, then the closing count.
      if (!(await this.runRegisterEvents(['movement'], force))) return;
      await this.sendHeartbeats();
      if (!(await this.runRegisterEvents(['close'], force))) return;
      await this.sendHeartbeats();
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
        this.accountLocked.set(false);
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
      if (status === 403 && error instanceof HttpErrorResponse && error.error?.errorCode === 'SUBSCRIPTION_EXPIRED') {
        // The account is locked, not signed out. The sale stays queued and goes through as soon as the subscription is paid.
        this.accountLocked.set(true);
        await this.store.patch(entry.id, { status: 'pending', lastError: 'Account locked. It will send once the subscription is paid.', nextTryAt: Date.now() + 60_000, attempts: entry.attempts });
        return false;
      }
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

  /**
   * Sends the refunds made with no connection, oldest first, once every sale ahead of them is on the server (a refund needs its
   * sale to exist). The server decides the amount and issues the credit note; the idempotency key means a retry never refunds twice.
   */
  private async runRefunds(force: boolean): Promise<void> {
    for (const entry of this.store.refunds()) {
      if (entry.status === 'failed') continue;
      if (this.store.has(entry.orderId)) continue; // its sale is still waiting to be sent
      if (!force && entry.nextTryAt > Date.now()) break;
      if (!(await this.sendRefund(entry))) break;
    }
  }

  private async sendRefund(entry: RefundOutboxEntry): Promise<boolean> {
    const attempt = entry.attempts + 1;
    this.store.markInFlight(entry.id, true);
    await this.store.patchRefund(entry.id, { status: 'syncing', attempts: attempt });
    try {
      await firstValueFrom(this.refunds.create(entry.orderId, { ...entry.body, idempotencyKey: entry.id }));
      this.needsSignIn.set(false);
      this.accountLocked.set(false);
      await this.store.removeRefund(entry.id);
      return true;
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const message = error instanceof HttpErrorResponse ? (error.error?.message ?? error.message) : String(error);
      if (status === 403 && error instanceof HttpErrorResponse && error.error?.errorCode === 'SUBSCRIPTION_EXPIRED') {
        this.accountLocked.set(true);
        await this.store.patchRefund(entry.id, { status: 'pending', lastError: 'Account locked. It will send once the subscription is paid.', nextTryAt: Date.now() + 60_000, attempts: entry.attempts });
        return false;
      }
      if (status === 401 || (status === 403 && error instanceof HttpErrorResponse && error.error?.code !== 'APPROVAL_REQUIRED')) {
        this.needsSignIn.set(true);
        await this.store.patchRefund(entry.id, { status: 'pending', lastError: 'Sign in again to send this refund.', nextTryAt: 0, attempts: entry.attempts });
        return false;
      }
      if (status === 0) {
        await this.store.patchRefund(entry.id, { status: 'pending', attempts: entry.attempts, nextTryAt: 0, lastError: 'No connection.' });
        return false;
      }
      if (status >= 500 || status === 408 || status === 429) {
        const exhausted = attempt >= MAX_ATTEMPTS;
        await this.store.patchRefund(entry.id, exhausted ? { status: 'failed', lastError: String(message).slice(0, 300) } : { status: 'pending', lastError: String(message).slice(0, 300), nextTryAt: Date.now() + backoffMs(attempt) });
        return false;
      }
      // The server read it and refused it (already refunded, needs a manager, sale changed…): a person has to look at it.
      await this.store.patchRefund(entry.id, { status: 'failed', lastError: String(message).slice(0, 300) });
      return true;
    } finally {
      this.store.markInFlight(entry.id, false);
    }
  }

  // ---- register events made offline ------------------------------------------------------------------------------------

  /** Sends the register events of these kinds, oldest first. Returns false when the rest must wait (no network, signed out, locked). */
  private async runRegisterEvents(kinds: RegisterEventEntry['kind'][], force: boolean): Promise<boolean> {
    for (const entry of this.store.registerEvents()) {
      if (!kinds.includes(entry.kind) || entry.status === 'failed') continue;
      if (!force && entry.nextTryAt > Date.now()) break;
      const result = await this.sendRegisterEvent(entry);
      if (result === 'stop') return false;
    }
    return true;
  }

  private async sendRegisterEvent(entry: RegisterEventEntry): Promise<'sent' | 'skipped' | 'stop'> {
    const storeId = entry.store;
    // Anything sent for a session needs the server's own id for it; a register opened here is mapped when its open goes through.
    const sessionId = entry.kind === 'open' ? null : await this.register.serverSessionId(storeId, entry.sessionKey);
    if (entry.kind !== 'open' && !sessionId) return 'skipped'; // its open has not been sent yet
    // A close goes last: only once every sale, refund and movement for the session is on the server (or has been given up on by a person).
    if (entry.kind === 'close' && (this.register.pendingFor(entry.sessionKey, false) > 0)) return 'skipped';

    const attempt = entry.attempts + 1;
    this.store.markInFlight(entry.id, true);
    await this.store.patchRegisterEvent(entry.id, { status: 'syncing', attempts: attempt });
    try {
      if (entry.kind === 'open') {
        const res = await firstValueFrom(this.registerApi.open(storeId, entry.body));
        await this.register.rememberSession(storeId, entry.sessionKey, res.session._id);
      } else if (entry.kind === 'movement') {
        await firstValueFrom(this.registerApi.addMovement(storeId, sessionId!, entry.body));
      } else {
        await firstValueFrom(this.registerApi.close(storeId, sessionId!, entry.body));
      }
      await this.store.removeRegisterEvent(entry.id);
      this.register.refresh();
      return 'sent';
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const message = error instanceof HttpErrorResponse ? (error.error?.message ?? error.message) : String(error);
      if (status === 0) {
        await this.store.patchRegisterEvent(entry.id, { status: 'pending', attempts: entry.attempts, nextTryAt: 0, lastError: 'No connection.' });
        return 'stop';
      }
      if (status === 401 || (status === 403 && error instanceof HttpErrorResponse && error.error?.code !== 'APPROVAL_REQUIRED')) {
        this.needsSignIn.set(true);
        await this.store.patchRegisterEvent(entry.id, { status: 'pending', attempts: entry.attempts, nextTryAt: 0, lastError: 'Sign in again to send this.' });
        return 'stop';
      }
      if (status >= 500 || status === 408 || status === 429) {
        const exhausted = attempt >= MAX_ATTEMPTS;
        await this.store.patchRegisterEvent(entry.id, exhausted ? { status: 'failed', lastError: String(message).slice(0, 300) } : { status: 'pending', lastError: String(message).slice(0, 300), nextTryAt: Date.now() + backoffMs(attempt) });
        return 'stop';
      }
      // The server read it and refused it (the session closed in the meantime, a manager is needed...): a person has to look at it.
      await this.store.patchRegisterEvent(entry.id, { status: 'failed', lastError: String(message).slice(0, 300) });
      return 'sent';
    } finally {
      this.store.markInFlight(entry.id, false);
    }
  }

  /**
   * Tells the server what this till still has waiting for each session it has worked, so a close is never called "reconciled" while a till
   * has records to send. Best effort: a failure here never stops anything else.
   */
  private async sendHeartbeats(): Promise<void> {
    if (!this.register.enabled()) return;
    const keys = new Set<string>();
    const current = this.register.current()?.session._id;
    if (current) keys.add(current);
    for (const e of this.store.registerEvents()) keys.add(e.sessionKey);
    for (const o of this.store.outbox()) {
      const key = (o.order as { registerContext?: { sessionId?: string } }).registerContext?.sessionId;
      if (key) keys.add(key);
    }
    const storeId = this.register.current()?.session.storeId ?? this.store.registerEvents()[0]?.store;
    if (!storeId) return;
    for (const key of keys) {
      const target = (await this.register.serverSessionId(storeId, key)) ?? key;
      try {
        await firstValueFrom(this.registerApi.heartbeat(storeId, target, { deviceId: this.register.deviceId, pendingCount: this.register.pendingFor(key, false), hadActivity: true }));
      } catch {
        /* the next drain will say it again */
      }
    }
  }

  /** Puts a failed register event back in the queue. */
  async retryRegisterEvent(id: string): Promise<void> {
    await this.store.patchRegisterEvent(id, { status: 'pending', attempts: 0, nextTryAt: 0, lastError: undefined });
    void this.drain(true);
  }

  /** Throws a saved register event away. Only ever called after the person confirms. */
  async discardRegisterEvent(id: string): Promise<void> {
    await this.store.removeRegisterEvent(id);
  }

  /** Puts a failed refund back in the queue. */
  async retryRefund(id: string): Promise<void> {
    await this.store.patchRefund(id, { status: 'pending', attempts: 0, nextTryAt: 0, lastError: undefined });
    void this.drain(true);
  }

  /** Throws a saved refund away. Only ever called after the person confirms. */
  async discardRefund(id: string): Promise<void> {
    await this.store.removeRefund(id);
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
