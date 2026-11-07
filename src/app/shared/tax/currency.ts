/** Currencies that have no minor unit. Everything else is treated as two decimals. */
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

export function currencyExponent(code?: string | null): number {
  return ZERO_DECIMAL.has(String(code ?? '').toUpperCase()) ? 0 : 2;
}
