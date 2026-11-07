import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { MinorPipe } from '../../../../shared/register/minor.pipe';
import { RegisterApiService } from '../../../../shared/register/register-api.service';
import { RegisterContextService } from '../../../../shared/register/register-context.service';
import { fromMinor } from '../../../../shared/register/register-money';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportColumn, ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../../reports/shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../../reports/shared/report-page.component';

/**
 * The store's registers over a period, in three cuts that answer three different questions and are never mixed:
 * which CASHIER processed the sales, which REGISTER (drawer) the cash went into, and how the SESSIONS closed.
 */
@Component({
  selector: 'app-register-reports',
  imports: [CurrencyPipe, DecimalPipe, MinorPipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-report-page title="Register reports" i18n-title subtitle="Sales by cashier, cash by register, and how the drawers closed." i18n-subtitle [exportDisabled]="!report()" (export)="exportData($event)">
      <ng-container filters><date-range-selector /></ng-container>

      @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (res.error() && !res.hasValue()) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">error</mat-icon>
          <p class="m-0 font-semibold"><ng-container i18n>Could not load the register reports.</ng-container></p>
          <button matButton="filled" (click)="res.reload()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else if (report(); as r) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="reports-kpis">
          <app-report-kpi label="Cash collected" i18n-label icon="payments">{{ total().cash | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Cash refunds" i18n-label icon="undo">{{ total().refunds | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Shortages" i18n-label icon="trending_down" tone="text-red-700">{{ r.discrepancies.shortageMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Surpluses" i18n-label icon="trending_up">{{ r.discrepancies.surplusMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <mat-card appearance="outlined"><mat-card-content class="!p-4">
            <h3 class="m-0 text-base font-semibold"><ng-container i18n>Cash by register</ng-container></h3>
            <p class="m-0 mb-2 text-xs text-on-surface-variant"><ng-container i18n>Where the cash went: each drawer is accountable for what was put in it.</ng-container></p>
            <div class="overflow-x-auto"><table class="w-full text-sm" data-testid="reports-by-register">
              <thead><tr class="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-on-surface-variant"><th class="py-1"><ng-container i18n>Register</ng-container></th><th class="py-1 text-right"><ng-container i18n>Sessions</ng-container></th><th class="py-1 text-right"><ng-container i18n>Sales</ng-container></th><th class="py-1 text-right"><ng-container i18n>Cash</ng-container></th><th class="py-1 text-right"><ng-container i18n>Refunds</ng-container></th></tr></thead>
              <tbody>@for (x of r.byRegister; track x.registerId) { <tr class="border-b border-outline-variant last:border-0"><td class="py-1.5">{{ x.name }} <span class="text-on-surface-variant">· {{ x.code }}</span></td><td class="py-1.5 text-right tabular-nums">{{ x.sessions }}</td><td class="py-1.5 text-right tabular-nums">{{ x.salesCount }}</td><td class="py-1.5 text-right tabular-nums">{{ x.cashMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</td><td class="py-1.5 text-right tabular-nums">{{ x.cashRefundsMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</td></tr> } @empty { <tr><td colspan="5" class="py-3 text-center text-on-surface-variant"><ng-container i18n>No register activity in this period.</ng-container></td></tr> }</tbody>
            </table></div>
          </mat-card-content></mat-card>

          <mat-card appearance="outlined"><mat-card-content class="!p-4">
            <h3 class="m-0 text-base font-semibold"><ng-container i18n>Sales by cashier</ng-container></h3>
            <p class="m-0 mb-2 text-xs text-on-surface-variant"><ng-container i18n>Who processed the sales. A cashier on a shared drawer is not accountable for the whole drawer.</ng-container></p>
            <div class="overflow-x-auto"><table class="w-full text-sm" data-testid="reports-by-cashier">
              <thead><tr class="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-on-surface-variant"><th class="py-1"><ng-container i18n>Cashier</ng-container></th><th class="py-1 text-right"><ng-container i18n>Sales</ng-container></th><th class="py-1 text-right"><ng-container i18n>Cash taken</ng-container></th></tr></thead>
              <tbody>@for (x of r.byCashier; track x.cashierId) { <tr class="border-b border-outline-variant last:border-0"><td class="py-1.5">{{ x.name }}</td><td class="py-1.5 text-right tabular-nums">{{ x.salesCount }}</td><td class="py-1.5 text-right tabular-nums">{{ x.cashMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</td></tr> } @empty { <tr><td colspan="3" class="py-3 text-center text-on-surface-variant"><ng-container i18n>No sales in this period.</ng-container></td></tr> }</tbody>
            </table></div>
          </mat-card-content></mat-card>

          <mat-card appearance="outlined"><mat-card-content class="!p-4">
            <h3 class="m-0 text-base font-semibold"><ng-container i18n>Payments by method</ng-container></h3>
            <p class="m-0 mb-2 text-xs text-on-surface-variant"><ng-container i18n>Card, e-wallet and transfers never enter a drawer.</ng-container></p>
            @for (m of r.byMethod; track m.method) { <div class="flex items-center justify-between py-1 text-sm"><span>{{ m.method }}</span><span class="tabular-nums">{{ m.minor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</span></div> } @empty { <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>No payments in this period.</ng-container></p> }
          </mat-card-content></mat-card>

          <mat-card appearance="outlined"><mat-card-content class="!p-4">
            <h3 class="m-0 text-base font-semibold"><ng-container i18n>How the drawers closed</ng-container></h3>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm" data-testid="reports-closing">
              <div class="rounded-lg bg-surface-container p-3"><div class="text-xs text-on-surface-variant"><ng-container i18n>Balanced</ng-container></div><div class="text-lg font-semibold">{{ r.discrepancies.balanced | number:'1.0-0' }}</div></div>
              <div class="rounded-lg bg-surface-container p-3"><div class="text-xs text-on-surface-variant"><ng-container i18n>With a shortage</ng-container></div><div class="text-lg font-semibold">{{ r.discrepancies.shortages | number:'1.0-0' }}</div></div>
              <div class="rounded-lg bg-surface-container p-3"><div class="text-xs text-on-surface-variant"><ng-container i18n>With a surplus</ng-container></div><div class="text-lg font-semibold">{{ r.discrepancies.surpluses | number:'1.0-0' }}</div></div>
              <div class="rounded-lg bg-surface-container p-3"><div class="text-xs text-on-surface-variant"><ng-container i18n>Open now</ng-container></div><div class="text-lg font-semibold">{{ r.sessions.open | number:'1.0-0' }}</div></div>
            </div>
          </mat-card-content></mat-card>
        </div>

        @if (r.unattributed.count || r.late.count || r.discrepancies.provisional || r.discrepancies.withLateEntries) {
          <mat-card appearance="outlined"><mat-card-content class="!p-4" data-testid="reports-exceptions">
            <h3 class="m-0 text-base font-semibold"><ng-container i18n>Needs a look</ng-container></h3>
            <ul class="m-0 mt-2 list-none p-0 text-sm">
              @if (r.unattributed.count) { <li class="flex items-center justify-between py-1" data-testid="reports-unattributed"><span><ng-container i18n>Cash taken with no register open</ng-container> ({{ r.unattributed.count }})</span><span class="tabular-nums">{{ r.unattributed.cashMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</span></li> }
              @if (r.late.count) { <li class="flex items-center justify-between py-1" data-testid="reports-late"><span><ng-container i18n>Arrived after its register had closed</ng-container> ({{ r.late.count }})</span><span class="tabular-nums">{{ r.late.cashMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</span></li> }
              @if (r.discrepancies.provisional) { <li class="py-1"><ng-container i18n>Closed before every till had reported</ng-container> ({{ r.discrepancies.provisional }})</li> }
              @if (r.discrepancies.withLateEntries) { <li class="py-1"><ng-container i18n>Closed registers with late entries to review</ng-container> ({{ r.discrepancies.withLateEntries }})</li> }
            </ul>
          </mat-card-content></mat-card>
        }
      }
    </app-report-page>
  `,
})
export class RegisterReportsComponent {
  private readonly api = inject(RegisterApiService);
  private readonly ctx = inject(RegisterContextService);
  private readonly exporter = inject(ReportExportService);
  private readonly queryParams = inject(QueryParamService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);

  readonly symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  readonly exponent = computed(() => this.ctx.exponent());
  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.ctx.enabled(), query: this.query() }),
    stream: ({ params }) => (params.storeId && params.on ? this.api.storeReport(params.storeId, { from: params.query?.['start'], to: params.query?.['end'] }) : of(null)),
  });
  readonly report = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly total = computed(() => {
    const r = this.report();
    const e = this.exponent();
    return { cash: fromMinor((r?.byRegister ?? []).reduce((s, x) => s + x.cashMinor, 0), e), refunds: fromMinor((r?.byRegister ?? []).reduce((s, x) => s + x.cashRefundsMinor, 0), e) };
  });

  exportData(format: ExportFormat): void {
    const r = this.report();
    if (!r) return;
    const e = this.exponent();
    const columns: ExportColumn[] = [
      { key: 'kind', label: $localize`Cut`, type: 'text' },
      { key: 'name', label: $localize`Name`, type: 'text' },
      { key: 'sales', label: $localize`Sales`, type: 'number' },
      { key: 'cash', label: $localize`Cash`, type: 'currency' },
      { key: 'refunds', label: $localize`Cash refunds`, type: 'currency' },
    ];
    const rows = [
      ...r.byRegister.map((x) => ({ kind: $localize`Register`, name: `${x.name} (${x.code})`, sales: x.salesCount, cash: fromMinor(x.cashMinor, e), refunds: fromMinor(x.cashRefundsMinor, e) })),
      ...r.byCashier.map((x) => ({ kind: $localize`Cashier`, name: x.name, sales: x.salesCount, cash: fromMinor(x.cashMinor, e), refunds: null as number | null })),
      ...r.byMethod.map((x) => ({ kind: $localize`Payment method`, name: x.method, sales: null as number | null, cash: fromMinor(x.minor, e), refunds: null as number | null })),
    ];
    this.exporter.export(format === 'excel' ? 'xlsx' : format, { title: $localize`Register reports`, storeName: this.storeStore.selectedStore()?.name ?? '', currency: r.currencyCode || 'MUR', columns, rows, filename: 'register-reports', landscape: true });
  }
}
