/**
 * What the tax work shows on a sale, in one place. Only sales priced by the tax engine have a `taxSummary` and per-line
 * `taxLine` snapshots; every older sale has neither and is rendered exactly as it always was.
 */
export interface TaxDisplayRow {
  label: string;
  rate: number;
  taxable: number;
  amount: number;
}

export interface TaxDisplay {
  net: number;
  rows: TaxDisplayRow[];
  total: number;
  included: number;
  added: number;
}

/**
 * "Display tax breakdown on receipts" (Point of Sale > Receipt). On unless the store switched it off. Everything the tax work
 * adds to a customer-facing receipt checks this; totals stay correct either way.
 */
export function showTaxOnReceipt(store?: { posSettings?: { receiptSettings?: { showTax?: boolean } } } | null): boolean {
  return store?.posSettings?.receiptSettings?.showTax !== false;
}

/** The tax of a sale priced by the tax engine, or null for any older sale. */
export function taxDisplay(order?: { taxSummary?: any } | null): TaxDisplay | null {
  const s = order?.taxSummary;
  if (!s || !Array.isArray(s.taxBreakdown)) return null;
  return {
    net: Number(s.taxableAmount) || 0,
    rows: s.taxBreakdown.map((r: any) => ({ label: String(r.name ?? 'Tax'), rate: Number(r.rate) || 0, taxable: Number(r.taxableAmount) || 0, amount: Number(r.taxAmount) || 0 })),
    total: Number(s.totalTax) || 0,
    included: Number(s.includedTax) || 0,
    added: Number(s.addedTax) || 0,
  };
}

/** Short mark for one line: whether its price already holds the tax or the tax is added on top. Empty for an older line. */
export function lineTaxMarker(item?: { taxLine?: any } | null): string {
  const line = item?.taxLine;
  if (!line || !Array.isArray(line.taxes) || !line.taxes.length) return '';
  const tax = line.taxes[0];
  const name = String(tax.name ?? 'Tax');
  // Zero-rated and exempt products have nothing to include or add: they are marked by their treatment only.
  if (tax.kind !== 'standard') return name;
  return line.pricingMode === 'inclusive' ? `${name} included` : `${name} ${Number(tax.rate) || 0}% added`;
}
