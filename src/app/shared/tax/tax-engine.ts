/**
 * Shopbot tax engine. The ONE place tax is calculated.
 *
 * Pure TypeScript, no framework imports, so the same file runs on the server and (copied verbatim) in the back office.
 * `tax-engine.vectors.json` is run by both repos' test suites so the two copies cannot drift.
 *
 * Money is integer minor units (cents; 0 for zero-decimal currencies). Rates are percentages and are scaled to integers
 * (1e-4 of a percent) so independent taxes are computed without floating point. Only compound taxes need a float factor.
 *
 * Every cart line is calculated on its own: a cart may mix inclusive and exclusive products, and different taxes.
 */
export const TAX_ENGINE_VERSION = 1;

export type PricingMode = 'inclusive' | 'exclusive';
export type TaxKind = 'standard' | 'zero_rated' | 'exempt';

export interface TaxRule {
  taxId?: string;
  name: string;
  code?: string;
  mraTaxCode?: string | null;
  kind: TaxKind;
  /** Percentage, e.g. 15 for 15%. */
  rate: number;
  /** A compound tax is charged on the amount including the taxes before it (by priority). */
  compound?: boolean;
  priority?: number;
}

export interface TaxLineInput {
  key: string;
  /** Price of one unit as the customer sees it, options included, in minor units. */
  unitMinor: number;
  quantity: number;
  /** Already resolved: never 'inherit' here. */
  mode: PricingMode;
  taxes: TaxRule[];
  /** Discount that belongs to this line only (item-level), minor units. */
  lineDiscountMinor?: number;
}

export interface TaxCalculationInput {
  lines: TaxLineInput[];
  /** Order-level discount already resolved to an amount (minor units); shared across lines in proportion to their value. */
  orderDiscountMinor?: number;
}

export interface LineTaxDetail {
  taxId?: string;
  name: string;
  code?: string;
  mraTaxCode?: string | null;
  kind: TaxKind;
  rate: number;
  compound: boolean;
  taxableAmount: number;
  taxAmount: number;
}

export interface LineTaxResult {
  key: string;
  pricingMode: PricingMode;
  /** unit × quantity before any discount. */
  enteredAmount: number;
  discountAllocated: number;
  taxableAmount: number;
  taxAmount: number;
  /** What the customer pays for the line: inclusive keeps the entered (discounted) amount, exclusive adds the tax. */
  total: number;
  taxes: LineTaxDetail[];
}

export interface TaxBreakdownRow {
  taxId?: string;
  name: string;
  code?: string;
  mraTaxCode?: string | null;
  kind: TaxKind;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxSummaryResult {
  /** Sum of entered amounts before discounts. */
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  totalTax: number;
  includedTax: number;
  addedTax: number;
  zeroRatedSales: number;
  exemptSales: number;
  /** Sum of line totals (payable, before delivery or service fees). */
  total: number;
  taxBreakdown: TaxBreakdownRow[];
}

export interface TaxCalculationResult {
  lines: LineTaxResult[];
  summary: TaxSummaryResult;
}

const RATE_SCALE = 10_000; // 1e-4 of a percent
const PERCENT_DENOMINATOR = 100 * RATE_SCALE; // rate (scaled) / this = fraction

export const toMinor = (amount: number, exponent = 2): number => Math.round((Number(amount) || 0) * 10 ** exponent);
export const fromMinor = (minor: number, exponent = 2): number => minor / 10 ** exponent;

/** Integer division rounded half up, for non-negative integers. */
function divRound(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

/** Splits `total` across `weights` so the parts add up to exactly `total` (largest remainder). */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total === 0 || sum === 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const parts = exact.map(Math.floor);
  let remaining = total - parts.reduce((a, b) => a + b, 0);
  const order = exact.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order) {
    if (remaining <= 0) break;
    parts[index] += 1;
    remaining -= 1;
  }
  return parts;
}

const sortedTaxes = (taxes: TaxRule[]): TaxRule[] => [...taxes].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
const scaledRate = (tax: TaxRule): number => Math.round(Math.max(0, Number(tax.rate) || 0) * RATE_SCALE);

/**
 * Per-unit multipliers u_i: an independent tax is r_i of the taxable amount, a compound tax is r_i of the taxable amount
 * plus the taxes before it. factor = 1 + Σ u_i.
 */
function unitMultipliers(taxes: TaxRule[]): number[] {
  const multipliers: number[] = [];
  let before = 0;
  for (const tax of taxes) {
    const rate = scaledRate(tax) / PERCENT_DENOMINATOR;
    const u = tax.compound ? rate * (1 + before) : rate;
    multipliers.push(u);
    before += u;
  }
  return multipliers;
}

function calculateLine(line: TaxLineInput, discountAllocated: number): LineTaxResult {
  const quantity = Math.max(0, Number(line.quantity) || 0);
  const entered = Math.round(line.unitMinor) * quantity;
  const net = Math.max(0, entered - discountAllocated); // E: what the customer is charged for the line before added tax
  const taxes = sortedTaxes(line.taxes ?? []);

  if (!taxes.length || net === 0) {
    return { key: line.key, pricingMode: line.mode, enteredAmount: entered, discountAllocated, taxableAmount: net, taxAmount: 0, total: net, taxes: [] };
  }

  const u = unitMultipliers(taxes);
  const sumU = u.reduce((a, b) => a + b, 0);
  const allIndependent = taxes.every((t) => !t.compound);

  let taxable: number;
  let totalTax: number;
  if (line.mode === 'inclusive') {
    if (allIndependent) {
      const rates = taxes.reduce((sum, t) => sum + scaledRate(t), 0);
      taxable = divRound(net * PERCENT_DENOMINATOR, PERCENT_DENOMINATOR + rates);
    } else {
      taxable = Math.round(net / (1 + sumU));
    }
    totalTax = net - taxable;
  } else {
    taxable = net;
    if (allIndependent) {
      const rates = taxes.reduce((sum, t) => sum + scaledRate(t), 0);
      totalTax = divRound(net * rates, PERCENT_DENOMINATOR);
    } else {
      totalTax = Math.round(net * sumU);
    }
  }

  // Share the line's tax across its taxes by their multiplier, so the parts add up exactly.
  const amounts = allocate(totalTax, u);
  let base = taxable;
  const details: LineTaxDetail[] = taxes.map((tax, i) => {
    const detail: LineTaxDetail = {
      taxId: tax.taxId,
      name: tax.name,
      code: tax.code,
      mraTaxCode: tax.mraTaxCode ?? null,
      kind: tax.kind,
      rate: Number(tax.rate) || 0,
      compound: !!tax.compound,
      taxableAmount: base,
      taxAmount: amounts[i],
    };
    if (tax.compound) base += amounts[i];
    return detail;
  });

  return {
    key: line.key,
    pricingMode: line.mode,
    enteredAmount: entered,
    discountAllocated,
    taxableAmount: taxable,
    taxAmount: totalTax,
    total: line.mode === 'inclusive' ? net : net + totalTax,
    taxes: details,
  };
}

export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const lines = input.lines;
  const entered = lines.map((l) => Math.round(l.unitMinor) * Math.max(0, Number(l.quantity) || 0));
  const lineDiscounts = lines.map((l, i) => Math.min(entered[i], Math.max(0, Math.round(l.lineDiscountMinor ?? 0))));
  const afterLineDiscount = entered.map((e, i) => e - lineDiscounts[i]);
  const orderDiscount = Math.min(Math.max(0, Math.round(input.orderDiscountMinor ?? 0)), afterLineDiscount.reduce((a, b) => a + b, 0));
  const orderShares = allocate(orderDiscount, afterLineDiscount);

  const results = lines.map((line, i) => calculateLine(line, lineDiscounts[i] + orderShares[i]));

  const breakdown = new Map<string, TaxBreakdownRow>();
  let includedTax = 0;
  let addedTax = 0;
  let zeroRated = 0;
  let exempt = 0;
  for (const result of results) {
    if (result.pricingMode === 'inclusive') includedTax += result.taxAmount;
    else addedTax += result.taxAmount;
    for (const detail of result.taxes) {
      const key = `${detail.taxId ?? detail.code ?? detail.name}|${detail.rate}`;
      const row = breakdown.get(key) ?? { taxId: detail.taxId, name: detail.name, code: detail.code, mraTaxCode: detail.mraTaxCode, kind: detail.kind, rate: detail.rate, taxableAmount: 0, taxAmount: 0 };
      row.taxableAmount += detail.taxableAmount;
      row.taxAmount += detail.taxAmount;
      breakdown.set(key, row);
      if (detail.kind === 'zero_rated') zeroRated += detail.taxableAmount;
      if (detail.kind === 'exempt') exempt += detail.taxableAmount;
    }
  }

  const sum = (pick: (r: LineTaxResult) => number) => results.reduce((a, r) => a + pick(r), 0);
  return {
    lines: results,
    summary: {
      subtotal: sum((r) => r.enteredAmount),
      discountTotal: sum((r) => r.discountAllocated),
      taxableAmount: sum((r) => r.taxableAmount),
      totalTax: sum((r) => r.taxAmount),
      includedTax,
      addedTax,
      zeroRatedSales: zeroRated,
      exemptSales: exempt,
      total: sum((r) => r.total),
      taxBreakdown: [...breakdown.values()],
    },
  };
}

/** Resolves a product's effective pricing mode: its own, else the store default. */
export function resolvePricingMode(productMode: string | undefined | null, storeDefault: string | undefined | null): PricingMode {
  if (productMode === 'inclusive' || productMode === 'exclusive') return productMode;
  return storeDefault === 'inclusive' ? 'inclusive' : 'exclusive';
}
