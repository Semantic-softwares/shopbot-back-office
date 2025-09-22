import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { EmployeeSelectorComponent } from '../../../../shared/components/employee-selector/employee-selector.component';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../shared/services/orders.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'sales-by-item',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    BaseChartDirective,
    NoRecordComponent,
    EmployeeSelectorComponent,
    DateRangeSelectorComponent
  ],
  templateUrl: './sales-by-item.component.html',
  styleUrl: './sales-by-item.component.scss',
})
export class SalesByItemComponent {
  private orderService = inject(OrderService);
  public storeStore = inject(StoreStore);
  private queryParamsService = inject(QueryParamService);
  public isGridView = window.innerWidth < 768; // Default to grid on mobile

  toggleView(event: any) {
    this.isGridView = event.value;
  }
  // Chart configurations
  selectedChartType: ChartType = 'bar';

  chartTypes = ['bar', 'line'];

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      ['y']: {
        beginAtZero: true,
        grid: {
          display: true,
          drawTicks: false,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      ['x']: {
        grid: {
          display: false,
        },
      },
    },
  };

  private query = toSignal(this.queryParamsService.getAllParams$);

  public products = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    stream: ({ params }) =>
      this.orderService.getTopSellingProducts(params.storeId!, params.query),
  });


  // Table configuration
  displayedColumns: string[] = [
    'name',
    'totalQuantitySold',
    'totalRevenue',
    'grossSales',
    'totalTax',
    'netSales'
  ];
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  getChartData() {
    if (!this.products.value()) return {
      labels: [],
      datasets: [{ data: [], backgroundColor: [] }]
    };
    
    const products = this.products.value() || [];
    return {
      labels: products.map(item => item.name),
      datasets: [{
        data: products.map(item => item.netSales),
        backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    };
   
  }

  onChartTypeChange(event: any) {}



  private exportService = inject(ExportService);

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.products.value()) return;
    
    const data = this.products.value() || [];
    const filename = 'item-sales';
    switch (format) {
      case 'pdf':
        this.exportService.exportItemDataToPdf(data, filename, {from: this.query()!['start'], to: this.query()!['end']});
        break;
      case 'csv':
        this.exportService.exportToCSV(data, filename);
        break;
      case 'excel':
        this.exportService.exportToExcel(data, filename);
        break;
    }
  }
}
