import { Component, inject, OnInit, ViewChild, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExportService } from '../../../../../shared/services/export.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from "../../../../../shared/components/page-header/page-header.component";
import { MatCard } from "@angular/material/card";
import { TrPipe } from '../../../../../shared/i18n/tr.pipe';

@Component({
  selector: 'app-list-receipts',
  templateUrl: './list-receipts.component.html',
  standalone: true,
  imports: [TrPipe, 
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
    MatSelectModule,
    EmployeeSelectorComponent,
    DateRangeSelectorComponent,
    MatProgressSpinner,
    PageHeaderComponent,
    MatCard,
    MatTooltipModule
],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  private snackBar = inject(MatSnackBar);
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
    'servedBy',
    'ordertype',
    'salesChannel',
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
            { label: $localize`All Receipts`, value: 'all', count: data.allReceipts },
            { label: $localize`Sales`, value: 'sales', count: data.sales },
            { label: $localize`Refunds`, value: 'refund', count: data.refund },
          ];
        })
      ),
  });

  readonly orders = computed(() => this.dataSource.value()?.orders || []);

  // Shows every channel/order type by default (empty = no filter sent) —
  // narrow down explicitly via these two dropdowns.
  salesChannelOptions = [
    { value: '', label: $localize`All Channels` },
    { value: 'Point of Sale', label: $localize`Point of Sale` },
    { value: 'Qrcode', label: $localize`Self-Order (QR)` },
    { value: 'Storefront', label: $localize`Storefront` },
    { value: 'Shopbot', label: $localize`Shopbot` },
  ];

  orderTypeOptions = [
    { value: '', label: $localize`All Order Types` },
    { value: 'table', label: $localize`Table` },
    { value: 'quick', label: $localize`Quick Sale` },
    { value: 'online', label: $localize`Online` },
  ];

  statusClass(category: string): string {
    switch (category) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Cancel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  channelClass(channel: string): string {
    switch (channel) {
      case 'Qrcode': return 'bg-purple-100 text-purple-800';
      case 'Storefront': return 'bg-indigo-100 text-indigo-800';
      case 'Point of Sale': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  channelLabel(channel: string): string {
    return channel === 'Qrcode' ? 'QR Code' : channel;
  }

  selectedSalesChannel = computed(() => this.query()?.['salesChannel'] || '');
  selectedOrderType = computed(() => this.query()?.['orderType'] || '');

  onSalesChannelChange(value: string): void {
    value ? this.queryParams.add({ salesChannel: value }) : this.queryParams.remove('salesChannel');
  }

  onOrderTypeChange(value: string): void {
    value ? this.queryParams.add({ orderType: value }) : this.queryParams.remove('orderType');
  }

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
        const excelData = data.map((item: any) => ({
          'Receipt No': item.receiptNo,
          'Date': this.exportService.formatDateTime(item.date),
          'Category': item.category,
          'Order Type': item.ordertype,
          'Payment Type': item.type,
          'Ordered By': item.orderedBy?.name || 'N/A',
          'Served By': item.servedBy?.name || 'N/A',
          'Grand Total': item.total || 0,
        }));
        const excelGrandTotal = data.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
        excelData.push({
          'Receipt No': '',
          'Date': '',
          'Category': '',
          'Order Type': '',
          'Payment Type': '',
          'Ordered By': 'Grand Total',
          'Grand Total': excelGrandTotal,
        });
        this.exportService.exportToExcel(excelData, filename);
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

  /** A sale that took money is a financial record: it is refunded or voided, never deleted. */
  isPaid(order: any): boolean {
    return order?.paymentStatus === 'Paid' || (order?.refundedAmount || 0) > 0;
  }

  private deleteFailed(err: any): void {
    this.snackBar.open(
      err?.error?.message || $localize`The receipt could not be deleted.`,
      $localize`Close`,
      { duration: 6000 },
    );
  }

  deleteReceipt(orderId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: $localize`Delete Receipt`,
        message: $localize`Are you sure you want to delete this receipt? This action cannot be undone.`,
        confirmText: $localize`Delete`,
        cancelText: $localize`Cancel`,
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
            this.deleteFailed(err);
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
    const selectedReceipts = this.selection.selected.filter((r: any) => !this.isPaid(r));
    if (selectedReceipts.length !== this.selection.selected.length) {
      this.snackBar.open(
        $localize`Paid sales cannot be deleted. Refund or void them instead.`,
        $localize`Close`,
        { duration: 6000 },
      );
    }
    if (selectedReceipts.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: $localize`Delete Multiple Receipts`,
        message: $localize`Are you sure you want to delete ${selectedReceipts.length} receipt(s)? This action cannot be undone.`,
        confirmText: $localize`Delete`,
        cancelText: $localize`Cancel`,
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
            this.dataSource.reload();
            this.deleteFailed(error);
          }
        );
      }
    });
  }



}
