import { calculateTax, fromMinor, LineTaxResult, PricingMode, TAX_ENGINE_VERSION, TaxLineInput, TaxRule, toMinor as engineToMinor } from './tax-engine';
import { currencyExponent } from './currency';

// Same as the server's copy: a missing amount counts as zero.
const toMinor = (amount: number | undefined | null, exponent: number): number => engineToMinor(Number(amount) || 0, exponent);

/**
 * Server-side check of a sale priced by the tax engine. The POS sends each cart line with the tax it resolved (`taxLine`: the
 * pricing mode and the tax rules in force when the item was added) plus the figures it calculated. The server recomputes the
 * figures from those rules with the same engine and writes its own numbers, so a buggy or stale client can never store totals
 * that do not add up.
 *
 * A sale is either wholly engine-priced or wholly legacy. Orders without line snapshots (stores that did not opt in, old POS
 * builds, orders created before tax management) are returned as `legacy` and the caller leaves them exactly as they were.
 */
export type OrderTaxOutcome =
  | { kind: 'legacy' }
  | { kind: 'mixed' }
  | { kind: 'snapshot'; products: any[]; patch: Record<string, unknown>; corrected: boolean };

interface OrderMoney {
  discount?: number;
  shippingFee?: number;
  serviceFee?: number;
  driverTip?: number;
  total?: number;
  taxSummary?: { taxConfigVersion?: number } | null;
}

const hasSnapshot = (product: any): boolean =>
  !!product?.taxLine && Array.isArray(product.taxLine.taxes) && ['inclusive', 'exclusive'].includes(product.taxLine.pricingMode);

/** Unit price as the customer sees it: the product plus the options on one unit (option prices are already × their own quantity). */
function unitMinor(product: any, exponent: number): number {
  let optionMinor = 0;
  for (const option of product?.options ?? []) optionMinor += toMinor(option?.price, exponent);
  return toMinor(product?.price, exponent) + optionMinor;
}

export function priceOrderFromSnapshots(order: OrderMoney, products: any[], currencyCode?: string | null): OrderTaxOutcome {
  const sold = (products ?? []).filter((p) => (Number(p?.quantity) || 0) > 0);
  const withSnapshot = sold.filter(hasSnapshot);
  if (!sold.length || !withSnapshot.length) return { kind: 'legacy' };
  if (withSnapshot.length !== sold.length) return { kind: 'mixed' };

  const exponent = currencyExponent(currencyCode);
  const lines: TaxLineInput[] = products.map((p, index) => ({
    key: String(index),
    unitMinor: unitMinor(p, exponent),
    quantity: Number(p.quantity) || 0,
    mode: (p.taxLine?.pricingMode as PricingMode) ?? 'exclusive',
    taxes: ((p.taxLine?.taxes ?? []) as any[]).map(
      (t, i): TaxRule => ({
        taxId: t.taxId ? String(t.taxId) : undefined,
        name: String(t.name ?? 'Tax'),
        code: t.code,
        mraTaxCode: t.mraTaxCode ?? null,
        kind: t.kind === 'zero_rated' || t.kind === 'exempt' ? t.kind : 'standard',
        rate: Number(t.rate) || 0,
        compound: !!t.compound,
        priority: i,
      }),
    ),
  }));

  const result = calculateTax({ lines, orderDiscountMinor: toMinor(order.discount, exponent) });

  let corrected = false;
  const repriced = products.map((product, index) => {
    const line: LineTaxResult = result.lines[index];
    const sent = product.taxLine ?? {};
    // A line the client sent that disagrees with the engine by more than a rounding step is overwritten.
    const differs = (sentValue: unknown, expected: number) => typeof sentValue === 'number' && Math.abs(toMinor(sentValue, exponent) - expected) > 1;
    if (differs(sent.taxAmount, line.taxAmount) || differs(sent.total, line.total)) corrected = true;
    return {
      ...product,
      taxLine: {
        pricingMode: line.pricingMode,
        // The tax configuration version this line's rules were read from (kept, so the sale records what priced it).
        configVersion: sent.configVersion ?? null,
        taxes: line.taxes.map((t) => ({ ...t, taxableAmount: fromMinor(t.taxableAmount, exponent), taxAmount: fromMinor(t.taxAmount, exponent) })),
        enteredAmount: fromMinor(line.enteredAmount, exponent),
        discountAllocated: fromMinor(line.discountAllocated, exponent),
        taxableAmount: fromMinor(line.taxableAmount, exponent),
        taxAmount: fromMinor(line.taxAmount, exponent),
        total: fromMinor(line.total, exponent),
      },
    };
  });

  const s = result.summary;
  const fees = toMinor(order.shippingFee, exponent) + toMinor(order.serviceFee, exponent) + toMinor(order.driverTip, exponent);
  const totalMinor = s.total + fees;
  if (Math.abs(toMinor(order.total, exponent) - totalMinor) > lines.length + 1) corrected = true;

  const patch = {
    subTotal: fromMinor(s.subtotal, exponent),
    discount: fromMinor(s.discountTotal, exponent),
    tax: fromMinor(s.totalTax, exponent),
    total: fromMinor(totalMinor, exponent),
    taxSummary: {
      subtotal: fromMinor(s.subtotal, exponent),
      discountTotal: fromMinor(s.discountTotal, exponent),
      taxableAmount: fromMinor(s.taxableAmount, exponent),
      totalTax: fromMinor(s.totalTax, exponent),
      includedTax: fromMinor(s.includedTax, exponent),
      addedTax: fromMinor(s.addedTax, exponent),
      zeroRatedSales: fromMinor(s.zeroRatedSales, exponent),
      exemptSales: fromMinor(s.exemptSales, exponent),
      total: fromMinor(s.total, exponent),
      taxBreakdown: s.taxBreakdown.map((r) => ({ ...r, taxableAmount: fromMinor(r.taxableAmount, exponent), taxAmount: fromMinor(r.taxAmount, exponent) })),
      taxConfigVersion: order.taxSummary?.taxConfigVersion ?? (products.find((p) => typeof p?.taxLine?.configVersion === 'number')?.taxLine.configVersion ?? null),
      engineVersion: TAX_ENGINE_VERSION,
      currencyExponent: exponent,
    },
  };
  return { kind: 'snapshot', products: repriced, patch, corrected };
}
