import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StoreStore } from '../../stores/store.store';
import { CashMovement, RegisterReport } from '../register.models';
import { fromMinor } from '../register-money';

/** One report body for both the X-report (interim) and the Z-report (final). Read-only: it shows what the server stored or computed. */
@Component({
  selector: 'app-register-report',
  imports: [CurrencyPipe, DatePipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (report(); as r) {
      <div class="flex flex-col gap-4" [attr.data-testid]="r.kind === 'Z' ? 'z-report' : 'x-report'">
        <div class="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
          <span class="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface">
            @if (r.kind === 'Z') { <ng-container i18n>Z-report · closed</ng-container> } @else { <ng-container i18n>X-report · register still open</ng-container> }
          </span>
          <span>{{ r.register.name }} ({{ r.register.code }})</span>
          <span>· {{ r.generatedAt | date: 'medium' }}</span>
        </div>

        @if (r.completeness && !r.completeness.complete) {
          <div class="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" data-testid="report-provisional">
            <mat-icon class="!h-5 !w-5 !text-xl !leading-none">warning</mat-icon>
            <span><ng-container i18n>Provisional: another till had records that had not reached the server when this register was closed.</ng-container></span>
          </div>
        }

        <section>
          <h3 class="m-0 mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Cash reconciliation</ng-container></h3>
          <div class="rounded-lg border border-outline-variant">
            @for (line of lines(); track line.label) {
              <div class="flex items-center justify-between px-3 py-1.5 text-sm" [class]="line.strong ? 'border-t border-outline-variant font-semibold' : ''">
                <span>{{ line.label }}</span>
                <span class="tabular-nums" [attr.data-testid]="line.testId">{{ line.sign }}{{ major(line.minor) | currency: symbol() : 'symbol' : digits() }}</span>
              </div>
            }
          </div>
          @if (r.kind === 'Z' && r.variance; as v) {
            <p class="mb-0 mt-2 flex items-center gap-2 text-sm font-medium" data-testid="report-variance-status">
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none" [class]="v.status === 'balanced' ? 'text-primary' : 'text-error'">{{ v.status === 'balanced' ? 'check_circle' : 'error' }}</mat-icon>
              @if (v.status === 'balanced') { <ng-container i18n>Balanced</ng-container> }
              @else if (v.status === 'shortage') { <ng-container i18n>Cash shortage</ng-container> }
              @else { <ng-container i18n>Cash surplus</ng-container> }
              @if (r.approvals) { <span class="font-normal text-on-surface-variant">· <ng-container i18n>Approved by</ng-container> {{ r.approvals.approvedBy }}</span> }
            </p>
            @if (r.notes) { <p class="m-0 mt-1 text-sm text-on-surface-variant">{{ r.notes }}</p> }
          }
        </section>

        <section>
          <h3 class="m-0 mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Payment summary</ng-container></h3>
          <div class="rounded-lg border border-outline-variant">
            @for (p of r.totals.paymentsByMethod; track p.method) {
              <div class="flex items-center justify-between px-3 py-1.5 text-sm"><span>{{ p.method }}</span><span class="tabular-nums">{{ major(p.minor) | currency: symbol() : 'symbol' : digits() }}</span></div>
            } @empty {
              <div class="px-3 py-2 text-sm text-on-surface-variant"><ng-container i18n>No payments yet.</ng-container></div>
            }
            <div class="flex items-center justify-between border-t border-outline-variant px-3 py-1.5 text-sm font-semibold"><span><ng-container i18n>Total payments</ng-container></span><span class="tabular-nums">{{ major(r.totals.paymentsTotal) | currency: symbol() : 'symbol' : digits() }}</span></div>
          </div>
          <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>Total payments and expected drawer cash are different measures: card, e-wallet and transfers never enter the drawer.</ng-container></p>
        </section>

        <section>
          <h3 class="m-0 mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Cashiers</ng-container></h3>
          <ul class="m-0 list-none p-0 text-sm">
            @for (c of r.cashiers; track c.startedAt + c.cashierId) {
              <li class="flex justify-between py-0.5"><span>{{ c.name || '—' }}</span><span class="text-on-surface-variant">{{ c.startedAt | date: 'shortTime' }} → @if (c.endedAt) { {{ c.endedAt | date: 'shortTime' }} } @else { <ng-container i18n>now</ng-container> }</span></li>
            }
          </ul>
        </section>

        @if (r.movements.length) {
          <section>
            <h3 class="m-0 mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Cash movements</ng-container></h3>
            <div class="rounded-lg border border-outline-variant text-sm">
              @for (m of r.movements; track m._id) {
                <div class="flex items-center justify-between gap-3 px-3 py-1.5" [attr.data-testid]="'movement-' + m.type">
                  <span class="min-w-0 truncate">{{ typeLabel(m) }} · <span class="text-on-surface-variant">{{ m.reason }}</span></span>
                  <span class="shrink-0 tabular-nums">{{ outflow(m) ? '-' : '' }}{{ major(m.amountMinor) | currency: symbol() : 'symbol' : digits() }}</span>
                </div>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class RegisterReportComponent {
  report = input.required<RegisterReport | null>();
  private readonly storeStore = inject(StoreStore);

  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  exponent = computed(() => this.report()?.session?.exponent ?? this.report()?.store?.exponent ?? 2);
  digits = computed(() => (this.exponent() ? '1.2-2' : '1.0-0'));

  lines = computed(() => {
    const r = this.report();
    if (!r) return [] as { label: string; minor: number; sign: string; strong?: boolean; testId: string }[];
    const t = r.totals;
    const out: { label: string; minor: number; sign: string; strong?: boolean; testId: string }[] = [
      { label: $localize`Opening float`, minor: t.openingFloat, sign: '', testId: 'line-opening' },
      { label: $localize`Cash sales`, minor: t.cashSales, sign: '', testId: 'line-cash-sales' },
      { label: $localize`Cash refunds`, minor: t.cashRefunds, sign: t.cashRefunds ? '-' : '', testId: 'line-cash-refunds' },
      { label: $localize`Cash in`, minor: t.cashIn + t.cashTransferIn, sign: '', testId: 'line-cash-in' },
      { label: $localize`Cash out`, minor: t.cashOut, sign: t.cashOut ? '-' : '', testId: 'line-cash-out' },
      { label: $localize`Cash deposits`, minor: t.cashDeposits, sign: t.cashDeposits ? '-' : '', testId: 'line-deposits' },
    ];
    if (t.cashTransferOut) out.push({ label: $localize`Cash transferred out`, minor: t.cashTransferOut, sign: '-', testId: 'line-transfer-out' });
    out.push({ label: $localize`Expected cash`, minor: r.kind === 'Z' ? (r.expectedCashMinor ?? t.expectedCash) : t.expectedCash, sign: '', strong: true, testId: 'line-expected' });
    if (r.kind === 'Z' && r.declared) out.push({ label: $localize`Actual declared cash`, minor: r.declared.actualCashMinor, sign: '', strong: true, testId: 'line-actual' });
    if (r.kind === 'Z' && r.variance) out.push({ label: $localize`Cash variance`, minor: Math.abs(r.variance.minor), sign: r.variance.minor < 0 ? '-' : r.variance.minor > 0 ? '+' : '', strong: true, testId: 'line-variance' });
    return out;
  });

  major(minor: number): number {
    return fromMinor(minor, this.exponent());
  }

  outflow(m: CashMovement): boolean {
    const out = m.type === 'cash_out' || m.type === 'cash_deposit' || m.type === 'cash_transfer_out' || m.type === 'cash_refund';
    return out !== !!m.reversalOf;
  }

  typeLabel(m: CashMovement): string {
    const label =
      m.type === 'cash_in' ? $localize`Cash in`
      : m.type === 'cash_out' ? $localize`Cash out`
      : m.type === 'cash_deposit' ? $localize`Deposit`
      : m.type === 'cash_refund' ? $localize`Cash refund`
      : m.type === 'cash_transfer_in' ? $localize`Transfer in`
      : $localize`Transfer out`;
    return m.reversalOf ? $localize`${label} (reversal)` : label;
  }
}
