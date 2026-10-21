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
import { TrPipe } from '../../../../shared/i18n/tr.pipe';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

interface PaymentRow { paymentType: string; paymentTransactions: number; paymentAmount: number; refundTransactions: number; refundAmount: number; netAmount: number; share: number }

/** What was paid and refunded by each payment method in the chosen period. */
@Component({
  selector: 'app-sales-by-payment',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, MatButtonModule, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSortModule, MatTableModule, DateRangeSelectorComponent, EmployeeSelectorComponent, ReportPageComponent, ReportKpiComponent, TrPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sales-by-payment.component.html',
})
export class SalesByPaymentComponent {
  private readonly queryParams = inject(QueryParamService);
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency || 'USD');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.query() }),
    stream: ({ params }) => this.orderService.getSalesByPaymentType(params.storeId!, params.query),
  });

  /** The rows with each method's share of the net amount worked out. */
  readonly rows = computed<PaymentRow[]>(() => {
    const raw: any[] = this.res.hasValue() ? (this.res.value() ?? []) : [];
    const total = raw.reduce((s, r) => s + (Number(r.netAmount) || 0), 0);
    return raw.map((r) => ({
      paymentType: r.paymentType ?? '—',
      paymentTransactions: Number(r.paymentTransactions) || 0,
      paymentAmount: Number(r.paymentAmount) || 0,
      refundTransactions: Number(r.refundTransactions) || 0,
      refundAmount: Number(r.refundAmount) || 0,
      netAmount: Number(r.netAmount) || 0,
      share: total > 0 ? Math.max(0, Number(r.netAmount) || 0) / total : 0,
    }));
  });
  readonly table = new ReportTable<PaymentRow>(() => this.rows(), 'netAmount');
  readonly columns = ['paymentType', 'paymentTransactions', 'paymentAmount', 'refundTransactions', 'refundAmount', 'netAmount'];

  readonly totals = computed(() => ({
    paymentCount: this.table.sum('paymentTransactions'),
    payments: this.table.sum('paymentAmount'),
    refundCount: this.table.sum('refundTransactions'),
    refunds: this.table.sum('refundAmount'),
    net: this.table.sum('netAmount'),
  }));
  readonly top = computed(() => [...this.rows()].sort((a, b) => b.netAmount - a.netAmount)[0] ?? null);
  readonly failed = computed(() => !!this.res.error() && !this.res.hasValue());

  exportData(format: ExportFormat): void {
    const data = this.res.value() ?? [];
    const range = { from: this.query()?.['start'], to: this.query()?.['end'] };
    if (format === 'pdf') this.exportService.exportPaymentDataToPdf(data, 'payment-report', range);
    else if (format === 'csv') this.exportService.exportToCSV(data, 'payment-report');
    else this.exportService.exportToExcel(data, 'payment-report');
  }
}
