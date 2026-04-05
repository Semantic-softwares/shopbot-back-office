import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { EstatePropertyService } from '../../../shared/services/estate-property.service';
import { EstateUnitService } from '../../../shared/services/estate-unit.service';
import { LeaseService } from '../../../shared/services/lease.service';
import { EstateInvoiceService } from '../../../shared/services/estate-invoice.service';
import { EstatePaymentService } from '../../../shared/services/estate-payment.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EstatePayment, InvoiceStatus, LeaseStatus, PaymentStatus } from '../../../shared/models/estate.model';

@Component({
  selector: 'app-ems-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    PageHeaderComponent,
  ],
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmsOverviewComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private propertyService = inject(EstatePropertyService);
  private unitService = inject(EstateUnitService);
  private leaseService = inject(LeaseService);
  private invoiceService = inject(EstateInvoiceService);
  private paymentService = inject(EstatePaymentService);
  private storeStore = inject(StoreStore);

  private storeId = computed(() => this.storeStore.selectedStore()?._id || '');

  propertySummary = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) => this.propertyService.getPropertySummary(params.storeId),
  });

  unitSummary = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) => this.unitService.getUnitSummary(params.storeId),
  });

  leaseList = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) =>
      this.leaseService.getLeases(params.storeId, {
        page: 1,
        limit: 500,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  invoiceSummary = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) => this.invoiceService.getSummary(params.storeId),
  });

  invoiceList = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) =>
      this.invoiceService.getInvoices(params.storeId, {
        page: 1,
        limit: 500,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  paymentList = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) =>
      this.paymentService.listPayments(params.storeId, {
        page: 1,
        limit: 500,
        sortBy: 'paymentDate',
        sortOrder: 'desc',
      }),
  });

  leases = computed(() => this.leaseList.value()?.data?.items || []);
  invoices = computed(() => this.invoiceList.value()?.data?.items || []);
  payments = computed(() => this.paymentList.value()?.data?.items || []);

  readonly currencyCode = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  totalProperties = computed(() => this.propertySummary.value()?.data?.total ?? 0);
  activeProperties = computed(() => this.propertySummary.value()?.data?.active ?? 0);
  inactiveProperties = computed(() => this.propertySummary.value()?.data?.inactive ?? 0);

  totalUnits = computed(() => this.unitSummary.value()?.data?.total ?? 0);
  vacantUnits = computed(() => this.unitSummary.value()?.data?.vacant ?? 0);
  occupiedUnits = computed(() => this.unitSummary.value()?.data?.occupied ?? 0);
  reservedUnits = computed(() => this.unitSummary.value()?.data?.reserved ?? 0);

  activeLeases = computed(
    () => this.leases().filter((lease) => lease.status === LeaseStatus.ACTIVE).length,
  );

  leasesEndingSoon = computed(() => {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + 30);

    return this.leases().filter((lease) => {
      if (lease.status !== LeaseStatus.ACTIVE || !lease.endDate) {
        return false;
      }

      const endDate = new Date(lease.endDate);
      return endDate >= now && endDate <= threshold;
    }).length;
  });

  totalInvoicedThisMonth = computed(() => {
    const start = this.startOfCurrentMonth();
    return this.invoices()
      .filter((invoice) => {
        if (invoice.status === InvoiceStatus.VOID || invoice.categorySide === 'EXPENSE') {
          return false;
        }

        return this.isOnOrAfter(new Date(invoice.createdAt || invoice.issueDate), start);
      })
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  });

  totalCollectedThisMonth = computed(() => {
    const start = this.startOfCurrentMonth();
    return this.payments()
      .filter((payment) => {
        if (payment.status === PaymentStatus.REVERSED) {
          return false;
        }

        if (payment.financialSide && payment.financialSide !== 'INCOME') {
          return false;
        }

        return this.isOnOrAfter(new Date(payment.paymentDate), start);
      })
      .reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0);
  });

  totalOutstanding = computed(() => this.invoiceSummary.value()?.data?.outstanding ?? 0);
  overdueBalance = computed(() => this.invoiceSummary.value()?.data?.overdue ?? 0);

  overdueInvoiceCount = computed(
    () => this.invoices().filter((invoice) => invoice.status === InvoiceStatus.OVERDUE).length,
  );

  accountingIncome = computed(() => {
    const start = this.lastThirtyDaysStart();
    return this.payments()
      .filter((payment) => {
        if (payment.status === PaymentStatus.REVERSED) {
          return false;
        }
        return payment.financialSide === 'INCOME' && this.isOnOrAfter(new Date(payment.paymentDate), start);
      })
      .reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0);
  });

  accountingExpenses = computed(() => {
    const start = this.lastThirtyDaysStart();
    return this.payments()
      .filter((payment) => {
        if (payment.status === PaymentStatus.REVERSED) {
          return false;
        }
        return payment.financialSide === 'EXPENSE' && this.isOnOrAfter(new Date(payment.paymentDate), start);
      })
      .reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0);
  });

  accountingChartData = computed<ChartData<'bar'>>(() => {
    const series = this.buildAccountingSeries(this.payments());

    return {
      labels: series.labels,
      datasets: [
        {
          data: series.income,
          label: 'Income',
          backgroundColor: '#2e9648',
          borderColor: '#2e9648',
          borderRadius: 4,
          barThickness: 10,
        },
        {
          data: series.expenses,
          label: 'Expense',
          backgroundColor: '#e3a51a',
          borderColor: '#e3a51a',
          borderRadius: 4,
          barThickness: 10,
        },
      ],
    };
  });

  accountingChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'start',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          boxWidth: 14,
          color: '#475569',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.raw || 0);
            return `${context.dataset.label}: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: this.currencyCode(),
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          maxRotation: 90,
          minRotation: 90,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
        },
      },
    },
  };

  readonly isLoading = computed(
    () =>
      this.propertySummary.isLoading() ||
      this.unitSummary.isLoading() ||
      this.leaseList.isLoading() ||
      this.invoiceSummary.isLoading() ||
      this.invoiceList.isLoading() ||
      this.paymentList.isLoading(),
  );

  readonly hasError = computed(
    () =>
      !!this.propertySummary.error() ||
      !!this.unitSummary.error() ||
      !!this.leaseList.error() ||
      !!this.invoiceSummary.error() ||
      !!this.invoiceList.error() ||
      !!this.paymentList.error(),
  );

  occupancyRate = computed(() => {
    const total = this.totalUnits();
    const occupied = this.occupiedUnits();
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currencyCode(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }

  private startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private lastThirtyDaysStart(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 29);
    return date;
  }

  private isOnOrAfter(date: Date, threshold: Date): boolean {
    return !Number.isNaN(date.getTime()) && date >= threshold;
  }

  private buildAccountingSeries(payments: EstatePayment[]): {
    labels: string[];
    income: number[];
    expenses: number[];
  } {
    const start = this.lastThirtyDaysStart();
    const labels: string[] = [];
    const income: number[] = [];
    const expenses: number[] = [];

    for (let offset = 0; offset < 30; offset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const key = this.toDayKey(date);
      labels.push(
        date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      );

      const dayPayments = payments.filter((payment) => {
        if (payment.status === PaymentStatus.REVERSED) {
          return false;
        }

        return this.toDayKey(new Date(payment.paymentDate)) === key;
      });

      income.push(
        dayPayments
          .filter((payment) => payment.financialSide === 'INCOME')
          .reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0),
      );

      expenses.push(
        dayPayments
          .filter((payment) => payment.financialSide === 'EXPENSE')
          .reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0),
      );
    }

    return { labels, income, expenses };
  }

  private toDayKey(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  navigateTo(path: string): void {
    this.router.navigate([path], { relativeTo: this.route });
  }

  reload(): void {
    this.propertySummary.reload();
    this.unitSummary.reload();
    this.leaseList.reload();
    this.invoiceSummary.reload();
    this.invoiceList.reload();
    this.paymentList.reload();
  }
}
