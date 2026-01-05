import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { 
  GuestService, 
  GuestData, 
  GuestStats, 
  GuestFilters,
  GuestBreakdown 
} from './guest.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ExportService } from '../../../../shared/services/export.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

// Currency symbol to ISO code mapping
const currencySymbolToCode: Record<string, string> = {
  '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
  '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '₴': 'UAH', '฿': 'THB',
  'R$': 'BRL', '₫': 'VND', '₱': 'PHP', 'RM': 'MYR', 'Rp': 'IDR'
};

@Component({
  selector: 'app-guest-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatDividerModule,
    PageHeaderComponent,
  ],
  templateUrl: './guest-report.component.html',
  styleUrl: './guest-report.component.scss',
})
export class GuestReportComponent {
  private fb = inject(FormBuilder);
  private guestService = inject(GuestService);
  private storeStore = inject(StoreStore);
  private exportService = inject(ExportService);

  // Export state
  isExporting = signal<boolean>(false);

  // Computed values
  selectedStore = computed(() => this.storeStore.selectedStore());
  currency = computed(() => {
    const store = this.selectedStore();
    const symbol = store?.currencyCode || store?.currency || 'USD';
    return currencySymbolToCode[symbol] || symbol;
  });

  // Form
  filterForm: FormGroup;

  // Filter trigger for manual refresh
  private filterTrigger = signal(0);

  // Signals
  error = signal<string | null>(null);
  lastUpdated = signal<Date>(new Date());

  // rxResource for reactive data loading
  private guestResource = rxResource({
    params: () => ({
      storeId: this.selectedStore()?._id || '',
      filters: this.getFilters(),
      trigger: this.filterTrigger()
    }),
    stream: ({ params }) => {
      return forkJoin({
        guestData: this.guestService.getGuestData(params.storeId, params.filters),
        guestBreakdown: this.guestService.getGuestBreakdown(params.storeId, params.filters),
        stats: this.guestService.getGuestStats(params.storeId, params.filters)
      }).pipe(
        map(result => {
          this.lastUpdated.set(new Date());
          return result;
        })
      );
    }
  });

  // Computed signals from resource
  loading = computed(() => this.guestResource.isLoading());
  guestData = computed(() => this.guestResource.value()?.guestData ?? []);
  guestBreakdown = computed(() => this.guestResource.value()?.guestBreakdown ?? []);
  guestStats = computed(() => this.guestResource.value()?.stats ?? null);

  // Chart data computed signals
  guestTrendChartData = computed(() => {
    const data = this.guestData();
    return {
      labels: data.map(d => this.formatDateShort(new Date(d.date))),
      datasets: [
        {
          data: data.map(d => d.totalGuests),
          label: 'Total Guests',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          data: data.map(d => d.newGuests),
          label: 'New Guests',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          data: data.map(d => d.returningGuests),
          label: 'Returning Guests',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  });

  guestBreakdownChartData = computed(() => {
    const breakdown = this.guestBreakdown();
    return {
      labels: breakdown.map(d => d.category),
      datasets: [{
        data: breakdown.map(d => d.value),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(20, 184, 166, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  });

  chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Guests'
        },
        beginAtZero: true
      }
    }
  }));

  doughnutChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((sum: number, value: any) => sum + Number(value), 0);
            const percentage = ((Number(context.parsed) / total) * 100).toFixed(1);
            return `${context.label}: ${Number(context.parsed)} (${percentage}%)`;
          }
        }
      }
    }
  }));

  // Table columns
  displayedColumns: string[] = ['date', 'totalGuests', 'newGuests', 'returningGuests', 'checkIns', 'checkOuts', 'averageStayDuration', 'occupancyRate'];
  breakdownColumns: string[] = ['category', 'count', 'percentage', 'avgStay'];

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)], // 30 days ago
      endDate: [new Date()],
      reportType: ['daily'],
      guestType: ['all'],
      roomType: ['all']
    });
  }

  loadData() {
    this.filterTrigger.update(v => v + 1);
  }

  private getFilters(): GuestFilters {
    const formValue = this.filterForm.value;
    return {
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      reportType: formValue.reportType,
      guestType: formValue.guestType !== 'all' ? formValue.guestType : undefined,
      roomType: formValue.roomType !== 'all' ? formValue.roomType : undefined
    };
  }

  onDateRangeChange() {
    this.loadData();
  }

  exportToCSV() {
    const storeId = this.selectedStore()?._id || '';
    const filters = this.getFilters();
    this.isExporting.set(true);
    
    this.guestService.exportToCSV(storeId, filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `guest-report-${this.formatDateISO(new Date())}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isExporting.set(false);
      },
      error: (error) => {
        console.error('Export error:', error);
        this.error.set('Failed to export CSV. Please try again.');
        this.isExporting.set(false);
      }
    });
  }

  exportToPDF() {
    const storeId = this.selectedStore()?._id || '';
    const filters = this.getFilters();
    this.isExporting.set(true);
    
    this.guestService.exportToPDF(storeId, filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `guest-report-${this.formatDateISO(new Date())}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isExporting.set(false);
      },
      error: (error) => {
        console.error('Export error:', error);
        this.error.set('Failed to export PDF. Please try again.');
        this.isExporting.set(false);
      }
    });
  }

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.guestData().length) return;
    
    const data = this.guestData();
    const filename = 'guest-report';
    const dateRange = {
      from: this.filterForm.value.startDate?.toISOString() || '',
      to: this.filterForm.value.endDate?.toISOString() || ''
    };
    
    switch (format) {
      case 'pdf':
        this.exportService.exportGuestDataToPdf(data, filename, dateRange);
        break;
      case 'csv':
        this.exportService.exportToCSV(data, filename);
        break;
      case 'excel':
        this.exportService.exportToExcel(data, filename);
        break;
    }
  }

  refreshData() {
    this.loadData();
  }

  clearError() {
    this.error.set(null);
  }

  getGrowthClass(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getGrowthIcon(growth: number): string {
    if (growth > 0) return 'trending_up';
    if (growth < 0) return 'trending_down';
    return 'trending_flat';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString();
  }

  formatDuration(days: number | undefined): string {
    if (days === undefined || days === null || isNaN(days)) {
      return '0 days';
    }
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours}h`;
    }
    return `${days.toFixed(1)} days`;
  }
}