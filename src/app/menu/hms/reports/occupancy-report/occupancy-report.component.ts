import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  OccupancyService, 
  OccupancyData, 
  RoomStatus, 
  OccupancyStats, 
  OccupancyFilters 
} from '../../../../shared/services/occupancy.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-occupancy-report',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    BaseChartDirective,
    PageHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './occupancy-report.component.html',
  styleUrls: ['./occupancy-report.component.scss'],
})
export class OccupancyReportComponent {
  private fb = inject(FormBuilder);
  private occupancyService = inject(OccupancyService);
  private storeStore = inject(StoreStore);

  // Computed values
  selectedStore = computed(() => this.storeStore.selectedStore());
  
  // Currency mapping for formatting
  private currencySymbolToCode: Record<string, string> = {
    '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
    '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '฿': 'THB', '₫': 'VND',
    'R$': 'BRL', 'R': 'ZAR', 'CHF': 'CHF', 'kr': 'SEK', 'zł': 'PLN'
  };

  currency = computed(() => {
    const store = this.selectedStore();
    const currencyValue = store?.currency  ||store?.currencyCode || 'USD';
    return this.currencySymbolToCode[currencyValue] || currencyValue;
  });

  // Filter signals
  filterTrigger = signal(0);

  // Form
  filterForm: FormGroup;

  // Signals
  lastUpdated = signal<Date>(new Date());

  // Filter params for rxResource
  private filterParams = computed(() => {
    this.filterTrigger(); // Trigger reload
    return this.getFilters();
  });

  // rxResource for occupancy data
  occupancyResource = rxResource({
    params: this.filterParams,
    stream: ({ params }) => {
      return forkJoin({
        occupancyData: this.occupancyService.getOccupancyData(params),
        roomStatuses: this.occupancyService.getRoomStatuses(),
        stats: this.occupancyService.getOccupancyStats(params)
      }).pipe(
        map(result => {
          this.lastUpdated.set(new Date());
          this.updateCharts(result.occupancyData);
          return result;
        }),
        catchError(error => {
          console.error('Error loading data:', error);
          return of(null);
        })
      );
    }
  });

  // Computed values from resource
  loading = computed(() => this.occupancyResource.isLoading());
  error = computed(() => this.occupancyResource.error() ? 'Failed to load occupancy data. Please try again.' : null);
  occupancyData = computed(() => this.occupancyResource.value()?.occupancyData || []);
  roomStatuses = computed(() => this.occupancyResource.value()?.roomStatuses || []);
  occupancyStats = computed(() => this.occupancyResource.value()?.stats || null);

  // Chart data
  occupancyChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Occupancy Rate (%)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        data: [],
        label: 'Available Rooms',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }
    ]
  });

  occupancyChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.datasetIndex === 0) {
              return `Occupancy Rate: ${context.parsed.y}%`;
            } else {
              return `Available Rooms: ${context.parsed.y}`;
            }
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
          text: 'Percentage / Count'
        },
        beginAtZero: true
      }
    }
  };

  revenueChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{
      data: [],
      label: 'Daily Revenue',
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgba(168, 85, 247, 1)',
      borderWidth: 1
    }]
  });

  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const currency = this.currency();
            const formatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            });
            return `Revenue: ${formatter.format(context.parsed.y ?? 0)}`;
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
          callback: (value) => {
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
  };

  // Table columns
  displayedColumns: string[] = ['date', 'totalRooms', 'occupiedRooms', 'availableRooms', 'occupancyRate', 'revenue', 'averageRate'];

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)], // 30 days ago
      endDate: [new Date()],
      reportType: ['daily'],
      roomType: ['all'],
      floorNumber: ['all']
    });
  }

  refreshData() {
    this.filterTrigger.update(v => v + 1);
  }

  onDateRangeChange() {
    this.filterTrigger.update(v => v + 1);
  }

  onFilterChange() {
    this.filterTrigger.update(v => v + 1);
  }

  clearError() {
    this.occupancyService.clearError();
  }

  private getFilters(): OccupancyFilters {
    const formValue = this.filterForm.value;
    return {
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      reportType: formValue.reportType,
      roomType: formValue.roomType !== 'all' ? formValue.roomType : undefined,
      floorNumber: formValue.floorNumber && formValue.floorNumber !== 'all' ? parseInt(formValue.floorNumber) : undefined
    };
  }

  private updateCharts(data: OccupancyData[]) {
    // Update occupancy chart
    this.occupancyChartData.set({
      labels: data.map(d => this.formatDateShort(d.date)),
      datasets: [
        {
          data: data.map(d => d.occupancyRate),
          label: 'Occupancy Rate (%)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          data: data.map(d => d.availableRooms),
          label: 'Available Rooms',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    });

    // Update revenue chart
    this.revenueChartData.set({
      labels: data.map(d => this.formatDateShort(d.date)),
      datasets: [{
        data: data.map(d => d.revenue),
        label: 'Daily Revenue',
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1
      }]
    });
  }

  exportToCSV() {
    const filters = this.getFilters();
    this.occupancyService.exportToCSV(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `occupancy-report-${this.formatDateISO(new Date())}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Export error:', error);
      }
    });
  }

  exportToPDF() {
    const filters = this.getFilters();
    this.occupancyService.exportToPDF(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `occupancy-report-${this.formatDateISO(new Date())}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Export error:', error);
      }
    });
  }

  getRoomStatusClass(status: RoomStatus['status']): string {
    switch (status) {
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'out-of-order':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getRoomStatusIcon(status: RoomStatus['status']): string {
    switch (status) {
      case 'occupied':
        return 'person';
      case 'available':
        return 'check_circle';
      case 'out-of-order':
        return 'block';
      case 'maintenance':
        return 'build';
      default:
        return 'help';
    }
  }

  getOccupancyRateClass(rate: number): string {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency()
    }).format(amount);
  }

  formatDate(date: Date): string {
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

  formatDateTime(date: Date | string | undefined | null): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}