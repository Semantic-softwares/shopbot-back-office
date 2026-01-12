import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { CartService } from '../../../../shared/services/cart.service';
import { OrdersService } from '../../../../shared/services/order.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { PrintJobService } from '../../../../shared/services/print-job.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { Order, OrderCategoryType, SalesChannel } from '../../../../shared/models';
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { CartStore } from '../../../../shared/stores/cart.store';
import { OrderStore } from '../../../../shared/stores/order.store';
import { SalesTypeStore } from '../../../../shared/stores/sale-type.store';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-list-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatPaginatorModule,
    PageHeaderComponent,
    NoRecordComponent,
    MatButtonToggleModule
],
  templateUrl: './list-orders.html',
  styleUrl: './list-orders.scss',
})
export class ListOrders {
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);
  private readonly storeStore = inject(StoreStore);
  private readonly cartStore = inject(CartStore);
  private readonly cartService = inject(CartService);
  private readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly saleTypeStore = inject(SalesTypeStore);
  private readonly printJobService = inject(PrintJobService);
  private readonly snackBar = inject(MatSnackBar);
  

  // Filter signals
  searchQuery = signal('');
  statusFilter = signal<OrderCategoryType | ''>('');
  paymentFilter = signal('');
  staffFilter = signal(this.authService.currentUserValue?._id || '');
  startDate = signal<Date | null>(new Date(new Date().setHours(0, 0, 0, 0)));
  endDate = signal<Date | null>(new Date(new Date().setHours(23, 59, 59, 999)));
  
  // Temporary date storage (not signals to avoid triggering updates)
  private tempStartDate: Date | null = null;
  private tempEndDate: Date | null = null;
  
  viewMode = signal<'table' | 'grid'>('table');
  
  // Pagination signals
  pageSize = signal(15);
  pageIndex = signal(0);
  totalOrders = signal(0);

  // Table columns
  displayedColumns = ['reference', 'total', 'status', 'payment', 'paymentStatus', 'location', 'date', 'actions'];

  // Computed filter params for rxResource
  filterParams = computed(() => {
    const params: any = {
      storeId: this.storeStore.selectedStore()?._id,
      limit: this.pageSize(),
      skip: this.pageIndex() * this.pageSize(),
      salesChannel: SalesChannel.POINT_OF_SALE
    };

    if (this.statusFilter()) {
      params.status = this.statusFilter();
    }
    if (this.paymentFilter()) {
      params.payment = this.paymentFilter();
    }
    if (this.staffFilter()) {
      params.staff = this.staffFilter();
    }
    // Only include date range when BOTH dates are selected
    const start = this.startDate();
    const end = this.endDate();
    if (start && end) {
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    }

    return params;
  });

  // Orders resource with rxResource
  ordersResource = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) => {
      if (!params.storeId) {
        throw new Error('Store not selected');
      }
      return this.ordersService.getStoreOrders(params.storeId, params);
    }
  });

  // Computed filtered orders for client-side search
  filteredOrders = computed(() => {
    const orders = this.ordersResource.value() || [];
    const query = this.searchQuery().toLowerCase();

    if (!query) return orders;

    return orders.filter(order => 
      order.reference?.toLowerCase().includes(query) ||
      order.user?.name?.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query)
    );
  });

  currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  // Order status options
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: OrderCategoryType.PROCESSING, label: 'Processing' },
    { value: OrderCategoryType.READY, label: 'Ready' },
    { value: OrderCategoryType.COMPLETE, label: 'Complete' },
    { value: OrderCategoryType.CANCEL, label: 'Cancelled' }
  ];

  // Payment options
  paymentOptions = [
    { value: '', label: 'All Payments' },
    { value: 'Cash', label: 'Cash' },
    { value: 'POS Terminal', label: 'POS Terminal' },
    { value: 'Pay Online', label: 'Pay Online' }
  ];

  reloadData(): void {
    this.ordersResource.reload();
  }

  startNewSale(): void {
    this.router.navigate(['/menu/pos/checkout']);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.paymentFilter.set('');
    this.staffFilter.set(this.authService.currentUserValue?._id || '');
    this.startDate.set(null);
    this.endDate.set(null);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onStartDateChange(date: Date | null): void {
    this.tempStartDate = date;
  }

  onEndDateChange(date: Date | null): void {
    this.tempEndDate = date;
  }

  onDateRangeClosed(): void {
    // Only update signals if both dates are selected
    if (this.tempStartDate && this.tempEndDate) {
      this.startDate.set(this.tempStartDate);
      this.endDate.set(this.tempEndDate);
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      [OrderCategoryType.PROCESSING]: 'bg-blue-100 text-blue-800',
      [OrderCategoryType.READY]: 'bg-purple-100 text-purple-800',
      [OrderCategoryType.COMPLETE]: 'bg-green-100 text-green-800',
      [OrderCategoryType.CANCEL]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentStatusColor(status: string): string {
    return status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  }

  getLocationInfo(order: Order): string {
    if (order.table) {
      return `Table: ${order.table.name}`;
    }
    if (order.shippingFee && order.shippingFee > 0) {
      return 'Delivery';
    }
    return 'Quick Sale';
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/menu/pos/orders', order._id, 'details']);
  }

  printOrder(order: Order): void {
    console.log('Print order:', order);
    
    if (!order._id) {
      this.snackBar.open('Invalid order data', 'Close', { duration: 3000 });
      console.error('Invalid order data');
      return;
    }

    // For printing, we use the order object directly but ensure it has the store currency
    const orderWithCurrency = {
      ...order,
      store: {
        ...order.store,
        currency: this.storeStore.selectedStore()?.currency || order.store?.currency || 'NGN'
      }
    };
    
    this.sendToPrintJob(order._id, orderWithCurrency);
  }

  private sendToPrintJob(orderId: string, orderData: any): void {
    this.printJobService.createPrintJobsForOrder(orderId, orderData).subscribe({
      next: (response) => {
        console.log('Print jobs created:', response);
        this.snackBar.open(`${response.jobs.length} print job(s) created successfully`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Failed to create print jobs', 'Close', { duration: 3000 });
        console.error('Error creating print jobs:', error);
      }
    });
  }

  
  public editOrder(order: Order): void {
    console.log('Editing order:', order);
    
    if (!order.cart?._id) {
      console.error('Invalid cart data');
      return;
    }

    // Check if carts are loaded in the store
    const carts = this.cartStore.carts();
    
    if (carts.length > 0) {
      // Carts are loaded, try to select from store
      this.cartStore.selectCart(order.cart._id);
      const selectedCart = this.cartStore.selectedCart();
      
      if (selectedCart) {
        // Cart found in store, proceed with editing
        console.log('Using cart from store:', selectedCart);
        this.orderStore.selectOrder(order);
         this.saleTypeStore.setSelectedSaleType(order.type, true)
        this.saleTypeStore.startEditing();
        this.router.navigate(['/menu/pos/checkout']);
        return;
      }
    }
    
    // Carts are empty or cart not found in store, fetch from backend
    this.cartService.getCartByIdRestructured(order.cart._id).subscribe({
      next: (restructuredCart) => {        
        // Add the cart to the store's carts array
        const updatedCarts = [...this.cartStore.carts(), restructuredCart];
        this.cartStore.updateCarts(updatedCarts);
        this.cartStore.setCart(restructuredCart);
        
        this.orderStore.selectOrder(order);
        this.saleTypeStore.setSelectedSaleType(order.type, true);
        this.saleTypeStore.startEditing();
        this.router.navigate(['/menu/pos/checkout']);
      },
      error: (error) => {
         this.saleTypeStore.stopEditing()
        console.error('Error fetching cart:', error);
      }
    });
  }
}
