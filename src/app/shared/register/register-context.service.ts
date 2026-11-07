import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { StoreStore } from '../stores/store.store';
import { OfflineStore } from '../offline/offline-store.service';
import { cachedFetch } from '../offline/cached-fetch';
import { ConnectivityService } from '../offline/connectivity.service';
import { RegisterApiService } from './register-api.service';
import { RegisterTerminalService } from './register-terminal.service';
import { AuthService } from '../services/auth.service';
import { exponentOf } from './register-money';
import { CountRow, CurrentRegister, Register, RegisterContextPayload, RegisterSettings } from './register.models';

const DEVICE_KEY = 'shopbot.deviceId';

/** A stable id for this browser/device, so the server can tell tills apart. Falls back to a per-load id when storage is blocked. */
function loadDeviceId(): string {
  const make = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const created = make();
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return make();
  }
}

/**
 * Where this till stands on registers: is register management on for the store, and which session is this cashier working in.
 * Everything that touches a register (the toolbar chip, the dialogs, the cart) reads this. When the store has not turned register
 * management on, `enabled()` is false and `stamp()` returns null: the POS then behaves exactly as it always did.
 */
@Injectable({ providedIn: 'root' })
export class RegisterContextService {
  private readonly storeStore = inject(StoreStore);
  private readonly api = inject(RegisterApiService);
  private readonly offline = inject(OfflineStore);
  private readonly net = inject(ConnectivityService);
  readonly terminalState = inject(RegisterTerminalService);
  private readonly auth = inject(AuthService);

  readonly deviceId = loadDeviceId();
  readonly settings = signal<RegisterSettings | null>(null);
  readonly current = signal<CurrentRegister | null>(null);
  /** True once the first answer (or the saved copy of it) for the selected store has arrived. */
  readonly ready = signal(false);

  readonly enabled = computed(() => !!this.settings()?.registerManagementEnabled);
  /** A session is open and this cashier is on it: sales can be taken. */
  readonly hasSession = computed(() => this.current()?.session.status === 'open');
  /** The register is being closed: no new sales until it is cancelled or finished. */
  readonly closing = computed(() => this.current()?.session.status === 'closing');
  /** On a shared terminal: the cashier who switched in with their PIN (null when this is not a shared terminal or nobody is in). */
  readonly operatorName = computed(() => this.terminalState.operator()?.name ?? null);
  readonly operatorId = computed(() => this.terminalState.operator()?.userId ?? null);
  /** A shared terminal with nobody switched in: a PIN is needed first. */
  readonly needsOperator = computed(() => this.enabled() && this.terminalState.needsOperator());
  readonly exponent = computed(() => exponentOf(this.storeStore.selectedStore()?.currencyCode));
  readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode ?? null);

  private loadedFor: string | null = null;

  constructor() {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id ?? null;
      untracked(() => {
        if (storeId) this.load(storeId);
        else this.reset();
      });
    });
  }

  private reset(): void {
    this.loadedFor = null;
    this.settings.set(null);
    this.current.set(null);
    this.ready.set(false);
  }

  /** Reads the store's register settings and, when they are on, the session this cashier is on. Saved copies keep it working offline. */
  load(storeId: string): void {
    this.loadedFor = storeId;
    cachedFetch(this.offline, `register-settings:${storeId}`, this.api.settings(storeId)).subscribe({
      next: (res) => {
        if (this.loadedFor !== storeId) return;
        this.settings.set(res.settings);
        if (res.settings.registerManagementEnabled) this.loadCurrent(storeId);
        else {
          this.current.set(null);
          this.ready.set(true);
        }
      },
      // Nothing saved and no connection: registers read as off, so the POS keeps behaving as it always did.
      error: () => {
        if (this.loadedFor === storeId) this.ready.set(true);
      },
    });
  }

  private loadCurrent(storeId: string): void {
    // Per cashier: on a shared terminal the session is the one the person switched in is on.
    cachedFetch(this.offline, this.currentKey(storeId), this.api.current(storeId)).subscribe({
      next: (res) => {
        if (this.loadedFor !== storeId) return;
        const found = (res as CurrentRegister)?.session ? (res as CurrentRegister) : null;
        this.current.set(found);
        if (found) this.rememberTerminalSession(storeId, found);
        this.ready.set(true);
      },
      error: () => {
        if (this.loadedFor === storeId) this.ready.set(true);
      },
    });
  }

  // ---- a shared terminal's drawer, for a cashier who switches in with no connection ------------------------------------

  private terminalKey(storeId: string): string {
    return `register-terminal-session:${storeId}`;
  }

  /** On a shared terminal, remembers which session is open on its register, so a cashier switching in offline can carry on with it. */
  private rememberTerminalSession(storeId: string, found: CurrentRegister): void {
    const registerId = this.terminalState.terminal()?.registerId;
    if (!registerId || found.register._id !== registerId) return;
    void this.offline.setReference(this.terminalKey(storeId), { current: found, savedAt: Date.now() });
  }

  /**
   * After a cashier switched in with no connection: the register open on this terminal becomes theirs on this device, so they can keep
   * selling. Sales carry their id; the server records them as not confirmed by it. Only a session seen open in the last 12 hours.
   */
  async adoptTerminalSession(): Promise<void> {
    const storeId = this.storeStore.selectedStore()?._id;
    const userId = this.operatorId();
    if (!storeId || !userId) return;
    const saved = (await this.offline.getReference<{ current: CurrentRegister; savedAt: number }>(this.terminalKey(storeId)))?.value;
    if (!saved || saved.current.session.status !== 'open' || Date.now() - saved.savedAt > 12 * 3_600_000) return;
    const now = new Date().toISOString();
    await this.keep(storeId, { ...saved.current, assignment: { _id: `${saved.current.session._id}:${userId}`, sessionId: saved.current.session._id, cashierId: userId, startedAt: now, status: 'active', startedBy: 'switch' } });
  }

  // ---- working with no connection ------------------------------------------------------------------------------------

  private currentKey(storeId: string): string {
    return `register-current:${storeId}:${this.operatorId() ?? '-'}`;
  }

  /** The signed-in person, or the cashier switched in on a shared terminal. */
  private actingUserId(): string {
    return this.operatorId() ?? String((this.auth.currentUserValue as { _id?: string } | null)?._id ?? '');
  }

  /**
   * Opens a register on this device with no connection. The cashier can start selling at once: the session is kept here under an id this
   * device made, sales are tied to it, and the server learns about it (and gives it its real id) when the connection is back. If the
   * register turns out to have been opened elsewhere in the meantime, the sales are folded into that session and nothing is lost.
   */
  async openOffline(register: Register, declared: { openingFloatMinor: number; openingDenominations?: CountRow[]; openingNotes?: string }, clientSessionId: string = `offline-${crypto.randomUUID()}`): Promise<void> {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    const now = new Date().toISOString();
    const userId = this.actingUserId();
    const body = { registerId: register._id, openingFloatMinor: declared.openingFloatMinor, openingDenominations: declared.openingDenominations, openingNotes: declared.openingNotes, clientSessionId, deviceId: this.deviceId, offline: true, clientAt: now };
    await this.offline.enqueueRegisterEvent({ id: clientSessionId, store: storeId, kind: 'open', sessionKey: clientSessionId, body, summary: $localize`Open ${register.name}` });
    const local: CurrentRegister = {
      register,
      session: { _id: clientSessionId, storeId, registerId: register._id, status: 'open', isLive: true, openedBy: userId, openedAt: now, openingFloatMinor: declared.openingFloatMinor, openingNotes: declared.openingNotes, currencyCode: this.currencyCode() ?? undefined, exponent: this.exponent(), reconciliationStatus: 'open', offline: true },
      assignment: { _id: `${clientSessionId}:a`, sessionId: clientSessionId, cashierId: userId, startedAt: now, status: 'active', startedBy: 'open' },
    };
    await this.keep(storeId, local);
  }

  /** Records a cash movement with no connection: kept here with its own id, sent when the connection is back. */
  async queueMovement(body: { type: 'cash_in' | 'cash_out' | 'cash_deposit'; amountMinor: number; reason: string; referenceId?: string; referenceType?: string }, idempotencyKey: string = crypto.randomUUID()): Promise<void> {
    const storeId = this.storeStore.selectedStore()?._id;
    const current = this.current();
    if (!storeId || !current) return;
    const id = idempotencyKey; // the same id an earlier online attempt used, so the server records it once whichever arrives
    await this.offline.enqueueRegisterEvent({ id, store: storeId, kind: 'movement', sessionKey: current.session._id, body: { ...body, idempotencyKey: id, deviceId: this.deviceId, clientAt: new Date().toISOString() }, summary: `${body.type.replace('_', ' ')}: ${body.reason}` });
  }

  /** Records the closing count with no connection. The register stops taking sales here; the server works out the difference when it arrives. */
  async queueClose(body: { method: 'manual' | 'denomination'; actualCashMinor?: number; denominations?: CountRow[]; notes?: string }, clientEventId: string = crypto.randomUUID()): Promise<void> {
    const storeId = this.storeStore.selectedStore()?._id;
    const current = this.current();
    if (!storeId || !current) return;
    await this.offline.enqueueRegisterEvent({ id: clientEventId, store: storeId, kind: 'close', sessionKey: current.session._id, body: { ...body, deviceId: this.deviceId, clientEventId }, summary: $localize`Close ${current.register.name}` });
    await this.keep(storeId, { ...current, session: { ...current.session, status: 'closing', closingQueued: true } });
    await this.offline.setReference(this.terminalKey(storeId), { current: { ...current, session: { ...current.session, status: 'closing', closingQueued: true } }, savedAt: Date.now() });
  }

  /** What is still waiting to be sent for a session (sales, refunds, movements, a close). Shown to the cashier, and told to the server. */
  pendingFor(sessionKey: string, includeClose = true): number {
    const orders = this.offline.outbox().filter((e) => (e.order as { registerContext?: { sessionId?: string } }).registerContext?.sessionId === sessionKey).length;
    // The close that is about to be sent is not "waiting behind" anything: it is the last thing to go, so a heartbeat sent just before it does not count it.
    return orders + this.offline.registerEventsFor(sessionKey).filter((e) => includeClose || e.kind !== 'close').length;
  }

  private async keep(storeId: string, current: CurrentRegister): Promise<void> {
    this.current.set(current);
    await this.offline.setReference(this.currentKey(storeId), current);
  }

  /** The server's own id for a session this device may only know by the id it made offline. */
  async serverSessionId(storeId: string, key: string): Promise<string | null> {
    if (/^[0-9a-f]{24}$/i.test(key)) return key;
    const map = (await this.offline.getReference<Record<string, string>>(`register-session-map:${storeId}`))?.value ?? {};
    return map[key] ?? null;
  }

  async rememberSession(storeId: string, key: string, serverId: string): Promise<void> {
    const map = (await this.offline.getReference<Record<string, string>>(`register-session-map:${storeId}`))?.value ?? {};
    await this.offline.setReference(`register-session-map:${storeId}`, { ...map, [key]: serverId });
  }

  /** After opening, closing, handing over or changing the settings. */
  refresh(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) this.load(storeId);
  }

  /** Applies a settings change straight away (the settings page already has the saved answer). */
  applySettings(settings: RegisterSettings): void {
    this.settings.set(settings);
    this.refresh();
  }

  /**
   * What the POS adds to an order so the server can tie its cash to the right drawer, or null when register management is off or no
   * session is open (the order is then saved exactly as before). The server validates all of it and decides who the cashier is.
   */
  stamp(): RegisterContextPayload | null {
    const current = this.current();
    if (!this.enabled() || !current || current.session.status !== 'open') return null;
    return { registerId: current.register._id, sessionId: current.session._id, deviceId: this.deviceId, clientAt: new Date().toISOString(), offline: this.net.offline(), ...(this.operatorId() ? { operatorId: this.operatorId()! } : {}) };
  }
}
