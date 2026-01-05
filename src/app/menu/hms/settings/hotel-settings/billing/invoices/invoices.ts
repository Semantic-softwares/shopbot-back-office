import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { SubscriptionService } from '../../../../../../shared/services/subscription.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { rxResource } from '@angular/core/rxjs-interop';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    NoRecordComponent,
    MatCardModule
],
  templateUrl: './invoices.html',
  styleUrl: './invoices.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent {
  private subscriptionService = inject(SubscriptionService);
  private storeStore = inject(StoreStore);

  // Pagination state
  private pageIndex = signal(0);
  private pageSize = signal(12);
  isDownloading = signal(false);

  // Using rxResource for data fetching with pagination
  invoicesResource = rxResource({
    params: () => ({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) => {
      if (!params.storeId) {
        return of({ invoices: [], total: 0 });
      }
      const skip = params.pageIndex * params.pageSize;
      return this.subscriptionService.getInvoices(
        params.storeId,
        params.pageSize,
        skip
      );
    },
  });

  // Table columns to display
  displayedColumns: string[] = ['billingDate', 'description', 'amount', 'status', 'actions'];

  // Computed properties
  invoices = computed(() => {
    const data = this.invoicesResource.value() as any;
    return data?.invoices ?? [];
  });

  totalInvoices = computed(() => {
    const data = this.invoicesResource.value() as any;
    return data?.total ?? 0;
  });

  // Computed chart data based on invoices
  chartData = computed(() => {
    const data = this.invoicesResource.value() as any;
    if (!data?.invoices) {
      return {
        labels: [] as string[],
        datasets: [
          {
            label: 'Monthly Billing Amount',
            data: [] as number[],
            backgroundColor: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 1,
          },
        ],
      };
    }

    // Sort invoices by billing date
    const sorted = [...data.invoices].sort(
      (a: any, b: any) =>
        new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime()
    );

    // Limit to last 12 months
    const last12 = sorted.slice(-12);

    return {
      labels: last12.map((inv: any) => this.formatMonth(inv.billingDate)),
      datasets: [
        {
          label: 'Monthly Billing Amount',
          data: last12.map((inv: any) => inv.amount),
          backgroundColor: '#3b82f6',
          borderColor: '#1e40af',
          borderWidth: 1,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount',
        },
      },
    },
  };

  formatMonth(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  downloadInvoice(invoice: any): void {
    this.isDownloading.set(true);
    this.subscriptionService.downloadInvoicePdf(invoice._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoiceNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading.set(false);
      },
      error: (error) => {
        console.error('Failed to download invoice:', error);
        this.isDownloading.set(false);
      },
    });
  }
}
