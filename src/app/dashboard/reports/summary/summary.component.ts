import {
  Component,
  OnInit,
  ViewChild,
  inject,
  DestroyRef,
  AfterViewInit,
  ElementRef,
  effect,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { EmployeeSelectorComponent } from '../../../shared/components/employee-selector/employee-selector.component';
import { DateRangeSelectorComponent } from '../../../shared/components/date-range-selector/date-range-selector.component';
import { PeriodSelectorComponent } from '../../../shared/components/period-range-selector/period-range-selector.component';
import {
  rxResource,
  takeUntilDestroyed,
  toSignal,
} from '@angular/core/rxjs-interop';
import { QueryParamService } from '../../../shared/services/query-param.service';
import { OrderService } from '../../../shared/services/orders.service';
import { StoreStore } from '../../../shared/stores/store.store';

@Component({
  selector: 'shopbot-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    EmployeeSelectorComponent,
    DateRangeSelectorComponent,
    PeriodSelectorComponent,
  ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);

 
  public summaryData = rxResource({
    request: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    loader: ({ request }) =>
      this.orderService.getSalesSummary(request.storeId!, request.query),
  });

  public dataSource = rxResource({
    request: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    loader: ({ request }) =>
      this.orderService.getSalesSummaryByDate(request.storeId!, request.query),
  });

  valu = effect(() => {
   if (this.dataSource.hasValue()) {
    this.updateChart(this.queryParams.getAllParamsSnapshot['period'])
   }
     
  })

  public displayedColumns: string[] = [
    'period',
    'grossSales',
    'refunds',
    'discounts',
    'netSales',
    'costOfGoods',
    'grossProfit',
    'margin',
    'taxes',
  ];

  public summaryItems = [
    'grossSales',
    'refunds',
    'discounts',
    'netSales',
    'grossProfit',
  ] as const;

  

  activeLink = 'grossSales';
  currentChart: Chart | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];

  chartPeriods = [
    { value: 'daily', label: 'Days' },
    { value: 'weekly', label: 'Weeks' },
    { value: 'monthly', label: 'Months' },
    { value: 'yearly', label: 'Years' },
  ];

  @ViewChild('salesChart') canvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    Chart.register(...registerables);

    // Handle query params changes
    this.queryParams.getAllParams$
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe((params) => {
        if (params['activeLink']) {
          this.activeLink = params['activeLink'];
        }
      });
  }

  exportData() {
    // Implement export logic here
    console.log('Exporting data...');
  }

  onTabChange(tabName: string) {
    this.activeLink = tabName;
    // this.queryParams.add({ activeLink: tabName });
    if (this.dataSource.value()) {
      this.updateChart(this.queryParams.getAllParamsSnapshot['period']);
    }
  }

  private getChartData(period: string): { labels: string[]; data: number[] } {
    console.log(this.dataSource.hasValue())
    if (!this.dataSource.hasValue()) {
      return { labels: [], data: [] };
    }

    const data = this.dataSource.value();
    console.log(data)
    const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period));
    
    const formatPeriod = (period: string) => {
      const date = new Date(period + '-01'); // Add day for valid date parsing
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    };
    console.log(sortedData.map(item => formatPeriod(item.period)))
    return {
      labels: sortedData.map(item => formatPeriod(item.period)),
      data: sortedData.map(item => item[this.activeLink] || 0)
    };
  }


  private updateChart(period: string) {
    console.log(period, this.currentChart)
    if (this.currentChart) {
      this.currentChart.destroy();
    }
    console.log(this.canvas)
    if (!this.canvas?.nativeElement) return;
    
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const chartData = this.getChartData(period);

    this.currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: this.activeLink,
            data: chartData.data,
            borderColor: '#4CAF50',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'NGN'
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: function (context) {
                return '#e2e8f0'; // Tailwind's gray-200
              },
              lineWidth: 0.5,
            },
          },
        },
      },
    });
  }
}
