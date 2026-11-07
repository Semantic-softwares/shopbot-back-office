import { buildReportHtml } from './register-report-print';
import { RegisterReport } from './register.models';

const mur = (n: number) => n * 100;
const report = (over: Partial<RegisterReport> = {}): RegisterReport => ({
  kind: 'Z',
  generatedAt: '2026-11-07T16:00:00Z',
  register: { name: 'Main Counter', code: 'MAIN', operatingMode: 'individual', acceptsCash: true },
  session: { _id: 's1', openedAt: '2026-11-07T08:00:00Z', closedAt: '2026-11-07T16:00:00Z' },
  cashiers: [{ cashierId: 'a', name: 'Ana', startedAt: '2026-11-07T08:00:00Z', endedAt: '2026-11-07T16:00:00Z', status: 'ended', startedBy: 'open' }],
  totals: { openingFloat: mur(6000), cashSales: mur(12000), cashIn: 0, cashTransferIn: 0, cashRefunds: mur(500), cashOut: mur(1000), cashDeposits: 0, cashTransferOut: 0, expectedCash: mur(16500), paymentsByMethod: [{ method: 'Cash', minor: mur(12000) }, { method: 'Card', minor: mur(5000) }, { method: 'E-wallet', minor: mur(3000) }], paymentsTotal: mur(20000), refundsByMethod: [], salesCount: 9, cashByCashier: [], lateNetCash: 0, lateCount: 0 },
  movements: [{ _id: 'm1', type: 'cash_out', amountMinor: mur(1000), reason: 'Petty cash <milk>', at: '2026-11-07T10:00:00Z' }],
  interimCounts: [],
  store: { name: 'La Baz du Pole' },
  expectedCashMinor: mur(16500),
  declared: { method: 'manual', actualCashMinor: mur(16300), denominations: [] },
  variance: { minor: -mur(200), status: 'shortage' },
  ...over,
});

describe('printing a register report', () => {
  const ctx = { symbol: 'MUR', exponent: 2, locale: 'en-US' };

  it('shows the closing summary from the spec and keeps payments separate from drawer cash', () => {
    const html = buildReportHtml(report(), ctx);
    for (const text of ['Opening float', 'MUR 6,000.00', 'MUR 12,000.00', '-MUR 500.00', 'Expected cash', 'MUR 16,500.00', 'Actual declared cash', 'MUR 16,300.00', 'Cash variance', '-MUR 200.00', 'Cash shortage', 'Payment summary', 'Total payments', 'MUR 20,000.00', 'different measures']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('Z-report');
  });

  it('is an interim report for an X-report, with no closing figures', () => {
    const html = buildReportHtml(report({ kind: 'X', declared: undefined, variance: undefined }), ctx);
    expect(html).toContain('X-report');
    expect(html).not.toContain('Actual declared cash');
    expect(html).not.toContain('Cash variance');
  });

  it('escapes what people typed, and flags a provisional close', () => {
    const html = buildReportHtml(report({ completeness: { complete: false, closedAnyway: true, pendingDevices: [] } }), ctx);
    expect(html).toContain('Petty cash &lt;milk&gt;');
    expect(html).not.toContain('<milk>');
    expect(html).toContain('Provisional');
  });
});
