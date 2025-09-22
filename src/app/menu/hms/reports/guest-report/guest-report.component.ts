import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { 
  GuestService, 
  GuestData, 
  GuestStats, 
  GuestFilters,
  GuestBreakdown 
} from './guest.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ExportService } from '../../../../shared/services/export.service';

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
  ],
  templateUrl: './guest-report.component.html',
  styleUrl: './guest-report.component.scss',
})
export class GuestReportComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private guestService = inject(GuestService);
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
  guestData = signal<GuestData[]>([]);
  guestBreakdown = signal<GuestBreakdown[]>([]);
  guestStats = signal<GuestStats | null>(null);
  error = signal<string | null>(null);
  lastUpdated = signal<Date>(new Date());

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

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)], // 30 days ago
      endDate: [new Date()],
      reportType: ['daily'],
      guestType: ['all'],
      roomType: ['all']
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
      guestData: this.guestService.getGuestData(storeId, filters),
      guestBreakdown: this.guestService.getGuestBreakdown(storeId, filters),
      stats: this.guestService.getGuestStats(storeId, filters)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ guestData, guestBreakdown, stats }) => {
        this.guestData.set(guestData);
        this.guestBreakdown.set(guestBreakdown);
        this.guestStats.set(stats);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.error.set('Failed to load guest data. Please try again.');
        this.loading.set(false);
      }
    });
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
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
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