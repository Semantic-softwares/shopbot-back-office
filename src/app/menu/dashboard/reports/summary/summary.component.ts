import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { EmployeeSelectorComponent } from '../../../../shared/components/employee-selector/employee-selector.component';
import { PeriodSelectorComponent } from '../../../../shared/components/period-range-selector/period-range-selector.component';
import { ChartThemeService } from '../../../../shared/services/chart-theme.service';
import { ExportService } from '../../../../shared/services/export.service';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { TrPipe } from '../../../../shared/i18n/tr.pipe';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

type Metric = 'grossSales' | 'refunds' | 'discounts' | 'netSales' | 'grossProfit';
interface SummaryRow { period: string; grossSales: number; refunds: number; discounts: number; netSales: number; costOfGoods: number; grossProfit: number; margin: number; taxes: number }

/** Sales over time: five headline numbers (each one can be charted), the trend, and the period-by-period breakdown. */
@Component({
  selector: 'shopbot-summary',
  imports: [CurrencyPipe, PercentPipe, MatButtonModule, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSortModule, MatTableModule, DateRangeSelectorComponent, EmployeeSelectorComponent, PeriodSelectorComponent, ReportPageComponent, ReportKpiComponent, TrPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './summary.component.html',
})
export class SummaryComponent {
  private readonly chartTheme = inject(ChartThemeService); // keeps Chart.js text and grid colours in step with the theme
  private readonly theme = inject(ThemeService);
  private readonly queryParams = inject(QueryParamService);
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency || 'USD');

  readonly metrics: { key: Metric; label: string; icon: string }[] = [
    { key: 'netSales', label: $localize`Net sales`, icon: 'payments' },
    { key: 'grossSales', label: $localize`Gross sales`, icon: 'point_of_sale' },
    { key: 'grossProfit', label: $localize`Gross profit`, icon: 'trending_up' },
    { key: 'discounts', label: $localize`Discounts`, icon: 'sell' },
    { key: 'refunds', label: $localize`Refunds`, icon: 'undo' },
  ];
  readonly active = signal<Metric>('netSales');
  readonly activeLabel = computed(() => this.metrics.find((m) => m.key === this.active())?.label ?? '');

  readonly summary = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.query() }),
    stream: ({ params }) => this.orderService.getSalesSummary(params.storeId!, params.query),
  });
  readonly series = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.query() }),
    stream: ({ params }) => this.orderService.getSalesSummaryByDate(params.storeId!, params.query),
  });

  readonly rows = computed<SummaryRow[]>(() => {
    const raw: any[] = this.series.hasValue() ? (this.series.value() ?? []) : [];
    return raw.map((r) => ({
      period: String(r.period ?? ''),
      grossSales: Number(r.grossSales) || 0,
      refunds: Number(r.refunds) || 0,
      discounts: Number(r.discounts) || 0,
      netSales: Number(r.netSales) || 0,
      costOfGoods: Number(r.costOfGoods) || 0,
      grossProfit: Number(r.grossProfit) || 0,
      margin: Number(r.margin) || 0,
      taxes: Number(r.taxes) || 0,
    }));
  });
  readonly table = new ReportTable<SummaryRow>(() => this.rows(), 'period');
  readonly columns = ['period', 'grossSales', 'refunds', 'discounts', 'netSales', 'costOfGoods', 'grossProfit', 'margin', 'taxes'];
  readonly failed = computed(() => !!this.summary.error() && !this.summary.hasValue());
  readonly value = (m: Metric): number => (this.summary.hasValue() ? Number(this.summary.value()?.[m]?.value) || 0 : 0);
  readonly share = (m: Metric): number => (this.summary.hasValue() ? Number(this.summary.value()?.[m]?.percentage) || 0 : 0);

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('salesChart');
  private chart: Chart<'line'> | null = null;

  constructor() {
    Chart.register(...registerables);
    // Redraw whenever the data, the chosen number, the period, the currency or the theme changes.
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const rows = this.rows();
      const metric = this.active();
      const period = this.query()?.['period'] ?? 'daily';
      const symbol = this.currency();
      this.theme.isDark();
      this.chart?.destroy();
      this.chart = null;
      if (!el || !rows.length) return;
      this.chart = new Chart(el, this.config(rows, metric, period, symbol, el));
    });
  }

  readonly periodLabel = (period: string): string => this.label(period, this.query()?.['period'] ?? 'daily');

  private label(period: string, selected: string): string {
    if (/^\d{4}-\d{2}$/.test(period) && selected === 'weekly') return $localize`Week ${period.split('-')[1]}, ${period.split('-')[0]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return new Date(period).toLocaleString(undefined, { day: 'numeric', month: 'short' });
    if (/^\d{4}-\d{2}$/.test(period)) return new Date(period + '-01').toLocaleString(undefined, { month: 'short', year: 'numeric' });
    return period;
  }

  private config(rows: SummaryRow[], metric: Metric, period: string, symbol: string, el: HTMLCanvasElement): ChartConfiguration<'line'> {
    const sorted = [...rows].sort((a, b) => a.period.localeCompare(b.period));
    const style = getComputedStyle(document.documentElement);
    const colour = style.getPropertyValue('--mat-sys-primary').trim() || '#4f46e5';
    const ctx = el.getContext('2d')!;
    const fill = ctx.createLinearGradient(0, 0, 0, el.height || 300);
    fill.addColorStop(0, this.withAlpha(colour, 0.28));
    fill.addColorStop(1, this.withAlpha(colour, 0));
    const money = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    return {
      type: 'line',
      data: {
        labels: sorted.map((r) => this.label(r.period, period)),
        datasets: [{ label: this.metrics.find((m) => m.key === metric)!.label, data: sorted.map((r) => r[metric]), borderColor: colour, backgroundColor: fill, borderWidth: 2, fill: true, tension: 0.35, pointRadius: sorted.length > 40 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: colour }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${symbol} ${money.format(Number(c.parsed.y) || 0)}` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
          y: { beginAtZero: true, ticks: { callback: (v) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(Number(v)) } },
        },
      },
    };
  }

  /** Chart.js wants the colour as a string; token values come as `#rrggbb` or `rgb(...)`. */
  private withAlpha(colour: string, alpha: number): string {
    const hex = /^#([0-9a-f]{6})$/i.exec(colour);
    if (hex) { const n = parseInt(hex[1], 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`; }
    const rgb = /^rgba?\(([^)]+)\)$/.exec(colour);
    return rgb ? `rgba(${rgb[1].split(',').slice(0, 3).join(',')}, ${alpha})` : colour;
  }

  exportData(format: ExportFormat): void {
    const data = this.series.value();
    if (!data) return;
    const range = { from: this.query()?.['start'], to: this.query()?.['end'] };
    if (format === 'pdf') this.exportService.exportSummaryToPdf(data, 'sales-summary', range);
    else if (format === 'csv') this.exportService.exportToCSV(data, 'sales-summary');
    else this.exportService.exportToExcel(data, 'sales-summary');
  }
}
