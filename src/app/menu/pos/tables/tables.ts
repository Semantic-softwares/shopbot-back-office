import { Component, inject, signal } from '@angular/core';
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
    FormsModule,
    TableCardComponent
  ],
  templateUrl: './tables.html',
  styleUrl: './tables.scss',
})
export class Tables {
  public readonly tableStore = inject(TableStore);
  public readonly tableCategoryStore = inject(TableCategoryStore);
  public readonly saleTypeStore = inject(SalesTypeStore);
  public readonly orderStore = inject(OrderStore);
  public readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  public readonly router = inject(Router);
  public readonly route = inject(ActivatedRoute);
  public viewMode = signal<'grid' | 'list'>('grid');
  public searchQuery = signal('');
  
  displayedColumns: string[] = ['name', 'seats', 'category', 'status'];

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.tableStore.updateSearchQuery(query);
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
            // this.printOrder(order);
            // if (!this.isTablet) {
            //     this.back();
            // }
          });
      }
    });
  }
}
