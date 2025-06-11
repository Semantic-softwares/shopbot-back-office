import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmployeeSelectorComponent } from '../../../shared/components/employee-selector/employee-selector.component';
import { ActivatedRoute, Router } from '@angular/router';
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { DateRangeSelectorComponent } from "../../../shared/components/date-range-selector/date-range-selector.component";
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../shared/services/orders.service';
import { QueryParamService } from '../../../shared/services/query-param.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ExportService } from '../../../shared/services/export.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-sales-by-category',
  templateUrl: './sales-by-category.component.html',
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
    MatMenuModule,
    EmployeeSelectorComponent,
    NoRecordComponent,
    DateRangeSelectorComponent,
    MatProgressSpinner
]
})
export class SalesByCategoryComponent  {
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    stream: ({ params }) =>
      this.orderService.getTopSellingCategories(params.storeId!, params.query),
  });
  
  displayedColumns: string[] = ['category', 'itemsSold', 'netSales', 'costOfGoods', 'grossProfit'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];


  private exportService = inject(ExportService);

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.dataSource.value()) return;
    
    const data = this.dataSource.value() || [];
    const filename = 'category-sales';
    switch (format) {
      case 'pdf':
        this.exportService.exportCategoryDataToPdf(data, filename, {from: this.query()!['start'], to: this.query()!['end']});
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
