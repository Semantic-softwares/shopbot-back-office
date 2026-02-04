import {
  Component,
  input,
  output,
  computed,
  inject,
  signal,
  OnDestroy,
  Optional,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  Product,
  Option,
  User,
  OrderCategoryType,
  SalesTypeId,
  SalesChannel,
} from '../../models';
import { Guest } from '../../models/reservation.model';
import { StoreStore } from '../../stores/store.store';
import { CartStore } from '../../stores/cart.store';
import { CartService } from '../../services/cart.service';
import { GuestService } from '../../services/guest.service';
import { CheckoutSummaryComponent } from '../checkout-summary/checkout-summary.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import {
  GuestSelectionDialogComponent,
  GuestSelectionDialogData,
  GuestSelectionDialogResult,
} from '../guest-selection-dialog/guest-selection-dialog.component';
import {
  CustomerSelectionDialogComponent,
  CustomerSelectionDialogData,
  CustomerSelectionDialogResult,
} from '../customer-selection-dialog/customer-selection-dialog.component';
import {
  AddDiscountComponent,
  AddDiscountDialogResult,
} from '../add-discount/add-discount.component';
import {
  AddDeliveryComponent,
  AddDeliveryDialogResult,
} from '../add-delivery/add-delivery.component';
import {
  TableSelectionDialogComponent,
  TableSelectionDialogData,
  TableSelectionDialogResult,
} from '../table-selection-dialog/table-selection-dialog.component';
import {
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentDialogResult,
} from '../payment-dialog/payment-dialog.component';
import { TableStore } from '../../stores/table.store';
import { SalesTypeStore } from '../../stores/sale-type.store';
import { objectId, generateReference } from '../../constants/identity.constant';
import { CartSummary } from '../../../shared/models/cart.model';
import { AuthService } from '../../services/auth.service';
import { OrderStore } from '../../stores/order.store';
import { MatDividerModule } from "@angular/material/divider";

export interface CartItem {
  product: Product;
  quantity: number;
  options?: any[];
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    CheckoutSummaryComponent,
    MatDividerModule
],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnDestroy {
  private readonly storeStore = inject(StoreStore);
  private readonly accountService = inject(AuthService);
  public readonly cartStore = inject(CartStore);
  private readonly cartService = inject(CartService);
  public readonly tableStore = inject(TableStore);
  public readonly guestService = inject(GuestService);
  public readonly saleTypeStore = inject(SalesTypeStore);
  private readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);
  @Optional() private readonly bottomSheetRef = inject(MatBottomSheetRef<CartComponent>, { optional: true });
  private readonly snackBar = inject(MatSnackBar);
  private readonly orderStore = inject(OrderStore);
  private selectedUser = this.accountService.currentUserValue;
  public cartSummary = signal<CartSummary | null>(null);
  // Selected buyer state
  selectedGuest = signal<Guest | null>(null);
  selectedCustomer = signal<User | null>(null);

  // Computed for button display
  selectedBuyerName = computed(() => {
    const guest = this.selectedGuest();
    const customer = this.selectedCustomer();
    if (guest) {
      return this.guestService.getGuestName(guest);
    }
    if (customer) {
      return customer.name || customer.email || 'Customer';
    }
    return 'Buyer';
  });

  hasSelectedBuyer = computed(
    () => !!this.selectedGuest() || !!this.selectedCustomer()
  );

  buyerType = computed(() => {
    if (this.selectedGuest()) return 'guest';
    if (this.selectedCustomer()) return 'customer';
    return null;
  });

  // Inputs
  items = input<CartItem[]>([]);
  taxRate = input<number>(0);

  // Outputs
  increment = output<Product>();
  decrement = output<Product>();
  removeItem = output<string>();
  clearCart = output<void>();
  addToCart = output<Product>();

  // Computed
  currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  itemsCount = computed(() =>
    this.cartStore
      .selectedCart()
      ?.products.reduce((sum, item) => sum + item.quantity, 0)
  );

  isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  public cartItemTap(product: Product) {
    const options = product?.options as Option[];
    if (options.length > 0) {
      this.openOptions(product);
    } else {
      this.cartStore.updateCartAction('add');
    }
  }

  public openOptions(product: Product): void {
    //   this.variantStore.getProductVariants(product._id);
    //   const options: BottomSheetOptions = {
    //     viewContainerRef: this._vcRef,
    //     transparent: true,
    //     ignoreBottomSafeArea: true,
    //     context: {
    //       product: product,
    //       isEditing: true
    //     },
    //   };
    //   if (__ANDROID__) {
    //     options.peekHeight = 700;
    //   }
    //   this.viewService
    //     .showBottomSheet(ProductOptionsComponent, options)
    //     .subscribe((product) => {
    //       if (product) {
    //         this.cartStore.addToCart(
    //           this.cartStore.selectedCart()._id,
    //           product, true);
    //       }
    //     });
  }

  isEmpty = computed(() => {
    console.log('Cart products length:', this.cartStore.selectedCart());
    return (
      !this.cartStore.selectedCart() ||
      this.cartStore.selectedCart()?.products.length === 0
    );
  });

  public onAddToCart(event: Event, product: Product): void {
    event.stopPropagation();
    
    // Only call incrementProductQuantity if in bottom sheet (mobile)
    // On desktop, the parent component handles the increment via the emitted event
    if (this.bottomSheetRef) {
      this.cartStore.incrementProductQuantity(product._id);
    }
    
    this.addToCart.emit(product);
  }

  // Calculate total for a product including its selected options
  getProductTotal(product: Product): number {
    const baseTotal = product.price * product.quantity;

    if (product.options && product.options.length > 0) {
      const optionsTotal = this.cartService.getTotalForSelectedOptions(
        product.options
      );
      return baseTotal + optionsTotal * product.quantity;
    }

    return baseTotal;
  }

  public removeOrDeleteProduct(product: Product): void {
    if (product.quantity > 1) {
      this.cartStore.decrementProductQuantity(product._id);
    } else {
      this.deleteProductFromCart(product._id);
    }
  }

  private deleteProductFromCart(productId: string): void {
    this.cartStore.updateCartAction('delete');
    this.cartStore.removeFromCart(
      this.cartStore.selectedCart()!._id,
      productId
    );
  }

  // Get options summary for display
  getOptionsDisplay(product: Product): string[] {
    if (!product.options || product.options.length === 0) return [];
    const selectedOptions: string[] = [];
    product.options.forEach((variant: Option) => {
      if (variant.options) {
        variant.options.forEach((option) => {
          if (option.selected) {
            selectedOptions.push(
              `${option.name}${
                option.quantity > 1 ? ' x' + option.quantity : ''
              }`
            );
          }
        });
      }
    });
    return selectedOptions;
  }

  // Methods
  onIncrement(product: Product): void {
    this.increment.emit(product);
  }

  onDecrement(product: Product): void {
    this.decrement.emit(product);
  }

  public onRemoveItem(productId: string): void {
    this.deleteProductFromCart(productId);
    this.removeItem.emit(productId);
  }

  private resetSalesSection(): void {
    this.cartStore.removeSelectedCart();
    this.saleTypeStore.setDefaultSaleType();
    this.tableStore.clearSelectedTable();
    this.selectedCustomer.set(null);
    this.selectedGuest.set(null);
    this.clearCart.emit();
  }

  public cancelSales(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancel Sale',
        message:
          'Are you sure you want to cancel this sale? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.snackBar.open('Sale cancelled', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        this.resetSalesSection();
      }
    });
  }

  ngOnDestroy(): void {
    // Only reset cart on desktop when component is destroyed
    // On mobile (in bottom sheet), preserve cart so user can continue shopping
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    
    if (!isMobile && !this.bottomSheetRef) {
      this.resetSalesSection();
    }
  }

  // Close cart bottom sheet (mobile)
  closeCart(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    }
  }

  // Cart action buttons
  onSelectCustomer(): void {
    this.openCustomerSelectionDialog();
  }

  onSelectTable(): void {
    const dialogData: TableSelectionDialogData = {
      selectedTable: this.tableStore.selectedTable(),
    };

    const dialogRef = this.dialog.open(TableSelectionDialogComponent, {
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: TableSelectionDialogResult | undefined) => {
        if (result) {
          if (result.action === 'select' && result.table) {
            this.tableStore.selectTable(result.table._id);
            this.snackBar.open(
              `Table "${result.table.name}" selected`,
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              }
            );
          } else if (result.action === 'remove') {
            this.tableStore.clearSelectedTable();
            this.snackBar.open('Table selection removed', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
          }
        }
      });
  }

  onSelectOrderType(): void {
    // TODO: Open order type selection dialog
    console.log('Select order type');
  }

  onSelectGuest(): void {
    this.openGuestSelectionDialog();
  }

  public openCustomerSelectionDialog(): void {
    const dialogData: CustomerSelectionDialogData = {
      selectedCustomer: this.selectedCustomer(),
    };

    const dialogRef = this.dialog.open(CustomerSelectionDialogComponent, {
      width: '500px',
      maxHeight: '80vh',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: CustomerSelectionDialogResult | undefined) => {
        if (result) {
          if (result.action === 'select' && result.customer) {
            // Clear guest if customer is selected
            this.selectedGuest.set(null);
            this.selectedCustomer.set(result.customer);

            // Update cart with customer ID
            const selectedCart = this.cartStore.selectedCart();
            if (selectedCart) {
              this.cartStore.updateCartUser(
                selectedCart._id,
                result.customer._id
              );
            }

            this.snackBar.open(
              `Customer "${
                result.customer.name || result.customer.email
              }" selected`,
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              }
            );
          } else if (result.action === 'remove') {
            this.selectedCustomer.set(null);

            // Clear user from cart
            const selectedCart = this.cartStore.selectedCart();
            if (selectedCart) {
              this.cartStore.updateCartUser(selectedCart._id, '');
            }

            this.snackBar.open('Customer removed', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
          }
        }
      });
  }

  public openGuestSelectionDialog(): void {
    const dialogData: GuestSelectionDialogData = {
      selectedGuest: this.selectedGuest(),
    };

    const dialogRef = this.dialog.open(GuestSelectionDialogComponent, {
      width: '500px',
      maxHeight: '80vh',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: GuestSelectionDialogResult | undefined) => {
        if (result) {
          if (result.action === 'select' && result.guest) {
            // Clear customer if guest is selected
            this.selectedCustomer.set(null);
            this.selectedGuest.set(result.guest);
            this.snackBar.open(
              `Guest "${this.guestService.getGuestName(
                result.guest
              )}" selected`,
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              }
            );
          } else if (result.action === 'remove') {
            this.selectedGuest.set(null);
            this.snackBar.open('Guest removed', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
          }
        }
      });
  }

  // Open buyer selection - determines whether to show guest dialog or customer dialog
  onSelectBuyer(): void {
    // If a guest is already selected, open the guest dialog
    if (this.selectedGuest()) {
      this.openGuestSelectionDialog();
    } else if (this.selectedCustomer()) {
      this.openCustomerSelectionDialog();
    }
    // Otherwise, show the menu (handled by matMenuTriggerFor in template)
  }

  // Clear all buyer selections
  clearBuyerSelection(): void {
    this.selectedGuest.set(null);
    this.selectedCustomer.set(null);
  }

  // Discount action
  onApplyDiscount(): void {
    const dialogRef = this.dialog.open(AddDiscountComponent, {
      width: '450px',
      data: {
        discount: this.cartStore.selectedCart()?.discount,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: AddDiscountDialogResult | undefined) => {
        if (result) {
          const selectedCart = this.cartStore.selectedCart();
          if (selectedCart) {
            this.cartStore.updateCartDiscount(selectedCart._id, result);

            if (result.value > 0) {
              this.snackBar.open(
                `Discount applied: ${result.discountType} - ${result.value}`,
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'center',
                  verticalPosition: 'bottom',
                }
              );
            } else {
              this.snackBar.open('Discount removed', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              });
            }
          }
        }
      });
  }

  // Delivery action
  onApplyDelivery(): void {
    const dialogRef = this.dialog.open(AddDeliveryComponent, {
      width: '450px',
      data: {
        deliveryFee: this.cartStore.selectedCart()?.delivery,
        address: '', // TODO: get address from cart if stored
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: AddDeliveryDialogResult | undefined) => {
        if (result) {
          const selectedCart = this.cartStore.selectedCart();
          if (selectedCart) {
            this.cartStore.updateCartDelivery(
              selectedCart._id,
              result.deliveryFee
            );

            if (result.deliveryFee > 0) {
              this.snackBar.open(
                `Delivery fee applied: ${result.deliveryFee}`,
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'center',
                  verticalPosition: 'bottom',
                }
              );
            } else {
              this.snackBar.open('Delivery fee removed', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              });
            }
          }
        }
      });
  }

  // Generate bill action
  onGenerateBill(): void {
    // TODO: Generate bill/receipt
    console.log('Generate bill');
  }

  // Pend order action
  public onPendOrder(): void {
    const selectedCart = this.cartStore.selectedCart();
    if (selectedCart) {
      this.cartStore.addSelectedCartToPending();
      this.cartStore.removeSelectedCart();

      this.snackBar.open('Order pending', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  public cartSummaryChange(summary: CartSummary): void {
    this.cartSummary.set(summary);
  }

  public onCheckout(): void {
    // Open payment dialog before proceeding with checkout
    const dialogData: PaymentDialogData = {
      totalAmount: this.cartSummary()?.totalCost || 0,
      currency: this.currency(),
    };

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '450px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: PaymentDialogResult | undefined) => {
        if (result) {
          if (result.action === 'confirm' && result.paymentMethod) {
            // Update cart with payment method before processing checkout
            const selectedCart = this.cartStore.selectedCart();
            if (selectedCart) {
              this.cartStore.updateSelectedCartPaymentMethod(
                result.paymentMethod as any
              );
            }
          }
          // Process checkout regardless of confirm or skip
          this.processCheckout();
        }
      });
  }

  private processCheckout(): void {
  this.saleTypeStore.setSelectedSaleType(
    this.tableStore.selectedTable() ? SalesTypeId.TABLE : SalesTypeId.QUICK,
    this.saleTypeStore.isEditing()
  );
  const selectedCart = this.cartStore.selectedCart();
  const selectedTable = this.tableStore.selectedTable();
  const selectedSaleType = this.saleTypeStore.selectedSale();
  const selectedStore = this.storeStore.selectedStore();

  // Validate required data
  if (!selectedCart) {
    this.snackBar.open('No cart selected', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
    return;
  }

  if (!selectedStore) {
    this.snackBar.open('No store selected', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
    return;
  }

  console.log('Selected sale type:', selectedSaleType!.id);
  if (!selectedSaleType) {
    this.snackBar.open('Please select a sale type', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
    return;
  }

  // Payment method is optional - can always be updated later
  this.cartStore.updateCartSummary(this.cartSummary()!);
  
  // CHECK EDITING STATE BEFORE any operations that might reset it
  const isEditingOrder = this.saleTypeStore.isEditing();
  console.log(isEditingOrder, 'is editing sale type - before processing');
  
  if (isEditingOrder) {
    const selectedOrder = this.orderStore.selectedOrder();
    if (!selectedOrder) {
      this.snackBar.open('No order selected for editing', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    // Update cart summary before sending
    const updatedCart = {
      ...selectedCart,
      cartSummary: this.cartSummary() ?? undefined,
    };

    const updates = {
      cart: updatedCart,
      storeId: selectedStore._id,
      user: this.selectedCustomer() ?? undefined,
      table: selectedTable ?? undefined,
      salesType: selectedSaleType,
      type: selectedSaleType.id,
      payment: selectedCart?.paymentMethod?.name,
      total: this.cartSummary()!.totalCost,
      subTotal: this.cartSummary()!.subtotal,
      discount: this.cartSummary()!.discount,
      tax: this.cartSummary()!.tax,
      shippingFee: this.cartSummary()!.deliveryFee,
      paymentStatus: selectedCart?.paymentMethod?.name ? 'Paid' : 'Unpaid',
      note: selectedCart?.note,
      vendorCommissionAmount: 0,
      orderInstruction: selectedCart?.note,
      staff: this.selectedUser?._id,
      category: selectedCart.paymentMethod?.name
        ? OrderCategoryType.COMPLETE
        : OrderCategoryType.PROCESSING,
      settled: selectedCart.paymentMethod?.name ? true : false,
    };

    console.log('Updating order with payload:', updates);

    this.orderStore.updateOrder$({
      orderId: selectedOrder._id,
      updates,
    });
    
    this.saleTypeStore.stopEditing();
    this.snackBar.open('Order updated successfully', 'Close', { duration: 2000 });
  } else {
    // Create new order
    this.orderStore.syncOrder$({
      _id: objectId(),
      cart: selectedCart,
      store: selectedStore,
      user: this.selectedCustomer() ?? undefined,
      table: selectedTable ?? undefined,
      guest: this.selectedGuest() ?? undefined,
      salesType: selectedSaleType,
      type: selectedSaleType.id,
      payment: selectedCart.paymentMethod?.name,
      salesChannel: SalesChannel.POINT_OF_SALE,
      total: this.cartSummary()!.totalCost,
      subTotal: this.cartSummary()!.subtotal,
      discount: this.cartSummary()!.discount,
      tax: this.cartSummary()!.tax,
      shippingFee: this.cartSummary()!.deliveryFee,
      paymentStatus: selectedCart.paymentMethod?.name ? 'Paid' : 'Unpaid',
      note: selectedCart.note,
      orderInstruction: selectedCart.note,
      createdAt: new Date(),
      synced: true,
      category: selectedCart.paymentMethod?.name
        ? OrderCategoryType.COMPLETE
        : OrderCategoryType.PROCESSING,
      settled: selectedCart.paymentMethod?.name ? true : false,
      reference: generateReference(),
      staff: this.selectedUser?._id,
      storeId: selectedStore._id,
    });
    this.snackBar.open('Order Created', 'Print', { duration: 2000 });
  }

  // Handle table sync after order creation/update
  const currentOrder = this.orderStore.selectedOrder();
  if (
    currentOrder &&
    selectedTable &&
    selectedSaleType.id === SalesTypeId.TABLE
  ) {
    this.tableStore.updateTableOrder(selectedTable._id, currentOrder);
    this.tableStore.updateTableOrderSync(selectedTable._id, {
      orderId: currentOrder._id,
    });
  }

  if (currentOrder) {
    this.orderStore.selectOrder(currentOrder);
  }
  this.resetSalesSection();
  
  // Close the bottom sheet on mobile after successful order creation/update
  if (this.bottomSheetRef) {
    this.bottomSheetRef.dismiss();
  }
}
}
