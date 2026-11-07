import { OfflinePinLimiter, OFFLINE_PIN_LOCK_MS, verifyPinOffline } from './register-pin-offline';

const toHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

async function make(pin: string) {
  const salt = '00112233445566778899aabbccddeeff';
  const saltBytes = new Uint8Array(salt.match(/../g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 1000 }, key, 256);
  return { salt, iterations: 1000, hash: toHex(bits) };
}

describe('checking a PIN on the device', () => {
  it('accepts the right PIN and rejects a wrong one', async () => {
    const v = await make('4821');
    expect(await verifyPinOffline('4821', v)).toBeTrue();
    expect(await verifyPinOffline('4822', v)).toBeFalse();
  });

  it('rejects when the verifier is damaged or missing', async () => {
    expect(await verifyPinOffline('4821', { salt: '', iterations: 1, hash: '' })).toBeFalse();
  });

  it('locks a cashier after five wrong tries, for five minutes', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
    let t = 1_000;
    const limiter = new OfflinePinLimiter(storage, () => t);
    for (let i = 0; i < 4; i++) limiter.failed('u1');
    expect(limiter.lockedFor('u1')).toBe(0);
    limiter.failed('u1');
    expect(limiter.lockedFor('u1')).toBe(OFFLINE_PIN_LOCK_MS);
    t += OFFLINE_PIN_LOCK_MS + 1;
    expect(limiter.lockedFor('u1')).toBe(0);
    limiter.failed('u1');
    limiter.succeeded('u1');
    expect(limiter.lockedFor('u2')).toBe(0);
  });
});
