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
import { EmployeeSelectorComponent } from '../../../../shared/components/employee-selector/employee-selector.component';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { tap } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { ExportService } from '../../../../shared/services/export.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-list-receipts',
  templateUrl: './list-receipts.component.html',
  standalone: true,
  // providers: [DatePipe],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
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
export class ListReceiptsComponent {
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);
  public activeTab = 'all';
  public tabStats: any;
  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    stream: ({ params }) =>
      this.orderService.getSalesReceipts(params.storeId!, params.query).pipe(
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
    'actions'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  private exportService = inject(ExportService);
  // private datePipe = inject(DatePipe);

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.dataSource.value()) return;
    
    const data = this.dataSource.value().orders;
    const filename = 'receipts';
    switch (format) {
      case 'pdf':
        this.exportService.exportToPdf(data, filename, {from: this.query()!['start'], to: this.query()!['end']});
        break;
      case 'csv':
        this.exportService.exportToCSV(data, filename);
        break;
      case 'excel':
        this.exportService.exportToExcel(data, filename);
        break;
    }
  }

  onTabChange(val: any) {
    this.activeTab = val;
    this.queryParams.add({ type: val });
  }

  viewRecipesDetails(orderId: string) {
    this.router.navigate(['../', orderId, 'details'], {
      relativeTo: this.route,
    });
  }

  deleteReceipt(orderId: string) {
    if (confirm('Are you sure you want to delete this receipt?')) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.dataSource.reload();
        },
        error: (err) => {
          console.error('Error deleting receipt:', err);
        },
      });
    }
  }



}
