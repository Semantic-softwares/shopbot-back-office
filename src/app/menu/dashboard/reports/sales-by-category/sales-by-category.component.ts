import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { EmployeeSelectorComponent } from '../../../../shared/components/employee-selector/employee-selector.component';
import { ExportService } from '../../../../shared/services/export.service';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

interface CategoryRow { category: string; itemsSold: number; netSales: number; costOfGoods: number; grossProfit: number; margin: number; share: number }

/** Which categories bring in the sales and the profit in the chosen period. */
@Component({
  selector: 'app-sales-by-category',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, MatButtonModule, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSortModule, MatTableModule, DateRangeSelectorComponent, EmployeeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sales-by-category.component.html',
})
export class SalesByCategoryComponent {
  private readonly queryParams = inject(QueryParamService);
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency || 'USD');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.query() }),
    stream: ({ params }) => this.orderService.getTopSellingCategories(params.storeId!, params.query),
  });

  /** The rows with each category's share of net sales and its margin worked out. */
  readonly rows = computed<CategoryRow[]>(() => {
    const raw: any[] = this.res.hasValue() ? (this.res.value() ?? []) : [];
    const total = raw.reduce((s, r) => s + (Number(r.netSales) || 0), 0);
    return raw.map((r) => ({
      category: r.category ?? '—',
      itemsSold: Number(r.itemsSold) || 0,
      netSales: Number(r.netSales) || 0,
      costOfGoods: Number(r.costOfGoods) || 0,
      grossProfit: Number(r.grossProfit) || 0,
      margin: Number(r.netSales) ? (Number(r.grossProfit) || 0) / Number(r.netSales) : 0,
      share: total ? (Number(r.netSales) || 0) / total : 0,
    }));
  });
  readonly table = new ReportTable<CategoryRow>(() => this.rows(), 'netSales');
  readonly columns = ['category', 'itemsSold', 'netSales', 'costOfGoods', 'grossProfit', 'margin'];

  readonly totals = computed(() => {
    const net = this.table.sum('netSales');
    const profit = this.table.sum('grossProfit');
    return { items: this.table.sum('itemsSold'), net, cost: this.table.sum('costOfGoods'), profit, margin: net ? profit / net : 0 };
  });
  readonly top = computed(() => [...this.rows()].sort((a, b) => b.netSales - a.netSales)[0] ?? null);
  readonly failed = computed(() => !!this.res.error() && !this.res.hasValue());

  exportData(format: ExportFormat): void {
    const data = this.res.value() ?? [];
    const range = { from: this.query()?.['start'], to: this.query()?.['end'] };
    if (format === 'pdf') this.exportService.exportCategoryDataToPdf(data, 'category-sales', range);
    else if (format === 'csv') this.exportService.exportToCSV(data, 'category-sales');
    else this.exportService.exportToExcel(data, 'category-sales');
  }
}
