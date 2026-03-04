import { Component, inject, signal, ViewChild, OnInit } from '@angular/core';
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

    // Open payment dialog
    const dialogData: PaymentDialogData = {
      totalAmount: orderTotal,
      currency: currency
    };

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: PaymentDialogResult | undefined) => {
      if (result) {
        const paymentMethodName = result.action === 'confirm' && result.paymentMethod 
          ? result.paymentMethod.name 
          : 'Cash'; // Default to Cash if skipped

        this.orderStore
          .completeOrder(orderId, paymentMethodName)
          .then((order) => {
            // Update local state
            this.tableStore.updateTable(table._id, {orderId: null, order: null});
            // Sync to server to clear the orderId
            this.tableStore.updateTableOrderSync(table._id, {orderId: null});
            this.orderStore.deleteSelectedOrder();
            this.tableStore.clearSelectedTable();
            this.saleTypeStore.setDefaultSaleType();
            // Auto-print the completed order
            if (order?._id) {
              this.printJobService.printOrder(order._id).subscribe({
                next: (res) => {
                  this.snackBar.open('Print job created successfully', 'Close', { duration: 3000 });
                },
                error: (err) => {
                  console.error('Failed to create print job:', err);
                  this.snackBar.open('Failed to create print job', 'Close', { duration: 3000 });
                },
              });
            }
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
      if (!table?.orderId?.cart) {
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
}
