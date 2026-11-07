import { Denomination } from './register.models';
import { currencyExponent } from '../tax/currency';

/**
 * The notes and coins of a currency, highest first, as minor units. Mirrors the server's list (which stays authoritative: it re-adds every
 * count itself). A store's own list, when it set one, takes precedence.
 */
const major = (exponent: number, notes: number[], coins: number[]): Denomination[] =>
  [...notes.map((n) => ({ valueMinor: Math.round(n * 10 ** exponent), kind: 'note' as const })), ...coins.map((c) => ({ valueMinor: Math.round(c * 10 ** exponent), kind: 'coin' as const }))].sort((a, b) => b.valueMinor - a.valueMinor);

const CATALOGUE: Record<string, Denomination[]> = {
  MUR: major(2, [2000, 1000, 500, 200, 100, 50, 25], [20, 10, 5, 1, 0.5, 0.2, 0.05]),
  USD: major(2, [100, 50, 20, 10, 5, 2, 1], [1, 0.5, 0.25, 0.1, 0.05, 0.01]),
  EUR: major(2, [500, 200, 100, 50, 20, 10, 5], [2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]),
  GBP: major(2, [50, 20, 10, 5], [2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]),
  RWF: major(0, [5000, 2000, 1000, 500], [100, 50, 20, 10, 5, 1]),
  KES: major(2, [1000, 500, 200, 100, 50], [40, 20, 10, 5, 1]),
};

export function denominationsFor(currencyCode: string | null | undefined, override?: Denomination[] | null): Denomination[] {
  if (override?.length) return [...override].sort((a, b) => b.valueMinor - a.valueMinor);
  const code = String(currencyCode ?? '').toUpperCase();
  if (CATALOGUE[code]) return CATALOGUE[code];
  const exponent = currencyExponent(code);
  return [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1].map((s) => ({ valueMinor: s * 10 ** exponent, kind: (s >= 20 ? 'note' : 'coin') as 'note' | 'coin' }));
}
