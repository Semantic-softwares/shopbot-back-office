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
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../shared/services/orders.service';
import { QueryParamService } from '../../../shared/services/query-param.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { DateRangeSelectorComponent } from "../../../shared/components/date-range-selector/date-range-selector.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeSelectorComponent } from "../../../shared/components/employee-selector/employee-selector.component";

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
    EmployeeSelectorComponent
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
    request: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    loader: ({ request }) =>
      this.orderService.getSalesByPaymentType(request.storeId!, request.query),
  });
  
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];


  exportData(): void {
    // Implement export functionality
  }
}


