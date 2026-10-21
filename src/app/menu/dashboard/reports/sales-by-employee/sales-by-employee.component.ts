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
import { ExportService } from '../../../../shared/services/export.service';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

interface EmployeeRow { name: string; grossSales: number; refunds: number; discounts: number; netSales: number; receipts: number; averageSale: number; share: number }

/** How much each employee sold in the chosen period. */
@Component({
  selector: 'app-sales-by-employee',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, MatButtonModule, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSortModule, MatTableModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sales-by-employee.component.html',
})
export class SalesByEmployeeComponent {
  private readonly queryParams = inject(QueryParamService);
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency || 'USD');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.query() }),
    stream: ({ params }) => this.orderService.getSalesByEmployees(params.storeId!, params.query),
  });

  /** The rows with each person's share of net sales worked out. A removed user keeps its sales under a plain label. */
  readonly rows = computed<EmployeeRow[]>(() => {
    const raw: any[] = this.res.hasValue() ? (this.res.value() ?? []) : [];
    const total = raw.reduce((s, r) => s + (Number(r.netSales) || 0), 0);
    return raw.map((r) => ({
      name: r.name ?? $localize`Removed user`,
      grossSales: Number(r.grossSales) || 0,
      refunds: Number(r.refunds) || 0,
      discounts: Number(r.discounts) || 0,
      netSales: Number(r.netSales) || 0,
      receipts: Number(r.receipts) || 0,
      averageSale: Number(r.averageSale) || 0,
      share: total ? (Number(r.netSales) || 0) / total : 0,
    }));
  });
  readonly table = new ReportTable<EmployeeRow>(() => this.rows(), 'netSales');
  readonly columns = ['name', 'grossSales', 'refunds', 'discounts', 'netSales', 'receipts', 'averageSale'];

  readonly totals = computed(() => ({
    gross: this.table.sum('grossSales'),
    refunds: this.table.sum('refunds'),
    discounts: this.table.sum('discounts'),
    net: this.table.sum('netSales'),
    receipts: this.table.sum('receipts'),
  }));
  readonly top = computed(() => [...this.rows()].sort((a, b) => b.netSales - a.netSales)[0] ?? null);
  readonly avgHint = computed(() => {
    const t = this.totals();
    return t.receipts ? $localize`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(t.net / t.receipts)} average sale` : '';
  });
  readonly failed = computed(() => !!this.res.error() && !this.res.hasValue());

  exportData(format: ExportFormat): void {
    const data = this.res.value() ?? [];
    const range = { from: this.query()?.['start'], to: this.query()?.['end'] };
    if (format === 'pdf') this.exportService.exportEmployeeDataToPdf(data, 'employee-sales', range);
    else if (format === 'csv') this.exportService.exportToCSV(data, 'employee-sales');
    else this.exportService.exportToExcel(data, 'employee-sales');
  }
}
