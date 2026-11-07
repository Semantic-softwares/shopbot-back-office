/**
 * Checking a PIN on the device, for a shared terminal with no connection. The server hands an enrolled terminal a salted PBKDF2
 * verifier for each cashier (never the PIN); the browser can compute PBKDF2 and the PIN is never stored or sent anywhere here.
 * A few wrong tries lock that cashier on this device for a while, as the server does online.
 */
export interface PinVerifier {
  salt: string;
  iterations: number;
  hash: string;
}

const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (text: string): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(new ArrayBuffer(text.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(text.slice(i * 2, i * 2 + 2), 16);
  return out;
};

/** True when the PIN matches the verifier. False for anything that cannot be checked (no WebCrypto, a damaged verifier). */
export async function verifyPinOffline(pin: string, verifier: PinVerifier): Promise<boolean> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle || !verifier?.salt || !verifier.hash) return false;
    const key = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(verifier.salt), iterations: verifier.iterations }, key, 256);
    const got = hex(new Uint8Array(bits));
    // Same length, compared without stopping at the first difference.
    let diff = got.length ^ verifier.hash.length;
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ (verifier.hash.charCodeAt(i) || 0);
    return diff === 0;
  } catch {
    return false;
  }
}

export const OFFLINE_PIN_MAX_ATTEMPTS = 5;
export const OFFLINE_PIN_LOCK_MS = 5 * 60_000;

/** Wrong-PIN counting for offline tries; kept for this browser session only. */
export class OfflinePinLimiter {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = sessionStorage, private readonly now: () => number = Date.now) {}

  private key(userId: string): string {
    return `shopbot.pin.offline.${userId}`;
  }
  private read(userId: string): { n: number; until: number } {
    try {
      return JSON.parse(this.storage.getItem(this.key(userId)) ?? '') as { n: number; until: number };
    } catch {
      return { n: 0, until: 0 };
    }
  }
  /** Milliseconds this cashier is still locked for, 0 when free. */
  lockedFor(userId: string): number {
    return Math.max(0, this.read(userId).until - this.now());
  }
  failed(userId: string): void {
    const s = this.read(userId);
    const n = (s.n ?? 0) + 1;
    const lock = n >= OFFLINE_PIN_MAX_ATTEMPTS;
    try {
      this.storage.setItem(this.key(userId), JSON.stringify({ n: lock ? 0 : n, until: lock ? this.now() + OFFLINE_PIN_LOCK_MS : 0 }));
    } catch {
      /* storage blocked */
    }
  }
  succeeded(userId: string): void {
    try {
      this.storage.removeItem(this.key(userId));
    } catch {
      /* storage blocked */
    }
  }
}
