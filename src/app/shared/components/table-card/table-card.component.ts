import { Component, input, output, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Table, OrderCategoryType } from '../../models';
import { StoreStore } from '../../stores/store.store';
import { BillModalComponent } from '../bill-modal/bill-modal.component';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-table-card',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './table-card.component.html',
  styleUrl: './table-card.component.scss',
})
export class TableCardComponent {
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  table = input.required<Table>();
  hideActions = input<boolean>(false);
  tableClick = output<Table>();
  addNewOrder = output<Table>();
  completeOrder = output<Table>();
  clearOrder = output<Table>();
  viewOrder = output<Table>();

  isLoadingBill = signal(false);

  currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  get isOrderCompleted(): boolean {
    return this.table().orderId?.category === OrderCategoryType.COMPLETE;
  }

  onTableClick(): void {
    this.tableClick.emit(this.table());
  }

  onAddNewOrder(): void {
    this.addNewOrder.emit(this.table());
  }

  onCompleteOrder(event: Event): void {
    event.stopPropagation();
    this.completeOrder.emit(this.table());
  }

  onClearOrder(event: Event): void {
    event.stopPropagation();
    this.clearOrder.emit(this.table());
  }

  onViewOrder(event: Event): void {
    event.stopPropagation();
    this.viewOrder.emit(this.table());
  }

  public onViewBill(event: Event): void {
    event.stopPropagation();
    const order = this.table().orderId;
    
    if (!order?.cart) {
      this.snackBar.open('No cart data available', 'Close', { duration: 3000 });
      return;
    }

    // Set loading state and show loading indicator
    this.isLoadingBill.set(true);
    const loadingSnackBar = this.snackBar.open('Loading bill...', '', {
      duration: 0,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });

    // Load the structured cart before opening bill modal
    this.cartService.loadCart(order.cart).subscribe({
      next: async (cart) => {
        try {
          // Create order with structured cart
          const orderData = {
            ...order,
            cart,
          };
          
          // Dismiss loading snackbar
          loadingSnackBar.dismiss();
          this.isLoadingBill.set(false);
          
          // Open bill modal
          this.dialog.open(BillModalComponent, {
            width: '650px',
            maxHeight: '90vh',
            data: { orderData },
          });
        } catch (error: any) {
          console.error('Failed to load bill:', error);
          loadingSnackBar.dismiss();
          this.isLoadingBill.set(false);
          this.snackBar.open('Failed to load bill', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        loadingSnackBar.dismiss();
        this.isLoadingBill.set(false);
        this.snackBar.open('Failed to load cart data', 'Close', { duration: 3000 });
      },
    });
  }
}
