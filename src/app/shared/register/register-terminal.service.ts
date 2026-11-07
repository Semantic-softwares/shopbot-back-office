import { computed, inject, Injectable, signal } from '@angular/core';
import { StoreStore } from '../stores/store.store';
import { RegisterApiService } from './register-api.service';
import { TerminalStaff } from './register.models';

const TERMINAL_KEY = 'shopbot.terminal';
const OPERATOR_KEY = 'shopbot.operator';
const STAFF_KEY = 'shopbot.terminal.staff';
/** An operator who switched in with no connection is trusted on this device for as long as an online one would be. */
const OFFLINE_OPERATOR_MS = 12 * 3_600_000;
/** A shared till is locked again after this long with nobody touching it. */
const IDLE_LOCK_MS = 15 * 60_000;

export interface TerminalRecord {
  deviceId: string;
  name: string;
  secret: string;
  registerId?: string;
}

export interface OperatorRecord {
  /** Empty for a cashier who switched in offline: there was no server to issue one. */
  token: string;
  /** Checked on this device only; the server records the cashier as not verified. */
  offline?: boolean;
  at?: number;
  userId: string;
  name: string | null;
}

const read = <T>(storage: Storage, key: string): T | null => {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (storage: Storage, key: string, value: unknown): void => {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the state still works for this page load */
  }
};

/** When the operator token expires, read from the token itself (it is a signed JWT; the server is the one that enforces it). */
function expiresAt(token: string): number {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Whether THIS device is a shared terminal (one a manager enrolled), and who is switched in on it right now. A device that was never
 * enrolled has no terminal record and none of this applies: each cashier simply signs in with their own account.
 *
 * The terminal's secret lives in this device's local storage; the operator (the cashier who switched in with a PIN) lives in session
 * storage and is dropped after 15 idle minutes, on sign-out, or when the token runs out.
 */
@Injectable({ providedIn: 'root' })
export class RegisterTerminalService {
  private readonly api = inject(RegisterApiService);
  private readonly storeStore = inject(StoreStore);

  readonly terminal = signal<TerminalRecord | null>(read<TerminalRecord>(localStorage, TERMINAL_KEY));
  readonly operator = signal<OperatorRecord | null>(this.valid(read<OperatorRecord>(sessionStorage, OPERATOR_KEY)));

  /** This device is an enrolled shared terminal. */
  readonly isTerminal = computed(() => !!this.terminal());
  /** A shared terminal with nobody switched in: a PIN is needed before a sale. */
  readonly needsOperator = computed(() => this.isTerminal() && !this.operator());

  private lastActivity = Date.now();
  private watching = false;

  constructor() {
    if (this.operator()) this.watchIdle();
  }

  private valid(op: OperatorRecord | null): OperatorRecord | null {
    return op && this.expiry(op) > Date.now() ? op : null;
  }

  private expiry(op: OperatorRecord): number {
    return op.offline ? (op.at ?? 0) + OFFLINE_OPERATOR_MS : expiresAt(op.token);
  }

  /** The team as last loaded from the server, kept so the PIN screen opens at once and still works with no connection. */
  cachedStaff(storeId: string): TerminalStaff[] | null {
    const saved = read<{ storeId: string; staff: TerminalStaff[] }>(localStorage, STAFF_KEY);
    return saved && saved.storeId === storeId ? saved.staff : null;
  }

  saveStaff(storeId: string, staff: TerminalStaff[]): void {
    write(localStorage, STAFF_KEY, { storeId, staff });
  }

  /** Makes this device a shared terminal. The secret is shown by the server once; this is where it is kept. */
  enrol(registerId: string | undefined, name: string, deviceId: string) {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return null;
    return this.api.enrolTerminal(storeId, { deviceId, name, registerId });
  }

  save(record: TerminalRecord): void {
    this.terminal.set(record);
    write(localStorage, TERMINAL_KEY, record);
  }

  forget(): void {
    this.terminal.set(null);
    this.clearOperator();
    write(localStorage, TERMINAL_KEY, null);
    write(localStorage, STAFF_KEY, null);
  }

  setOperator(op: OperatorRecord): void {
    this.operator.set(op);
    write(sessionStorage, OPERATOR_KEY, op);
    this.touch();
    this.watchIdle();
  }

  clearOperator(): void {
    this.operator.set(null);
    write(sessionStorage, OPERATOR_KEY, null);
  }

  /** Called on any activity; keeps the cashier switched in. */
  touch(): void {
    this.lastActivity = Date.now();
  }

  private watchIdle(): void {
    if (this.watching || typeof window === 'undefined') return;
    this.watching = true;
    for (const event of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(event, () => this.touch(), { passive: true });
    setInterval(() => {
      const op = this.operator();
      if (!op) return;
      if (Date.now() - this.lastActivity > IDLE_LOCK_MS || this.expiry(op) <= Date.now()) this.clearOperator();
    }, 30_000);
  }
}
