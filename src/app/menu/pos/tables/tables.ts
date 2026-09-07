import { Component, inject, signal, ViewChild, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableStore } from '../../../shared/stores/table.store';
import { TableCategoryStore } from '../../../shared/stores/table-category.store';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TableCardComponent } from '../../../shared/components/table-card/table-card.component';
import { SalesTypeId, Table } from '../../../shared/models';
import { SalesTypeStore } from '../../../shared/stores/sale-type.store';
import { StoreStore } from '../../../shared/stores/store.store';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderStore } from '../../../shared/stores/order.store';
import {
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentDialogResult
} from '../../../shared/components/payment-dialog/payment-dialog.component';
import { SearchComponent } from '../../../shared/components/search/search.component';
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { PrintJobService } from '../../../shared/services/print-job.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../shared/services/cart.service';
import {
  TransferOrderDialogComponent,
  TransferOrderDialogData,
  TransferOrderDialogResult,
} from '../../../shared/components/transfer-order-dialog/transfer-order-dialog.component';
import { SocketService } from '../../../shared/services/socket.service';

@Component({
  selector: 'app-tables',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    FormsModule,
    TableCardComponent,
    SearchComponent,
    NoRecordComponent
  ],
  templateUrl: './tables.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './tables.scss',
})
export class Tables implements OnInit {
  public searchFilter: string = "";
  public readonly tableStore = inject(TableStore);
  public readonly tableCategoryStore = inject(TableCategoryStore);
  public readonly saleTypeStore = inject(SalesTypeStore);
  public readonly orderStore = inject(OrderStore);
  public readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly printJobService = inject(PrintJobService);
  private readonly snackBar = inject(MatSnackBar);
  public readonly router = inject(Router);
  public readonly cartService = inject(CartService);
  public readonly route = inject(ActivatedRoute);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);
  public viewMode = signal<'grid' | 'list'>('grid');
  public searchQuery = signal('');
  @ViewChild("searchComponent") searchComponent!: SearchComponent;
  displayedColumns: string[] = ['name', 'seats', 'category', 'status'];

  ngOnInit(): void {
    // Reload tables whenever visiting this component
    const selectedStore = this.storeStore.selectedStore();
    if (selectedStore?._id) {
      this.tableStore.getTables$(selectedStore._id);
    }

    // Another terminal moved an order — two cards in this grid just changed
    // occupancy, so refetch rather than showing a stale table map.
    this.socketService.tableTransferred$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const storeId = this.storeStore.selectedStore()?._id;
        if (storeId) {
          this.tableStore.getTables$(storeId);
        }
        if (data?.fromTableName && data?.toTableName) {
          this.snackBar.open(
            `${data.fromTableName} → ${data.toTableName}`,
            'Close',
            { duration: 4000 },
          );
        }
      });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.tableStore.updateSearchQuery(query);
  }

  public clearSearch(): void {
    this.searchQuery.set('');
    this.searchComponent.clearFilter()
  }

  onStatusFilterChange(status: 'all' | 'free' | 'occupied'): void {
    this.tableStore.updateStatusFilter(status);
  }

  onCategorySelect(category: any): void {
    this.tableCategoryStore.selectTableCategory(category);
    this.tableStore.updateSearchFilter(category);
  }

  clearCategoryFilter(): void {
    this.tableCategoryStore.clearSelectedTableCategory();
    this.tableStore.updateSearchFilter(null!);
  }

  onTableClick(table: Table): void {
    this.tableStore.selectTable(table._id);
    // Add any additional logic for table selection (e.g., navigate to order details)
  }

  onAddNewOrder(table: Table): void {
    this.tableStore.selectTable(table._id);
     this.saleTypeStore.setSelectedSaleType(SalesTypeId.TABLE);
     this.router.navigate(['checkout'], { relativeTo: this.route });
  }

  

  onClearOrder(table: Table): void {
    if (table.orderId) {
      // Update local state
      this.tableStore.updateTable(table._id, { orderId: null, order: null });
      // Sync to server
      this.tableStore.updateTableOrderSync(table._id, { orderId: null });
      console.log('Order cleared from table:', table.name);
    }
  }

  

  public completeOrder(table: Table): void {
    console.log("Completing order for table:", table);
    
    const orderId = table.orderId?._id;
    const orderTotal = table.orderId?.total || 0;
    const currency = this.storeStore.selectedStore()?.currency || '₦';

    if (!orderId) {
      console.error('No order found for this table');
      return;
    }

    // Open payment dialog. Completing an order is a checkout, not a tab-left-open
    // save — a real payment method must be picked, so "Skip Payment" is hidden.
    const dialogData: PaymentDialogData = {
      totalAmount: orderTotal,
      currency: currency,
      requirePayment: true,
    };

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      // Caps at 95vw so the dialog fits a phone and a small POS screen;
      // a flat 450px overflowed both.
      width: '480px',
      maxWidth: '95vw',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: PaymentDialogResult | undefined) => {
      // Only a genuine "Confirm Payment" click completes the order — closing via
      // the cancel button, backdrop, or Escape leaves it untouched.
      if (result && result.action === 'confirm' && result.paymentMethod) {
        const paymentMethodName = result.paymentMethod.name;

        this.orderStore
          .completeOrder(orderId, paymentMethodName, {
            payments: result.payments,
            amountPaid: result.amountPaid,
            changeDue: result.changeDue,
          })
          .then((order) => {
            // Update local state
            this.tableStore.updateTable(table._id, {orderId: null, order: null});
            // Sync to server to clear the orderId
            this.tableStore.updateTableOrderSync(table._id, {orderId: null});
            this.orderStore.deleteSelectedOrder();
            this.tableStore.clearSelectedTable();
            this.saleTypeStore.setDefaultSaleType();
            // No explicit print call needed here anymore — the backend's
            // updateOrder() (which completeOrder() calls under the hood) now
            // auto-prints on completion itself, gated by the store's
            // "printAfterFinish" setting. Calling printOrder() here too would
            // create a duplicate ticket.
          });
      }
    });
  }

  public printOrder(table: Table): void {
    const orderId = table.orderId?._id;
    if (!orderId) {
      this.snackBar.open('No order found for this table', 'Close', { duration: 3000 });
      return;
    }
    const loadingSnackBar = this.snackBar.open('Sending to printer...', '', { duration: 0 });
    this.printJobService.printOrder(orderId).subscribe({
      next: (res) => {
        loadingSnackBar.dismiss();
        this.snackBar.open(res.message || 'Print job created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        loadingSnackBar.dismiss();
        console.error('Failed to create print job:', err);
        this.snackBar.open('Failed to create print job', 'Close', { duration: 3000 });
      },
    });
  }


  public onEditOrder(table: Table): void {
      const order = table?.orderId;
      if (order?.category === 'Complete' && order?.paymentStatus === 'Paid') {
        this.snackBar.open('This order is complete and paid — it can no longer be edited.', 'Close', { duration: 3000 });
        return;
      }

      if (!order?.cart) {
        this.snackBar.open('Invalid cart data', 'Close', { duration: 3000 });
        console.error('Invalid cart data');
        return;
      }
  
      // Show loading snackbar
      const loadingSnackBar = this.snackBar.open('Loading order for editing...', '', {
        duration: 0,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
  
      this.cartService.loadCart(table.orderId.cart).subscribe({
        next: (cart) => {
          // Dismiss loading snackbar
          loadingSnackBar.dismiss();
          
          // Cart loaded successfully, proceed with editing
          this.orderStore.selectOrder(table?.orderId!);
          this.saleTypeStore.setSelectedSaleType(SalesTypeId.TABLE, true);
          this.saleTypeStore.startEditing();
          this.router.navigate(['/menu/pos/checkout']);
        },
        error: (error) => {
          // Dismiss loading and show error
          loadingSnackBar.dismiss();
          this.snackBar.open('Failed to load order for editing', 'Close', { duration: 3000 });
          console.error('Error loading cart:', error);
          
          // Cart loading failed
          this.saleTypeStore.stopEditing();
        }
      });
    }

  public viewOrder(table: Table): void {
    if (table.orderId?._id) {
      this.router.navigate(['/menu/pos/orders', table.orderId._id, 'details']);
    }
  }

  public onTransferOrder(table: Table): void {
    const orderId = table.orderId?._id;
    if (!orderId) {
      this.snackBar.open('No order on this table to move', 'Close', { duration: 3000 });
      return;
    }

    this.dialog
      .open(TransferOrderDialogComponent, {
        width: '560px',
        maxHeight: '90vh',
        data: { orderId, fromTable: table } satisfies TransferOrderDialogData,
      })
      .afterClosed()
      .subscribe((result: TransferOrderDialogResult | undefined) => {
        if (!result?.transferred) {
          return;
        }
        // Two tables just changed occupancy — refetch rather than patching
        // local state, since a partial transfer may also have opened a brand
        // new order on the destination.
        const storeId = this.storeStore.selectedStore()?._id;
        if (storeId) {
          this.tableStore.getTables$(storeId);
        }
        this.snackBar.open(
          result.type === 'full'
            ? `Order moved to ${result.toTableName}`
            : `Items moved to ${result.toTableName}`,
          'Close',
          { duration: 4000 },
        );
      });
  }
}
