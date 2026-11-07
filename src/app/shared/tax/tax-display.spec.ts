import { lineTaxMarker, showTaxOnReceipt, taxDisplay } from './tax-display';

describe('tax display', () => {
  it('shows tax on receipts unless the store switched it off', () => {
    expect(showTaxOnReceipt(undefined)).toBeTrue();
    expect(showTaxOnReceipt({})).toBeTrue();
    expect(showTaxOnReceipt({ posSettings: { receiptSettings: {} } })).toBeTrue();
    expect(showTaxOnReceipt({ posSettings: { receiptSettings: { showTax: true } } })).toBeTrue();
    expect(showTaxOnReceipt({ posSettings: { receiptSettings: { showTax: false } } })).toBeFalse();
  });

  it('has nothing to show for an older sale', () => {
    expect(taxDisplay({})).toBeNull();
    expect(taxDisplay(null)).toBeNull();
    expect(lineTaxMarker({})).toBe('');
  });

  it('reads the breakdown of a tax-engine sale', () => {
    const d = taxDisplay({ taxSummary: { taxableAmount: 200, totalTax: 30, includedTax: 15, addedTax: 15, taxBreakdown: [{ name: 'VAT', rate: 15, taxableAmount: 200, taxAmount: 30 }] } })!;
    expect(d).toEqual({ net: 200, total: 30, included: 15, added: 15, rows: [{ label: 'VAT', rate: 15, taxable: 200, amount: 30 }] });
  });

  it('marks a zero-rated or exempt line by its treatment only', () => {
    expect(lineTaxMarker({ taxLine: { pricingMode: 'inclusive', taxes: [{ name: 'Zero Rated VAT', rate: 0, kind: 'zero_rated' }] } })).toBe('Zero Rated VAT');
    expect(lineTaxMarker({ taxLine: { pricingMode: 'exclusive', taxes: [{ name: 'VAT Exempt', rate: 0, kind: 'exempt' }] } })).toBe('VAT Exempt');
  });

  it('marks a line as tax included or added', () => {
    expect(lineTaxMarker({ taxLine: { pricingMode: 'inclusive', taxes: [{ name: 'VAT', rate: 15, kind: 'standard' }] } })).toBe('VAT included');
    expect(lineTaxMarker({ taxLine: { pricingMode: 'exclusive', taxes: [{ name: 'VAT', rate: 15, kind: 'standard' }] } })).toBe('VAT 15% added');
  });
});
