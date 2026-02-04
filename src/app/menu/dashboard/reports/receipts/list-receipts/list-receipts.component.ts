import { Component, inject, OnInit, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { EmployeeSelectorComponent } from '../../../../../shared/components/employee-selector/employee-selector.component';
import { DateRangeSelectorComponent } from '../../../../../shared/components/date-range-selector/date-range-selector.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { tap } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { ExportService } from '../../../../../shared/services/export.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from "../../../../../shared/components/page-header/page-header.component";
import { MatCard } from "@angular/material/card";

@Component({
  selector: 'app-list-receipts',
  templateUrl: './list-receipts.component.html',
  standalone: true,
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
    MatCheckboxModule,
    MatProgressBarModule,
    MatDialogModule,
    EmployeeSelectorComponent,
    DateRangeSelectorComponent,
    MatProgressSpinner,
    PageHeaderComponent,
    MatCard
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
  private dialog = inject(MatDialog);
  public storeStore = inject(StoreStore);
  private query = toSignal(this.queryParams.getAllParams$);
  public activeTab = 'all';
  public tabStats: any;
  public selection = new SelectionModel<any>(true, []);
  public isDeleting = signal(false);

  displayedColumns: string[] = [
    'select',
    'receiptNo',
    'date',
    'category',
    'type',
    'total',
    'orderedBy',
    'ordertype',
    'actions'
  ];

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      query: this.query(),
    }),
    stream: ({ params }) =>
      this.orderService.getSalesReceipts(params.storeId!, params.query).pipe(
        tap((res) => {
          const data = res.data;
          this.selection.clear();

          this.tabStats = [
            { label: 'All Receipts', value: 'all', count: data.allReceipts },
            { label: 'Sales', value: 'sales', count: data.sales },
            { label: 'Refunds', value: 'refund', count: data.refund },
          ];
        })
      ),
  });

  readonly orders = computed(() => this.dataSource.value()?.orders || []);

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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Receipt',
        message: 'Are you sure you want to delete this receipt? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isDeleting.set(true);
        this.orderService.deleteOrder(orderId).subscribe({
          next: () => {
            this.isDeleting.set(false);
            this.dataSource.reload();
          },
          error: (err) => {
            console.error('Error deleting receipt:', err);
            this.isDeleting.set(false);
          },
        });
      }
    });
  }

  toggleAllRows(event: any) {
    if (event.checked) {
      this.selection.select(...(this.dataSource.value()?.orders || []));
    } else {
      this.selection.clear();
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.value()?.orders?.length || 0;
    return numSelected > 0 && numSelected === numRows;
  }

  deleteMultiple() {
    const selectedReceipts = this.selection.selected;
    if (selectedReceipts.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Multiple Receipts',
        message: `Are you sure you want to delete ${selectedReceipts.length} receipt(s)? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isDeleting.set(true);
        const deletePromises = selectedReceipts.map(receipt =>
          this.orderService.deleteOrder(receipt._id).toPromise()
        );

        Promise.all(deletePromises).then(
          () => {
            this.isDeleting.set(false);
            this.selection.clear();
            this.dataSource.reload();
          },
          (error) => {
            console.error('Error deleting receipts:', error);
            this.isDeleting.set(false);
          }
        );
      }
    });
  }



}
