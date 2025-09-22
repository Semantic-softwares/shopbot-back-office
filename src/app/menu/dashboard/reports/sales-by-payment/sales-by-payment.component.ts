import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { DateRangeSelectorComponent } from "../../../../shared/components/date-range-selector/date-range-selector.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeSelectorComponent } from "../../../../shared/components/employee-selector/employee-selector.component";
import { ExportService } from '../../../../shared/services/export.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-sales-by-payment',
  templateUrl: './sales-by-payment.component.html',
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
    DateRangeSelectorComponent,
    MatProgressSpinnerModule,
    EmployeeSelectorComponent,
    MatMenuModule
]
})
export class SalesByPaymentComponent  {
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);

   displayedColumns: string[] = [
    'paymentType',
    'paymentTransactions',
    'paymentAmount',
    'refundTransactions',
    'refundAmount',
    'netAmount'
  ];

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    stream: ({ params }) =>
      this.orderService.getSalesByPaymentType(params.storeId!, params.query),
  });
  
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];


  private exportService = inject(ExportService);

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.dataSource.value()) return;
    
    const data = this.dataSource.value() || [];
    const filename = 'payment-report';
    switch (format) {
      case 'pdf':
        this.exportService.exportPaymentDataToPdf(data, filename, {from: this.query()!['start'], to: this.query()!['end']});
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


