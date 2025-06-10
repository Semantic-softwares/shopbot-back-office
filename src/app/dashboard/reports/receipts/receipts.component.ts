import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import {  ReactiveFormsModule } from '@angular/forms';
import { EmployeeSelectorComponent } from '../../../shared/components/employee-selector/employee-selector.component';
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { DateRangeSelectorComponent } from '../../../shared/components/date-range-selector/date-range-selector.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../shared/services/orders.service';
import { QueryParamService } from '../../../shared/services/query-param.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { tap } from 'rxjs';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
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
    MatTabsModule,
    ReactiveFormsModule,
    EmployeeSelectorComponent,
    DateRangeSelectorComponent,
    MatProgressSpinner,
  ],
  styles: [
    `
      :host ::ng-deep .mat-mdc-tab-nav-bar {
        border-bottom: none;
      }

      .mat-mdc-tab-link {
        opacity: 1 !important;
      }
    `,
  ],
})
export class ReceiptsComponent {
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);
  public activeTab = 'all';
  public tabStats: any;
  public dataSource = rxResource({
    request: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    loader: ({ request }) =>
      this.orderService.getSalesReceipts(request.storeId!, request.query).pipe(
        tap((res) => {
          const data = res.data;

          this.tabStats = [
            { label: 'All Receipts', value: 'all', count: data.allReceipts },
            { label: 'Sales', value: 'sales', count: data.sales },
            { label: 'Refunds', value: 'refund', count: data.refund },
          ];
        })
      ),
  });

  displayedColumns: string[] = [
    'receiptNo',
    'date',
    'category',
    'type',
    'total',
    'orderedBy',
    'ordertype',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  exportData(): void {
    // Implement export functionality
  }

  onTabChange(val: any) {
    console.log((this.activeTab = val), this.activeTab, val);
    this.activeTab = val;
    this.queryParams.add({ type: val });
  }
}
