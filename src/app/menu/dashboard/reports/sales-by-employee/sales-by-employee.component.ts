import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { EmployeeSelectorComponent } from '../../../../shared/components/employee-selector/employee-selector.component';
import { ActivatedRoute, Router } from '@angular/router';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ExportService } from '../../../../shared/services/export.service';
import { DateRangeSelectorComponent } from "../../../../shared/components/date-range-selector/date-range-selector.component";

@Component({
  selector: 'app-sales-by-employee',
  templateUrl: './sales-by-employee.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    NoRecordComponent,
    MatProgressSpinner,
    DateRangeSelectorComponent,
    MatMenuModule
]
})
export class SalesByEmployeeComponent  {
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);

    public displayedColumns: string[] = [
    'name',
    'grossSales',
    'refunds',
    'discounts',
    'netSales',
    'receipts',
    'averageSale',
  ];

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    stream: ({ params }) =>
      this.orderService.getSalesByEmployees(params.storeId!, params.query),
  });
  
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];


  private exportService = inject(ExportService);

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.dataSource.value()) return;
    
    const data = this.dataSource.value() || [];
    const filename = 'employee-sales';
    switch (format) {
      case 'pdf':
        this.exportService.exportEmployeeDataToPdf(data, filename, {from: this.query()!['start'], to: this.query()!['end']});
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



  