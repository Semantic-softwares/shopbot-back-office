import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
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
import { ChartThemeService } from '../../../../shared/services/chart-theme.service';
import { ExportService } from '../../../../shared/services/export.service';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

interface ItemRow { name: string; totalQuantitySold: number; totalRevenue: number; grossSales: number; totalTax: number; netSales: number; share: number }

/** What sold best in the chosen period, by quantity and by net sales. */
@Component({
  selector: 'sales-by-item',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, MatButtonModule, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSortModule, MatTableModule, DateRangeSelectorComponent, EmployeeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sales-by-item.component.html',
})
export class SalesByItemComponent {
  private readonly chartTheme = inject(ChartThemeService); // keeps Chart.js text and grid colours in step with the theme
  private readonly theme = inject(ThemeService);
  private readonly orderService = inject(OrderService);
  private readonly queryParams = inject(QueryParamService);
  private readonly exportService = inject(ExportService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency || 'USD');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.query() }),
    stream: ({ params }) => this.orderService.getTopSellingProducts(params.storeId!, params.query),
  });

  readonly rows = computed<ItemRow[]>(() => {
    const raw: any[] = this.res.hasValue() ? (this.res.value() ?? []) : [];
    const total = raw.reduce((s, r) => s + (Number(r.netSales) || 0), 0);
    return raw.map((r) => ({
      name: r.name ?? '—',
      totalQuantitySold: Number(r.totalQuantitySold) || 0,
      totalRevenue: Number(r.totalRevenue) || 0,
      grossSales: Number(r.grossSales) || 0,
      totalTax: Number(r.totalTax) || 0,
      netSales: Number(r.netSales) || 0,
      share: total > 0 ? Math.max(0, Number(r.netSales) || 0) / total : 0,
    }));
  });
  readonly table = new ReportTable<ItemRow>(() => this.rows(), 'netSales');
  readonly columns = ['name', 'totalQuantitySold', 'grossSales', 'totalTax', 'netSales', 'totalRevenue'];
  readonly totals = computed(() => ({ qty: this.table.sum('totalQuantitySold'), gross: this.table.sum('grossSales'), tax: this.table.sum('totalTax'), net: this.table.sum('netSales'), revenue: this.table.sum('totalRevenue') }));
  readonly top = computed(() => [...this.rows()].sort((a, b) => b.netSales - a.netSales)[0] ?? null);
  readonly failed = computed(() => !!this.res.error() && !this.res.hasValue());

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('itemsChart');
  private chart: Chart<'bar'> | null = null;

  constructor() {
    Chart.register(...registerables);
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const rows = [...this.rows()].sort((a, b) => b.netSales - a.netSales).slice(0, 10);
      const symbol = this.currency();
      this.theme.isDark();
      this.chart?.destroy();
      this.chart = null;
      if (!el || !rows.length) return;
      const colour = getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary').trim() || '#4f46e5';
      const money = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: { labels: rows.map((r) => r.name), datasets: [{ label: 'Net sales', data: rows.map((r) => r.netSales), backgroundColor: colour, borderRadius: 6, maxBarThickness: 28 }] },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${symbol} ${money.format(Number(c.parsed.x) || 0)}` } } },
          scales: {
            x: { beginAtZero: true, ticks: { callback: (v) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(Number(v)) } },
            y: { grid: { display: false }, ticks: { callback(v) { const l = String(this.getLabelForValue(Number(v))); return l.length > 22 ? l.slice(0, 21) + '…' : l; } } },
          },
        },
      };
      this.chart = new Chart(el, config);
    });
  }

  exportData(format: ExportFormat): void {
    const data = this.res.value() ?? [];
    const range = { from: this.query()?.['start'], to: this.query()?.['end'] };
    if (format === 'pdf') this.exportService.exportItemDataToPdf(data, 'item-sales', range);
    else if (format === 'csv') this.exportService.exportToCSV(data, 'item-sales');
    else this.exportService.exportToExcel(data, 'item-sales');
  }
}
