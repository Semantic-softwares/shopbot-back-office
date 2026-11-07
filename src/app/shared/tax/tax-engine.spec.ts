import vectors from './tax-engine.vectors.json';
import { calculateTax, fromMinor, resolvePricingMode, toMinor, TaxLineInput } from './tax-engine';

/** The same vectors, byte for byte, as the server's engine tests: the two copies of the engine cannot drift apart. */
describe('tax engine: shared vectors', () => {
  for (const v of vectors as any[]) {
    it(v.name, () => {
      const exp = v.exponent ?? 2;
      const lines: TaxLineInput[] = v.lines.map((l: any) => ({
        key: l.key,
        unitMinor: toMinor(l.unit, exp),
        quantity: l.quantity,
        mode: l.mode,
        taxes: l.taxes,
        lineDiscountMinor: l.lineDiscount ? toMinor(l.lineDiscount, exp) : 0,
      }));
      const result = calculateTax({ lines, orderDiscountMinor: v.orderDiscount ? toMinor(v.orderDiscount, exp) : 0 });
      v.expect.lines.forEach((e: any, i: number) => {
        expect(result.lines[i].taxableAmount).toBe(toMinor(e.taxable, exp));
        expect(result.lines[i].taxAmount).toBe(toMinor(e.tax, exp));
        expect(result.lines[i].total).toBe(toMinor(e.total, exp));
        if (e.taxes) expect(result.lines[i].taxes.map((t) => t.taxAmount)).toEqual(e.taxes.map((x: number) => toMinor(x, exp)));
      });
      for (const [key, value] of Object.entries(v.expect.summary)) {
        expect((result.summary as any)[key]).toBe(toMinor(value as number, exp));
      }
    });
  }

  it('resolves inherit to the store default and never leaves it unresolved', () => {
    expect(resolvePricingMode('inherit', 'inclusive')).toBe('inclusive');
    expect(resolvePricingMode(undefined, 'exclusive')).toBe('exclusive');
    expect(resolvePricingMode('exclusive', 'inclusive')).toBe('exclusive');
  });

  it('round trips money units', () => {
    expect(toMinor(19.99)).toBe(1999);
    expect(fromMinor(1999)).toBe(19.99);
  });
});
