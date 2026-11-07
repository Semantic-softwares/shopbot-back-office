import { RegisterReport } from './register.models';
import { fromMinor } from './register-money';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface PrintContext {
  /** Currency symbol shown in front of amounts. */
  symbol: string;
  exponent: number;
  locale?: string;
}

/**
 * The printable page for an X or Z report: the closing summary the spec asks for (opening float, cash sales and refunds, movements,
 * expected cash, declared cash, variance, status) with the payment summary kept separate, because total payments and the cash that
 * should be in the drawer are different measures. Built from the report as stored, so a Z-report always prints as it was closed.
 */
export function buildReportHtml(report: RegisterReport, ctx: PrintContext): string {
  const money = (minor: number | undefined | null) => {
    const value = fromMinor(minor ?? 0, ctx.exponent);
    const text = Math.abs(value).toLocaleString(ctx.locale, { minimumFractionDigits: ctx.exponent, maximumFractionDigits: ctx.exponent });
    // The sign goes in front of the currency ("-MUR 200.00"), not between the currency and the figure.
    return `${value < 0 ? '-' : ''}${esc(ctx.symbol)} ${text}`.trim();
  };
  const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(ctx.locale) : '—');
  const t = report.totals;
  const isZ = report.kind === 'Z';
  const row = (label: string, value: string, strong = false) => `<tr${strong ? ' class="strong"' : ''}><td>${esc(label)}</td><td class="num">${value}</td></tr>`;
  const variance = report.variance;
  const varianceLabel = variance ? (variance.status === 'balanced' ? $localize`Balanced` : variance.status === 'shortage' ? $localize`Cash shortage` : $localize`Cash surplus`) : '';

  const payments = t.paymentsByMethod.map((p) => row(p.method, money(p.minor))).join('');
  const refunds = t.refundsByMethod.map((p) => row(p.method, `-${money(p.minor)}`)).join('');
  const cashiers = report.cashiers.map((c) => `<li>${esc(c.name ?? '—')} · ${esc(when(c.startedAt))} → ${esc(c.endedAt ? when(c.endedAt) : $localize`now`)}</li>`).join('');
  const movements = report.movements
    .map((m) => {
      const out = m.type === 'cash_out' || m.type === 'cash_deposit' || m.type === 'cash_transfer_out' || m.type === 'cash_refund';
      return `<tr><td>${esc(when(m.at ?? m.createdAt))}</td><td>${esc(m.type.replace(/_/g, ' '))}${m.reversalOf ? ` (${esc($localize`reversal`)})` : ''}</td><td>${esc(m.reason)}</td><td class="num">${out !== !!m.reversalOf ? '-' : ''}${money(m.amountMinor)}</td></tr>`;
    })
    .join('');
  const counts = report.interimCounts.map((c) => `<tr><td>${esc(when(c.at))}</td><td>${esc(c.type === 'handover' ? $localize`Handover count` : $localize`Interim count`)}</td><td class="num">${money(c.countedMinor)}</td><td class="num">${money(c.varianceMinor)}</td></tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(isZ ? $localize`Z-report` : $localize`X-report`)} ${esc(report.register?.name ?? '')}</title>
<style>
  body{font:13px/1.45 system-ui,sans-serif;margin:24px;color:#111}
  h1{font-size:18px;margin:0 0 2px} h2{font-size:13px;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.04em;color:#444}
  table{width:100%;border-collapse:collapse} td,th{padding:3px 0;text-align:left;vertical-align:top} .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  tr.strong td{font-weight:700;border-top:1px solid #111;padding-top:6px} .muted{color:#555} ul{margin:4px 0;padding-left:18px} .box{border:1px solid #bbb;border-radius:6px;padding:8px 12px}
  @media print{body{margin:8mm}}
</style></head><body>
<h1>${esc(isZ ? $localize`Z-report · register closed` : $localize`X-report · interim (register still open)`)}</h1>
<div class="muted">${esc(report.store?.name ?? '')} · ${esc(report.register?.name ?? '')} (${esc(report.register?.code ?? '')}) · ${esc(when(report.generatedAt))}</div>
<h2>${esc($localize`Session`)}</h2>
<table>${row($localize`Opened`, esc(when(report.session.openedAt as string)))}${isZ ? row($localize`Closed`, esc(when(report.session.closedAt as string))) : ''}</table>
<ul>${cashiers}</ul>
<h2>${esc($localize`Cash reconciliation`)}</h2>
<table>
${row($localize`Opening float`, money(t.openingFloat))}
${row($localize`Cash sales`, money(t.cashSales))}
${row($localize`Cash refunds`, `-${money(t.cashRefunds)}`)}
${row($localize`Cash in`, money(t.cashIn + t.cashTransferIn))}
${row($localize`Cash out`, `-${money(t.cashOut)}`)}
${row($localize`Cash deposits`, `-${money(t.cashDeposits)}`)}
${t.cashTransferOut ? row($localize`Cash transferred out`, `-${money(t.cashTransferOut)}`) : ''}
${row($localize`Expected cash`, money(isZ ? report.expectedCashMinor : t.expectedCash), true)}
${isZ && report.declared ? row($localize`Actual declared cash`, money(report.declared.actualCashMinor), true) : ''}
${isZ && variance ? row($localize`Cash variance`, money(variance.minor), true) : ''}
</table>
${isZ && variance ? `<p><strong>${esc($localize`Status`)}: ${esc(varianceLabel)}</strong>${report.notes ? ` · ${esc(report.notes)}` : ''}${report.approvals ? ` · ${esc($localize`Approved by`)} ${esc(report.approvals.approvedBy ?? '')}` : ''}</p>` : ''}
${report.completeness && !report.completeness.complete ? `<p class="box">${esc($localize`Provisional: another till had records that had not reached the server when this register was closed.`)}</p>` : ''}
<h2>${esc($localize`Payment summary`)}</h2>
<table>${payments}${row($localize`Total payments`, money(t.paymentsTotal), true)}</table>
${refunds ? `<table>${refunds}</table>` : ''}
<p class="muted">${esc($localize`Total payments and expected drawer cash are different measures: card, e-wallet and transfers never enter the drawer.`)}</p>
${movements ? `<h2>${esc($localize`Cash movements`)}</h2><table>${movements}</table>` : ''}
${counts ? `<h2>${esc($localize`Counts during the session`)}</h2><table><tr><th>${esc($localize`When`)}</th><th>${esc($localize`Type`)}</th><th class="num">${esc($localize`Counted`)}</th><th class="num">${esc($localize`Difference`)}</th></tr>${counts}</table>` : ''}
</body></html>`;
}
