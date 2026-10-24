import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusPillComponent } from '../../../../shared/components/status-pill/status-pill.component';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ReportKpiComponent } from '../../../dashboard/reports/shared/report-kpi.component';
import { InvoiceV2 } from '../../../../shared/models/platform-billing.model';

const PALETTE = ['#005cbb', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#ec4899', '#3b8ff3', '#ef4444'];
const SEVERITY_DOT: Record<string, string> = { urgent: 'bg-red-500', soon: 'bg-amber-500', info: 'bg-sky-500' };
const STATUS_ORDER = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'];

@Component({
  selector: 'app-admin-overview',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, NgxEchartsDirective, PageHeaderComponent, ReportKpiComponent, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Overview" i18n-title [subtitle]="subtitle()">
      <ng-container actions>
        <a mat-stroked-button routerLink="../stores"><mat-icon>storefront</mat-icon><span i18n>Stores</span></a>
        <a mat-stroked-button routerLink="../invoices"><mat-icon>receipt_long</mat-icon><span i18n>Invoices</span></a>
      </ng-container>
    </app-page-header>

    @if (res.isLoading() && !res.hasValue()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant p-8 text-center" role="alert">
        <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">error</mat-icon>
        <p class="m-0 font-semibold" i18n>Could not load the overview.</p>
        <button mat-flat-button (click)="res.reload()" i18n>Try again</button>
      </div>
    } @else if (res.hasValue()) {
      @let o = res.value();
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="kpis">
        <app-report-kpi label="Stores" i18n-label icon="storefront" [hint]="o.trials + ' on trial'">{{ o.stores | number }}</app-report-kpi>
        <app-report-kpi label="Monthly recurring" i18n-label icon="trending_up" [hint]="'About ' + (o.arpa | currency: 'USD') + ' per paying store'">{{ o.mrr | currency: 'USD' : 'symbol' : '1.0-0' }}</app-report-kpi>
        <app-report-kpi label="Outstanding" i18n-label icon="pending_actions" [tone]="o.outstanding > 0 ? 'text-amber-600' : ''">{{ o.outstanding | currency: 'USD' : 'symbol' : '1.0-0' }}</app-report-kpi>
        <app-report-kpi label="Collected this month" i18n-label icon="payments">{{ o.collectedThisMonth | currency: 'USD' : 'symbol' : '1.0-0' }}</app-report-kpi>
      </div>

      <div class="mt-3 flex flex-wrap gap-2 text-sm" data-testid="checks">
        <a routerLink="../stores" [queryParams]="{ status: 'EXPIRED' }" class="check" [class.check--bad]="o.blocked > 0"><mat-icon>lock</mat-icon><span><b>{{ o.blocked }}</b>&nbsp;<span i18n>locked out</span></span></a>
        <span class="check"><mat-icon>event_repeat</mat-icon><span><b>{{ o.renewingSoon }}</b>&nbsp;<span i18n>renewing in 7 days</span></span></span>
        <a routerLink="../trials" class="check"><mat-icon>hourglass_top</mat-icon><span><b>{{ o.trials }}</b>&nbsp;<span i18n>on trial</span></span></a>
        <a routerLink="../stores" [queryParams]="{ status: 'NONE' }" class="check"><mat-icon>help</mat-icon><span><b>{{ o.noSubscription }}</b>&nbsp;<span i18n>no subscription</span></span></a>
        <a routerLink="../requests" class="check" [class.check--warn]="o.openRequests > 0"><mat-icon>swap_vert</mat-icon><span><b>{{ o.openRequests }}</b>&nbsp;<span i18n>plan requests</span></span></a>
        @if (o.legacy > 0) { <span class="check"><mat-icon>history</mat-icon><span><b>{{ o.legacy }}</b>&nbsp;<span i18n>on the old billing</span></span></span> }
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <mat-card appearance="outlined" class="lg:col-span-2">
          <mat-card-content class="!p-4">
            <div class="mb-1 flex items-baseline justify-between"><h3 class="m-0 text-sm font-semibold" i18n>Cash collected</h3><span class="text-xs text-on-surface-variant" i18n>Last 12 months</span></div>
            @if (hasRevenue()) { <div echarts [options]="revenueChart()" class="h-64 w-full" data-testid="revenue-chart"></div> }
            @else { <div class="flex h-64 items-center justify-center text-sm text-on-surface-variant" i18n>No payments recorded yet.</div> }
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-content class="!p-4">
            <h3 class="m-0 mb-1 text-sm font-semibold" i18n>Recurring revenue by plan</h3>
            @if (planSlices().length) { <div echarts [options]="planChart()" class="h-64 w-full"></div> }
            @else { <div class="flex h-64 items-center justify-center text-sm text-on-surface-variant" i18n>No paying stores yet.</div> }
          </mat-card-content>
        </mat-card>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <mat-card appearance="outlined" class="lg:col-span-2" data-testid="attention">
          <mat-card-content class="!p-4">
            <h3 class="m-0 mb-2 text-sm font-semibold" i18n>Needs attention</h3>
            @if (!o.attention.length) { <p class="m-0 py-6 text-center text-sm text-on-surface-variant" i18n>Nothing needs you right now.</p> }
            @for (a of o.attention; track $index) {
              <div class="flex items-start gap-3 border-t border-outline-variant py-2 first:border-t-0">
                <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" [class]="dot(a.severity)"></span>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">@if (a.storeId) { <a [routerLink]="['../stores', a.storeId]" class="text-inherit hover:underline">{{ a.storeName }}</a> } @else { {{ a.storeName }} }</div>
                  <div class="text-xs text-on-surface-variant">{{ a.detail }}</div>
                </div>
                <span class="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-medium">{{ a.reason }}</span>
              </div>
            }
          </mat-card-content>
        </mat-card>
        <div class="flex flex-col gap-4">
          <mat-card appearance="outlined">
            <mat-card-content class="!p-4">
              <h3 class="m-0 mb-2 text-sm font-semibold" i18n>Subscriptions</h3>
              @for (s of statusRows(); track s.status) {
                <div class="flex items-center justify-between py-1 text-sm"><app-status-pill [value]="s.status" /><span class="tabular-nums">{{ s.count }}</span></div>
              }
              @if (!statusRows().length) { <p class="m-0 text-sm text-on-surface-variant" i18n>No subscriptions yet.</p> }
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-content class="!p-4">
              <h3 class="m-0 mb-2 text-sm font-semibold" i18n>Latest invoices</h3>
              @for (i of o.recentInvoices; track i._id) {
                <a [routerLink]="['../invoices', i._id]" class="flex items-center justify-between gap-2 border-t border-outline-variant py-2 text-inherit no-underline first:border-t-0 hover:bg-surface-container-low">
                  <span class="min-w-0"><span class="block truncate text-sm font-medium">{{ i.invoiceNumber }}</span><span class="block truncate text-xs text-on-surface-variant">{{ storeName(i) }}</span></span>
                  <span class="flex shrink-0 flex-col items-end gap-1"><span class="text-sm tabular-nums">{{ i.total ?? i.amount | currency: i.currency }}</span><app-status-pill kind="invoice" [value]="i.status" /></span>
                </a>
              }
              @if (!o.recentInvoices.length) { <p class="m-0 text-sm text-on-surface-variant" i18n>No invoices yet.</p> }
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    }
  `,
  styles: `
    .check { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 999px; padding: 4px 12px; color: inherit; text-decoration: none; background: var(--mat-sys-surface-container-low); }
    .check mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .check--bad { border-color: light-dark(#fca5a5, #7f1d1d); background: light-dark(#fee2e2, #450a0a); color: light-dark(#7f1d1d, #fecaca); }
    .check--warn { border-color: light-dark(#fcd34d, #78350f); background: light-dark(#fef3c7, #451a03); color: light-dark(#78350f, #fde68a); }
  `,
})
export class OverviewPage {
  private readonly api = inject(PlatformBillingService);
  private readonly theme = inject(ThemeService);
  readonly res = rxResource({ stream: () => this.api.adminOverview() });

  readonly subtitle = computed(() => {
    if (!this.res.hasValue()) return '';
    const o = this.res.value();
    return $localize`${o.stores} stores · ${o.trials} on trial`;
  });
  readonly dot = (severity: string) => SEVERITY_DOT[severity] ?? 'bg-slate-400';
  readonly storeName = (i: InvoiceV2) => (typeof i.storeId === 'object' && i.storeId ? i.storeId.name : '');

  readonly statusRows = computed(() => {
    if (!this.res.hasValue()) return [];
    const by = this.res.value().subscriptionsByStatus;
    return STATUS_ORDER.filter((s) => by[s]).map((status) => ({ status, count: by[status] }));
  });
  readonly hasRevenue = computed(() => this.res.hasValue() && this.res.value().revenueByMonth.some((m) => m.amount > 0));
  readonly planSlices = computed(() => (this.res.hasValue() ? Object.entries(this.res.value().mrrByPlan).filter(([, v]) => v.mrr > 0).map(([key, v]) => ({ name: key, value: v.mrr, stores: v.stores })) : []));

  private ink() {
    return this.theme.isDark() ? { text: '#a9b4c6', grid: '#1e293b', line: '#334155' } : { text: '#64748b', grid: '#eef2f7', line: '#e2e8f0' };
  }

  readonly revenueChart = computed<EChartsOption>(() => {
    const c = this.ink();
    const data = this.res.hasValue() ? this.res.value().revenueByMonth : [];
    return {
      grid: { left: 44, right: 12, top: 12, bottom: 28 },
      tooltip: { trigger: 'axis', valueFormatter: (v) => `$${Number(v).toLocaleString()}` },
      xAxis: { type: 'category', data: data.map((m) => m.month), axisLabel: { color: c.text, fontSize: 11 }, axisLine: { lineStyle: { color: c.line } } },
      yAxis: { type: 'value', axisLabel: { color: c.text, fontSize: 11, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: c.grid } } },
      series: [{ type: 'bar', data: data.map((m) => m.amount), itemStyle: { color: PALETTE[0], borderRadius: [4, 4, 0, 0] }, barMaxWidth: 28 }],
    };
  });

  readonly planChart = computed<EChartsOption>(() => {
    const c = this.ink();
    const slices = this.planSlices();
    const total = slices.reduce((s, x) => s + x.value, 0);
    return {
      color: PALETTE,
      tooltip: { trigger: 'item', formatter: '{b}: ${c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: c.text, fontSize: 11 } },
      title: { text: `$${Math.round(total).toLocaleString()}`, subtext: $localize`per month`, left: 'center', top: '34%', textStyle: { color: c.text, fontSize: 18, fontWeight: 600 }, subtextStyle: { color: c.text, fontSize: 11 } },
      series: [{ type: 'pie', radius: ['52%', '74%'], center: ['50%', '45%'], avoidLabelOverlap: true, label: { show: false }, data: slices.map((s) => ({ name: `${s.name} (${s.stores})`, value: s.value })) }],
    };
  });
}
