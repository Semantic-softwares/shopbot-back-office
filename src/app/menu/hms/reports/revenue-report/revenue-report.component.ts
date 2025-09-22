import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { 
  RevenueService, 
  RevenueData, 
  RevenueStats, 
  RevenueFilters,
  RevenueBreakdown 
} from './revenue.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-revenue-report',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './revenue-report.component.html',
  styleUrl: './revenue-report.component.scss',
})
export class RevenueReportComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private revenueService = inject(RevenueService);
  private storeStore = inject(StoreStore);
  private exportService = inject(ExportService);
  private destroy$ = new Subject<void>();

  // Export state
  isExporting = signal<boolean>(false);

  // Computed values
  selectedStore = computed(() => this.storeStore.selectedStore());
  currency = computed(() => 
    this.selectedStore()?.currencyCode || this.selectedStore()?.currency || 'USD'
  );

  // Form
  filterForm: FormGroup;

  // Signals
  loading = signal<boolean>(false);
  revenueData = signal<RevenueData[]>([]);
  revenueBreakdown = signal<RevenueBreakdown[]>([]);
  revenueStats = signal<RevenueStats | null>(null);
  error = signal<string | null>(null);
  lastUpdated = signal<Date>(new Date());

  // Chart data computed signals
  revenueTrendChartData = computed(() => {
    const data = this.revenueData();
    return {
      labels: data.map(d => this.formatDateShort(new Date(d.date))),
      datasets: [
        {
          data: data.map(d => d.totalRevenue),
          label: 'Total Revenue',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          data: data.map(d => d.roomRevenue),
          label: 'Room Revenue',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  });

  revenueBreakdownChartData = computed(() => {
    const breakdown = this.revenueBreakdown();
    return {
      labels: breakdown.map(d => d.category),
      datasets: [{
        data: breakdown.map(d => d.amount),
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
            const currency = this.currency();
            const formatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            });
            return `${context.dataset.label}: ${formatter.format(context.parsed.y)}`;
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
          text: `Revenue (${this.currency()})`
        },
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            const currency = this.currency();
            const formatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            });
            return formatter.format(Number(value));
          }
        }
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
            const currency = this.currency();
            const formatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            });
            const total = context.dataset.data.reduce((sum: number, value: any) => sum + Number(value), 0);
            const percentage = ((Number(context.parsed) / total) * 100).toFixed(1);
            return `${context.label}: ${formatter.format(Number(context.parsed))} (${percentage}%)`;
          }
        }
      }
    }
  }));

  // Table columns
  displayedColumns: string[] = ['date', 'totalRevenue', 'roomRevenue', 'serviceRevenue', 'otherRevenue', 'transactions', 'averageTransaction'];

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)], // 30 days ago
      endDate: [new Date()],
      reportType: ['daily'],
      revenueType: ['all'],
      paymentMethod: ['all']
    });
  }

  ngOnInit() {
    this.loadData();
    
    // Subscribe to form changes
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    const storeId = this.selectedStore()?._id || '';
    const filters = this.getFilters();
    this.loading.set(true);
    
    forkJoin({
      revenueData: this.revenueService.getRevenueData(storeId, filters),
      revenueBreakdown: this.revenueService.getRevenueBreakdown(storeId, filters),
      stats: this.revenueService.getRevenueStats(storeId, filters)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ revenueData, revenueBreakdown, stats }) => {
        this.revenueData.set(revenueData);
        this.revenueBreakdown.set(revenueBreakdown);
        this.revenueStats.set(stats);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.error.set('Failed to load revenue data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private getFilters(): RevenueFilters {
    const formValue = this.filterForm.value;
    return {
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      reportType: formValue.reportType,
      revenueType: formValue.revenueType !== 'all' ? formValue.revenueType : undefined,
      paymentMethod: formValue.paymentMethod !== 'all' ? formValue.paymentMethod : undefined
    };
  }

  private updateCharts(revenueData: RevenueData[], revenueBreakdown: RevenueBreakdown[]) {
    // Charts are now computed automatically via signals
  }

  onDateRangeChange() {
    this.loadData();
  }

  exportToCSV() {
    const storeId = this.selectedStore()?._id || '';
    const filters = this.getFilters();
    this.isExporting.set(true);
    
    this.revenueService.exportToCSV(storeId, filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-report-${this.formatDateISO(new Date())}.csv`;
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
    
    this.revenueService.exportToPDF(storeId, filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-report-${this.formatDateISO(new Date())}.pdf`;
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
    if (!this.revenueData().length) return;
    
    const data = this.revenueData();
    const filename = 'revenue-report';
    const dateRange = {
      from: this.filterForm.value.startDate?.toISOString() || '',
      to: this.filterForm.value.endDate?.toISOString() || ''
    };
    
    switch (format) {
      case 'pdf':
        this.exportService.exportRevenueDataToPdf(data, filename, dateRange);
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

  getRevenueGrowthClass(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getRevenueGrowthIcon(growth: number): string {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency()
    }).format(amount);
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

  formatNumber(value: number): string {
    return value.toLocaleString();
  }
}