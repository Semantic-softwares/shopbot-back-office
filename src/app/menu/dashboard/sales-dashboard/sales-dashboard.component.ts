import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError } from 'rxjs';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { OrderService } from '../../../shared/services/orders.service';
import { QueryParamService } from '../../../shared/services/query-param.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DateRangeSelectorComponent } from '../../../shared/components/date-range-selector/date-range-selector.component';
import { EmployeeSelectorComponent } from '../../../shared/components/employee-selector/employee-selector.component';

type Period = 'daily' | 'weekly' | 'monthly';

interface Kpi {
  label: string;
  value: string;
  icon: string;
  accent: string;
  note: string;
  delta: number | null;
  /** Refunds/discounts going up is bad news, not good. */
  higherIsBetter: boolean;
}

const COLORS = {
  primary: '#005cbb',
  sky: '#3b8ff3',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  pink: '#ec4899',
  slate: '#64748b',
};
const SERIES_PALETTE = [COLORS.primary, COLORS.green, COLORS.amber, COLORS.violet, COLORS.teal, COLORS.pink, COLORS.sky, COLORS.red];

const AXIS_LABEL = { color: '#64748b', fontSize: 11 };
const SPLIT_LINE = { lineStyle: { color: '#eef2f7' } };
const TOOLTIP = {
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  textStyle: { color: '#f1f5f9', fontSize: 12 },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`);

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxEchartsDirective,
    PageHeaderComponent,
    DateRangeSelectorComponent,
    EmployeeSelectorComponent,
  ],
  templateUrl: './sales-dashboard.component.html',
  styleUrl: './sales-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesDashboardComponent {
  private readonly orderService = inject(OrderService);
  private readonly queryParams = inject(QueryParamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly storeStore = inject(StoreStore);

  private readonly query = toSignal(this.queryParams.getAllParams$, { initialValue: {} as Record<string, any> });

  protected readonly periodOptions: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Day' },
    { value: 'weekly', label: 'Week' },
    { value: 'monthly', label: 'Month' },
  ];

  private readonly range = computed(() => {
    const q = this.query();
    if (!q['start'] || !q['end']) return null;
    const start = parseIsoDate(q['start']);
    const end = parseIsoDate(q['end']);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (days - 1));
    return { start: q['start'] as string, end: q['end'] as string, days, prevStart: toIsoDate(prevStart), prevEnd: toIsoDate(prevEnd) };
  });

  /** Picked automatically from the range length unless the user chose one. */
  protected readonly period = computed<Period>(() => {
    const chosen = this.query()['period'];
    if (chosen === 'daily' || chosen === 'weekly' || chosen === 'monthly') return chosen;
    const days = this.range()?.days ?? 30;
    return days <= 45 ? 'daily' : days <= 180 ? 'weekly' : 'monthly';
  });

  private readonly resource = rxResource({
    params: () => {
      const storeId = this.storeStore.selectedStore()?._id;
      const range = this.range();
      if (!storeId || !range) return undefined;
      return { storeId, range, employee: this.query()['employee'] ?? 'all', period: this.period() };
    },
    stream: ({ params }) => {
      const { storeId, range, employee, period } = params;
      const current = { start: range.start, end: range.end, employee };
      const previous = { start: range.prevStart, end: range.prevEnd, employee };
      const safe = <T>(obs: import('rxjs').Observable<T>, fallback: T) => obs.pipe(catchError(() => of(fallback)));

      return forkJoin({
        summary: this.orderService.getSalesSummary(storeId, current),
        previousSummary: safe(this.orderService.getSalesSummary(storeId, previous), null),
        trend: safe(this.orderService.getSalesSummaryByDate(storeId, { ...current, period }), [] as any[]),
        products: safe(this.orderService.getTopSellingProducts(storeId, current), [] as any[]),
        categories: safe(this.orderService.getTopSellingCategories(storeId, current), [] as any[]),
        employees: safe(this.orderService.getSalesByEmployees(storeId, current), [] as any[]),
        payments: safe(this.orderService.getSalesByPaymentType(storeId, current), [] as any[]),
        receipts: safe(this.orderService.getSalesReceipts(storeId, current), { data: { allReceipts: 0, sales: 0, refund: 0 }, orders: [] } as any),
      });
    },
  });

  protected readonly loading = computed(() => this.resource.isLoading() && !this.resource.hasValue());
  protected readonly refreshing = computed(() => this.resource.isLoading() && this.resource.hasValue());
  protected readonly error = computed(() => this.resource.error());
  private readonly data = computed(() => (this.resource.hasValue() ? this.resource.value() : null));

  private readonly orders = computed<any[]>(() => this.data()?.receipts?.orders ?? []);
  /** Receipts that count as revenue — refunds (category "Cancel") excluded. */
  private readonly saleOrders = computed(() => this.orders().filter((o) => o.category !== 'Cancel'));

  protected readonly hasSales = computed(() => {
    const d = this.data();
    return !!d && ((d.summary?.grossSales?.value ?? 0) > 0 || this.orders().length > 0);
  });

  protected retry(): void {
    this.resource.reload();
  }

  protected setPeriod(value: Period): void {
    this.queryParams.add({ period: value });
  }

  // ── Formatting ─────────────────────────────────────────────────────────────

  // Store.currency is the display symbol ("RS", "₦") the rest of the app prints
  // via the currency pipe — prefix it rather than handing Intl a non-ISO code.
  private readonly currencySymbol = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  private readonly numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  private readonly compactFormat = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

  protected money(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return `${n < 0 ? '-' : ''}${this.currencySymbol()}${this.numberFormat.format(Math.abs(n))}`;
  }

  private compactMoney(value: number): string {
    const n = Number(value ?? 0);
    return `${n < 0 ? '-' : ''}${this.currencySymbol()}${this.compactFormat.format(Math.abs(n))}`;
  }

  protected deltaTone(kpi: Kpi): 'good' | 'bad' | 'flat' {
    if (kpi.delta === null || Math.abs(kpi.delta) < 0.05) return 'flat';
    return (kpi.delta > 0) === kpi.higherIsBetter ? 'good' : 'bad';
  }

  private formatPeriodLabel(raw: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return parseIsoDate(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    if (/^\d{4}-\d{2}$/.test(raw) && this.period() === 'weekly') {
      return `Wk ${Number(raw.split('-')[1])}`;
    }
    if (/^\d{4}-\d{2}$/.test(raw)) {
      const [y, m] = raw.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
    return raw;
  }

  private percentChange(current: number, previous: number | null | undefined): number | null {
    if (previous === null || previous === undefined) return null;
    if (previous === 0) return current === 0 ? 0 : null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  protected readonly rangeLabel = computed(() => {
    const r = this.range();
    if (!r) return '';
    const fmt = (v: string) => parseIsoDate(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(r.start)} – ${fmt(r.end)}`;
  });

  protected readonly subtitle = computed(() => {
    const store = this.storeStore.selectedStore()?.name;
    return store
      ? `Point of sale performance for ${store}`
      : 'Point of sale performance across your store';
  });

  // ── KPIs ───────────────────────────────────────────────────────────────────

  protected readonly kpis = computed<Kpi[]>(() => {
    const d = this.data();
    if (!d) return [];
    const s = d.summary ?? {};
    const p = d.previousSummary;
    const value = (key: string) => Number(s?.[key]?.value ?? 0);
    const prev = (key: string) => (p ? Number(p?.[key]?.value ?? 0) : null);

    const gross = value('grossSales');
    const net = value('netSales');
    const profit = value('grossProfit');
    const refunds = value('refunds');
    const discounts = value('discounts');
    const transactions = Number(d.receipts?.data?.sales ?? 0);
    const refundCount = Number(d.receipts?.data?.refund ?? 0);
    const margin = net > 0 ? (profit / net) * 100 : 0;
    const avgTicket = transactions > 0 ? net / transactions : 0;

    return [
      { label: 'Net sales', value: this.money(net), icon: 'payments', accent: 'kpi--azure', note: 'vs previous period', delta: this.percentChange(net, prev('netSales')), higherIsBetter: true },
      { label: 'Gross sales', value: this.money(gross), icon: 'point_of_sale', accent: 'kpi--sky', note: 'vs previous period', delta: this.percentChange(gross, prev('grossSales')), higherIsBetter: true },
      { label: 'Gross profit', value: this.money(profit), icon: 'trending_up', accent: 'kpi--green', note: `${margin.toFixed(1)}% margin`, delta: this.percentChange(profit, prev('grossProfit')), higherIsBetter: true },
      { label: 'Transactions', value: transactions.toLocaleString(), icon: 'receipt_long', accent: 'kpi--violet', note: `${this.money(avgTicket)} avg. ticket`, delta: null, higherIsBetter: true },
      { label: 'Refunds', value: this.money(refunds), icon: 'undo', accent: 'kpi--red', note: `${refundCount} refunded receipt${refundCount === 1 ? '' : 's'}`, delta: this.percentChange(refunds, prev('refunds')), higherIsBetter: false },
      { label: 'Discounts', value: this.money(discounts), icon: 'sell', accent: 'kpi--amber', note: 'vs previous period', delta: this.percentChange(discounts, prev('discounts')), higherIsBetter: false },
    ];
  });

  // ── Charts ─────────────────────────────────────────────────────────────────

  protected readonly trendChart = computed((): EChartsOption => {
    const rows = [...(this.data()?.trend ?? [])].sort((a, b) => String(a.period).localeCompare(String(b.period)));
    const labels = rows.map((r) => this.formatPeriodLabel(String(r.period)));
    const area = (color: string) => ({
      color: {
        type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: `${color}40` }, { offset: 1, color: `${color}00` }],
      },
    });
    return {
      tooltip: { ...TOOLTIP, trigger: 'axis', valueFormatter: (v: any) => this.money(Number(v)) },
      legend: { bottom: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: COLORS.slate } },
      grid: { left: 8, right: 12, top: 16, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: AXIS_LABEL, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { ...AXIS_LABEL, formatter: (v: number) => this.compactMoney(v) }, splitLine: SPLIT_LINE },
      // Gross as bars, net as a line: the two are usually within a few percent,
      // so two lines would sit on top of each other and hide one.
      series: [
        { name: 'Gross sales', type: 'bar', barMaxWidth: 28, data: rows.map((r) => r.grossSales ?? 0), itemStyle: { color: '#b9d5f7', borderRadius: [4, 4, 0, 0] } },
        // Periods with no sales aren't returned, so a curve through a few sparse
        // points would invent values in the gaps — only smooth dense series.
        { name: 'Net sales', type: 'line', smooth: rows.length > 8, symbol: 'circle', symbolSize: 7, showSymbol: rows.length <= 31, data: rows.map((r) => r.netSales ?? 0), itemStyle: { color: COLORS.primary }, lineStyle: { width: 3 }, areaStyle: area(COLORS.primary) },
      ],
    };
  });

  protected readonly paymentsTotal = computed(() =>
    (this.data()?.payments ?? []).reduce((sum: number, p: any) => sum + Number(p.netAmount ?? p.paymentAmount ?? 0), 0)
  );

  protected readonly paymentsChart = computed((): EChartsOption => {
    const rows = (this.data()?.payments ?? []).filter((p: any) => Number(p.netAmount ?? p.paymentAmount ?? 0) > 0);
    return {
      color: SERIES_PALETTE,
      tooltip: { ...TOOLTIP, trigger: 'item', formatter: (p: any) => `${p.name}<br/><b>${this.money(p.value)}</b> · ${p.percent}%` },
      legend: { bottom: 0, type: 'scroll', icon: 'circle', itemWidth: 8, textStyle: { color: COLORS.slate } },
      series: [{
        type: 'pie',
        radius: ['58%', '82%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 },
        data: rows.map((p: any) => ({ name: p.paymentType || 'Other', value: Number(p.netAmount ?? p.paymentAmount ?? 0) })),
      }],
    };
  });

  protected readonly topProductsChart = computed((): EChartsOption => {
    const rows = [...(this.data()?.products ?? [])]
      .sort((a: any, b: any) => Number(b.totalRevenue ?? b.netSales ?? 0) - Number(a.totalRevenue ?? a.netSales ?? 0))
      .slice(0, 8)
      .reverse();
    return {
      tooltip: {
        ...TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `${row.name}<br/><b>${this.money(Number(row.totalRevenue ?? row.netSales ?? 0))}</b> · ${row.totalQuantitySold ?? 0} sold`;
        },
      },
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', axisLabel: { ...AXIS_LABEL, formatter: (v: number) => this.compactMoney(v) }, splitLine: SPLIT_LINE },
      yAxis: {
        type: 'category',
        data: rows.map((r: any) => r.name),
        axisLabel: { ...AXIS_LABEL, width: 110, overflow: 'truncate' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        barMaxWidth: 18,
        data: rows.map((r: any) => Number(r.totalRevenue ?? r.netSales ?? 0)),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: COLORS.sky }, { offset: 1, color: COLORS.primary }] },
        },
        label: { show: true, position: 'right', color: COLORS.slate, fontSize: 11, formatter: (p: any) => this.compactMoney(p.value) },
      }],
    };
  });

  protected readonly categoryChart = computed((): EChartsOption => {
    const rows = [...(this.data()?.categories ?? [])]
      .filter((c: any) => Number(c.netSales ?? 0) > 0)
      .sort((a: any, b: any) => Number(b.netSales) - Number(a.netSales))
      .slice(0, 8);
    const total = rows.reduce((sum: number, c: any) => sum + Number(c.netSales ?? 0), 0);
    const ordered = [...rows].reverse();
    return {
      tooltip: {
        ...TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const row = ordered[params[0].dataIndex];
          return `${row.category || 'Uncategorized'}<br/><b>${this.money(Number(row.netSales ?? 0))}</b><br/>${row.itemsSold ?? 0} items sold`;
        },
      },
      grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', axisLabel: { ...AXIS_LABEL, formatter: (v: number) => this.compactMoney(v) }, splitLine: SPLIT_LINE },
      yAxis: {
        type: 'category',
        data: ordered.map((c: any) => c.category || 'Uncategorized'),
        axisLabel: { ...AXIS_LABEL, width: 120, overflow: 'truncate' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        barMaxWidth: 18,
        data: ordered.map((c: any) => Number(c.netSales ?? 0)),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: COLORS.teal }, { offset: 1, color: COLORS.green }] },
        },
        label: {
          show: true, position: 'right', color: COLORS.slate, fontSize: 11,
          formatter: (p: any) => (total > 0 ? `${Math.round((p.value / total) * 100)}%` : ''),
        },
      }],
    };
  });

  protected readonly channelChart = computed((): EChartsOption => {
    const totals = new Map<string, number>();
    for (const o of this.saleOrders()) {
      const label = o.salesChannel === 'Qrcode' ? 'Self-order (QR)' : o.salesChannel || 'Point of Sale';
      totals.set(label, (totals.get(label) ?? 0) + Number(o.total ?? 0));
    }
    const colorFor: Record<string, string> = { 'Point of Sale': COLORS.primary, 'Self-order (QR)': COLORS.violet, Shopbot: COLORS.teal };
    return {
      tooltip: { ...TOOLTIP, trigger: 'item', formatter: (p: any) => `${p.name}<br/><b>${this.money(p.value)}</b> · ${p.percent}%` },
      legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { color: COLORS.slate } },
      series: [{
        type: 'pie',
        radius: ['50%', '78%'],
        center: ['50%', '44%'],
        startAngle: 200,
        itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 8 },
        label: { show: true, position: 'inside', color: '#fff', fontWeight: 600, formatter: (p: any) => (p.percent >= 8 ? `${Math.round(p.percent)}%` : '') },
        data: [...totals.entries()].map(([name, value]) => ({ name, value, itemStyle: { color: colorFor[name] ?? COLORS.amber } })),
      }],
    };
  });

  protected readonly orderTypeChart = computed((): EChartsOption => {
    const counts = new Map<string, { count: number; revenue: number }>();
    for (const o of this.saleOrders()) {
      const key = (o.ordertype || 'other').toString();
      const entry = counts.get(key) ?? { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += Number(o.total ?? 0);
      counts.set(key, entry);
    }
    const rows = [...counts.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
    const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    return {
      tooltip: {
        ...TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const [name, entry] = rows[params[0].dataIndex];
          return `${title(name)}<br/><b>${this.money(entry.revenue)}</b> · ${entry.count} orders`;
        },
      },
      grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: rows.map(([name]) => title(name)), axisLabel: AXIS_LABEL, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { ...AXIS_LABEL, formatter: (v: number) => this.compactMoney(v) }, splitLine: SPLIT_LINE },
      series: [{
        type: 'bar',
        barMaxWidth: 42,
        data: rows.map(([, entry], i) => ({ value: entry.revenue, itemStyle: { color: SERIES_PALETTE[i % SERIES_PALETTE.length], borderRadius: [6, 6, 0, 0] } })),
      }],
    };
  });

  protected readonly peakHour = computed(() => {
    const byHour = new Array(24).fill(0);
    for (const o of this.saleOrders()) byHour[new Date(o.date).getHours()] += 1;
    const max = Math.max(...byHour);
    return max > 0 ? `${HOURS[byHour.indexOf(max)]} is your busiest hour` : '';
  });

  protected readonly heatmapChart = computed((): EChartsOption => {
    const grid = new Map<string, number>();
    for (const o of this.saleOrders()) {
      const d = new Date(o.date);
      const key = `${d.getHours()}|${d.getDay()}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    }
    const data = [...grid.entries()].map(([key, count]) => {
      const [hour, day] = key.split('|').map(Number);
      return [hour, day, count];
    });
    const max = Math.max(1, ...data.map((d) => d[2]));
    return {
      tooltip: {
        ...TOOLTIP,
        formatter: (p: any) => `${DAY_NAMES[p.value[1]]} ${HOURS[p.value[0]]}<br/><b>${p.value[2]}</b> order${p.value[2] === 1 ? '' : 's'}`,
      },
      grid: { left: 8, right: 8, top: 8, bottom: 48, containLabel: true },
      xAxis: { type: 'category', data: HOURS, splitArea: { show: true }, axisLabel: { ...AXIS_LABEL, interval: 2 }, axisTick: { show: false }, axisLine: { show: false } },
      yAxis: { type: 'category', data: DAY_NAMES, splitArea: { show: true }, axisLabel: AXIS_LABEL, axisTick: { show: false }, axisLine: { show: false } },
      visualMap: {
        min: 0, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 12, itemHeight: 120,
        textStyle: { color: COLORS.slate, fontSize: 11 },
        inRange: { color: ['#eef5ff', '#9cc3f5', COLORS.sky, COLORS.primary] },
      },
      series: [{
        type: 'heatmap',
        data,
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.2)' } },
      }],
    };
  });

  protected readonly employeesChart = computed((): EChartsOption => {
    const rows = [...(this.data()?.employees ?? [])]
      .sort((a: any, b: any) => Number(b.netSales ?? 0) - Number(a.netSales ?? 0))
      .slice(0, 8);
    return {
      tooltip: {
        ...TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `${row.name ?? 'Removed user'}<br/><b>${this.money(Number(row.netSales ?? 0))}</b><br/>${row.receipts ?? 0} receipts · ${this.money(Number(row.averageSale ?? 0))} avg.`;
        },
      },
      grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: rows.map((r: any) => (r.name ? String(r.name).split(' ')[0] : 'Removed user')),
        axisLabel: { ...AXIS_LABEL, interval: 0, width: 72, overflow: 'truncate' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: { type: 'value', axisLabel: { ...AXIS_LABEL, formatter: (v: number) => this.compactMoney(v) }, splitLine: SPLIT_LINE },
      series: [{
        type: 'bar',
        barMaxWidth: 36,
        data: rows.map((r: any) => Number(r.netSales ?? 0)),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.green }, { offset: 1, color: COLORS.teal }] },
        },
      }],
    };
  });

  protected readonly recentReceipts = computed(() =>
    [...this.orders()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  );

  protected openReceipt(orderId: string): void {
    this.router.navigate(['../reports/receipts', orderId, 'details'], { relativeTo: this.route });
  }

  protected readonly receiptsQueryParams = computed(() => {
    const r = this.range();
    return r ? { start: r.start, end: r.end } : {};
  });
}
