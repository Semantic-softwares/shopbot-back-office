import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { RoomsService } from '../../../../shared/services/rooms.service';
import { ReportExportService } from '../../../../shared/services/report-export.service';
import { toDateOnly } from '../../../../shared/utils/date-only';
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
import { TrPipe } from '../../../../shared/i18n/tr.pipe';
import { ChartThemeService } from '../../../../shared/services/chart-theme.service';

@Component({
  selector: 'app-occupancy-report',
  standalone: true,
  imports: [TrPipe, 
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./occupancy-report.component.scss'],
})
export class OccupancyReportComponent {
  // Keeps Chart.js text/grid colours in step with the light/dark theme.
  private readonly chartTheme = inject(ChartThemeService);
  private fb = inject(FormBuilder);
  private occupancyService = inject(OccupancyService);
  private storeStore = inject(StoreStore);
  private roomsService = inject(RoomsService);
  private reportExport = inject(ReportExportService);

  // Computed values
  selectedStore = computed(() => this.storeStore.selectedStore());
  
  // Currency mapping for formatting (symbol → ISO 4217 code)
  private currencySymbolToCode: Record<string, string> = {
    '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
    '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '฿': 'THB', '₫': 'VND',
    'R$': 'BRL', 'R': 'ZAR', 'CHF': 'CHF', 'kr': 'SEK', 'zł': 'PLN',
    'RS': 'MUR', 'Rs': 'MUR'
  };

  currency = computed(() => {
    const store = this.selectedStore();
    // Prefer currencyCode (likely ISO 4217), then map the symbol, then raw values
    const candidates = [
      store?.currencyCode,
      store?.currency ? this.currencySymbolToCode[store.currency] : undefined,
      store?.currency,
      'USD'
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        new Intl.NumberFormat('en-US', { style: 'currency', currency: candidate });
        return candidate;
      } catch {
        // not a valid ISO 4217 code, try next
      }
    }
    return 'USD';
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
      );
    }
  });

  // The hotel's own room types for the filter (never a hard-coded list).
  roomTypes = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => (params.storeId ? this.roomsService.getRoomTypes(params.storeId) : of([])),
  });

  // Floors that really exist, from the room board.
  floors = computed(() => [...new Set(this.roomStatuses().map((r) => r.floorNumber))].sort((a, b) => a - b));

  // Computed values from resource
  loading = computed(() => this.occupancyResource.isLoading());
  error = computed(() => (this.occupancyResource.error() ? $localize`Could not load the occupancy report. Check your connection and try again.` : null));
  occupancyData = computed(() => this.occupancyResource.value()?.occupancyData || []);
  roomStatuses = computed(() => this.occupancyResource.value()?.roomStatuses || []);
  occupancyStats = computed(() => this.occupancyResource.value()?.stats || null);

  // Chart data
  occupancyChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: $localize`Occupancy Rate (%)`,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        data: [],
        label: $localize`Available Rooms`,
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
          text: $localize`Date`
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: $localize`Percentage / Count`
        },
        beginAtZero: true
      }
    }
  };

  revenueChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{
      data: [],
      label: $localize`Daily Revenue`,
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
          text: $localize`Date`
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

  /** Try the same request again. */
  clearError() {
    this.refreshData();
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
          label: $localize`Occupancy Rate (%)`,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          data: data.map(d => d.availableRooms),
          label: $localize`Available Rooms`,
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
        label: $localize`Daily Revenue`,
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1
      }]
    });
  }

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    const data = this.occupancyData();
    if (!data.length) return;
    const store = this.storeStore.selectedStore();
    const from = toDateOnly(this.filterForm.value.startDate);
    const to = toDateOnly(this.filterForm.value.endDate);
    const columns = [
      { key: 'date', label: $localize`Date`, type: 'date' as const },
      { key: 'totalRooms', label: $localize`Total rooms`, type: 'number' as const },
      { key: 'occupiedRooms', label: $localize`Rooms sold`, type: 'number' as const },
      { key: 'availableRooms', label: $localize`Available rooms`, type: 'number' as const },
      { key: 'outOfOrderRooms', label: $localize`Out of order`, type: 'number' as const },
      { key: 'maintenanceRooms', label: $localize`Maintenance`, type: 'number' as const },
      { key: 'occupancyRate', label: $localize`Occupancy (%)`, type: 'number' as const },
      { key: 'revenue', label: $localize`Room revenue`, type: 'currency' as const },
      { key: 'averageRate', label: 'ADR', type: 'currency' as const },
      { key: 'revpar', label: 'RevPAR', type: 'currency' as const },
      { key: 'reservationCount', label: $localize`Reservations`, type: 'number' as const },
    ];
    this.reportExport.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Occupancy report`,
      storeName: store?.name ?? '',
      currency: store?.currencyCode ?? store?.currency,
      subtitle: `${from} → ${to}`,
      columns,
      rows: data.map((r) => ({ ...r, date: toDateOnly(r.date), revpar: r.revpar ?? 0 })),
      filename: `${store?.name ?? 'hotel'}-occupancy-${from}_${to}`,
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