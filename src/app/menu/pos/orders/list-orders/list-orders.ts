import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { TableStore } from '../../../../shared/stores/table.store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentDialogResult
} from '../../../../shared/components/payment-dialog/payment-dialog.component';

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
    MatButtonToggleModule,
    MatTooltipModule
],
  templateUrl: './list-orders.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  private readonly tableStore = inject(TableStore);
  private readonly printJobService = inject(PrintJobService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);
  

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
  
  // Mobile detection using BreakpointObserver
  isMobile = signal(false);
  
  // View mode - grid default on mobile, table on desktop
  viewMode = signal<'table' | 'grid'>('table');
  
  constructor() {
    // Initialize mobile detection
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        // Set grid view on mobile, table on desktop
        if (result.matches) {
          this.viewMode.set('grid');
        }
      });
  }
  
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
      // POS sales plus self-orders (Qrcode). Combined with the staff filter
      // below — which defaults to the signed-in employee — this shows POS
      // orders alongside only the self-orders THIS employee accepted, since
      // claiming is what stamps `staff` on a self-order. Unclaimed ones stay
      // out of everyone's list.
      salesChannel: `${SalesChannel.POINT_OF_SALE},${SalesChannel.QRCODE}`
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
      // The date picker emits raw Date objects at local midnight. For a
      // single-day range (start === end) that collapses the query to one
      // exact millisecond, matching no orders. Expand to the full day.
      this.startDate.set(new Date(this.tempStartDate.setHours(0, 0, 0, 0)));
      this.endDate.set(new Date(this.tempEndDate.setHours(23, 59, 59, 999)));
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

  async printOrder(order: Order): Promise<void> {
    if (!order._id) {
      this.snackBar.open('Invalid order data', 'Close', { duration: 3000 });
      return;
    }

    const loadingSnackBar = this.snackBar.open('Sending to printer...', '', {
      duration: 0,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });

    this.printJobService.printOrder(order._id).subscribe({
      next: (response) => {
        loadingSnackBar.dismiss();
        if (response.success) {
          this.snackBar.open(response.message || 'Print job created', 'OK', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to create print job', 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        loadingSnackBar.dismiss();
        this.snackBar.open(`Print failed: ${error.error?.error || error.message}`, 'Close', { duration: 5000 });
        console.error('Print order error:', error);
      },
    });
  }

  /** Only a still-open order (a table tab, typically) can be checked out from here. */
  public canCompleteOrder(order: Order): boolean {
    return order.category === OrderCategoryType.PROCESSING;
  }

  /**
   * Checkout/complete an order directly from the list — same action as the
   * "Complete" button on a table card, just reachable without navigating to the
   * table view first. Calls the order API directly (not OrderStore.completeOrder())
   * since that method requires the order to already be in OrderStore's own local
   * `orders` list, which this page's independent rxResource doesn't populate.
   */
  public completeOrder(order: Order): void {
    if (!order._id) {
      this.snackBar.open('Invalid order data', 'Close', { duration: 3000 });
      return;
    }

    const dialogData: PaymentDialogData = {
      totalAmount: order.total || 0,
      currency: this.currency(),
      // Completing an order is a checkout, not a tab-left-open save — a real
      // payment method must be picked. Hides "Skip Payment" entirely.
      requirePayment: true,
    };

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '450px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: PaymentDialogResult | undefined) => {
      // Only a genuine "Confirm Payment" click completes the order — closing
      // via the cancel button, backdrop, or Escape leaves it untouched.
      if (!result || result.action !== 'confirm' || !result.paymentMethod) return;

      const paymentMethodName = result.paymentMethod.name;

      const updates: Partial<Order> = { category: OrderCategoryType.COMPLETE };
      if (!order.payment && paymentMethodName) {
        updates.payment = paymentMethodName;
        updates.paymentStatus = 'Paid';
      }

      this.ordersService.updateOrderComprehensive(order._id!, updates).subscribe({
        next: () => {
          // Backend's updateOrder() now auto-prints on completion itself
          // (gated by the "printAfterFinish" store setting) — no explicit
          // print call needed here.
          if (order.table?._id) {
            this.tableStore.updateTable(order.table._id, { orderId: null, order: null });
            this.tableStore.updateTableOrderSync(order.table._id, { orderId: null });
          }
          this.snackBar.open('Order completed', 'Close', { duration: 3000 });
          this.reloadData();
        },
        error: (error) => {
          this.snackBar.open('Failed to complete order', 'Close', { duration: 5000 });
          console.error('Complete order error:', error);
        },
      });
    });
  }

  /** Completed + paid orders are final — no in-place edits once a sale is closed out. */
  public canEditOrder(order: Order): boolean {
    return !(order.category === 'Complete' && order.paymentStatus === 'Paid');
  }

  public editOrder(order: Order): void {
    if (!this.canEditOrder(order)) {
      this.snackBar.open('This order is complete and paid — it can no longer be edited.', 'Close', { duration: 3000 });
      return;
    }

    if (!order.cart?._id) {
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

    this.cartService.loadCart(order.cart._id).subscribe({
      next: (cart) => {
        // Dismiss loading snackbar
        loadingSnackBar.dismiss();
        
        // Cart loaded successfully, proceed with editing
        this.orderStore.selectOrder(order);
        this.saleTypeStore.setSelectedSaleType(order.type, true);
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
}
