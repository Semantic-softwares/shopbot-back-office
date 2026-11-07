import { currencyExponent } from '../tax/currency';

/** The server holds register money as whole minor units; screens work in major units and convert here, once, at the edge. */
export const exponentOf = (currencyCode?: string | null): number => currencyExponent(currencyCode);

export const toMinor = (major: number, exponent: number): number => Math.round((major + Number.EPSILON) * 10 ** exponent);
export const fromMinor = (minor: number, exponent: number): number => minor / 10 ** exponent;

/** Reads what a person typed (accepts "1,250.50" and "1250,50") as major units; null when it is not an amount. */
export function parseMajor(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().replace(/\s/g, '');
  if (!text) return null;
  const normalised = /,\d{1,2}$/.test(text) && !/\.\d/.test(text) ? text.replace(',', '.') : text.replace(/,/g, '');
  const value = Number(normalised);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** A shortage, balanced or surplus, from a variance in minor units. */
export const varianceKind = (varianceMinor: number): 'balanced' | 'shortage' | 'surplus' => (varianceMinor === 0 ? 'balanced' : varianceMinor < 0 ? 'shortage' : 'surplus');

/** Adds up a count of notes and coins, in minor units. */
export const sumRows = (rows: { valueMinor: number; quantity: number }[]): number => rows.reduce((sum, r) => sum + r.valueMinor * Math.max(0, Math.floor(r.quantity || 0)), 0);
