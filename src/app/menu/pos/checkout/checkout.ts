import { Component, computed, HostListener, inject, OnInit, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CategoryStore } from '../../../shared/stores/category.store';
import { StoreStore } from '../../../shared/stores/store.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsStore } from '../../../shared/stores/product.store';
import { CartStore } from '../../../shared/stores/cart.store';
import { SearchComponent } from "../../../shared/components/search/search.component";
import { ProductCardComponent } from "../../../shared/components/product-card/product-card.component";
import { CartComponent, CartItem } from "../../../shared/components/cart/cart.component";
import { Category, Product, Option } from '../../../shared/models';
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatBottomSheet, MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CartService } from '../../../shared/services/cart.service';
import { TrPipe } from '../../../shared/i18n/tr.pipe';

@Component({
  selector: 'checkout',
  imports: [
    CommonModule,
    FormsModule,
    SearchComponent,
    ProductCardComponent,
    CartComponent,
    MatChipsModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatButtonModule,
    MatBottomSheetModule,
    TrPipe,
  ],
  templateUrl: './checkout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  public categoryStore = inject(CategoryStore);
  public storeStore = inject(StoreStore);
  public productStore = inject(ProductsStore);
  public cartStore = inject(CartStore);
  private bottomSheet = inject(MatBottomSheet);
  private cartService = inject(CartService);
  private breakpointObserver = inject(BreakpointObserver);

  public isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  /** Don't hammer the API when someone flips between tabs quickly. */
  private static readonly REFRESH_MIN_INTERVAL_MS = 30_000;
  private lastCatalogRefresh = 0;

  ngOnInit(): void {
    // Products and categories are loaded once for the whole app, so prices or categories edited in the
    // ERP (or on another device) would otherwise never reach the POS. Pull fresh data every time the
    // POS opens…
    this.refreshCatalog(true);
  }

  // …and when the cashier comes back to this tab after being away.
  @HostListener('document:visibilitychange')
  protected onVisibilityChange(): void {
    if (document.visibilityState === 'visible') this.refreshCatalog(false);
  }

  private refreshCatalog(force: boolean): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || this.productStore.isLoading() || this.categoryStore.isLoading()) return; // first load is already in flight
    const now = Date.now();
    if (!force && now - this.lastCatalogRefresh < Checkout.REFRESH_MIN_INTERVAL_MS) return;
    this.lastCatalogRefresh = now;
    this.productStore.refreshStoreProducts(storeId);
    this.categoryStore.refreshCategories$(storeId);
  }

  public searchFilter: string = "";
  @ViewChild("searchComponent") searchComponent!: SearchComponent;

  public searchProduct(enteredFilter: string): void {
    if (this.storeStore.selectedStore()?.posSettings?.useBarcodeScanner) {
      const product = this.productStore.searchByBarcode(enteredFilter);
      const cart = this.cartStore.selectedCart();
      let foundProduct = null;
      let isEditing = false;

      if (cart && product) {
        foundProduct = cart.products.find(
          (cartItem) => cartItem._id === product._id
        );
        isEditing = !!foundProduct;
        console.log('Barcode scan found product:', product.name, 'Editing:', isEditing);
      }
      if (product) {
        this.addToCart({ product, isEditing });
      }
    } else {
      this.productStore.updateSearchQuery(enteredFilter);
    }
  }


  public selectCategory(item: Category): void {
    this.categoryStore.selectCategory(item);
  }

  public clearSearch(): void {
    this.productStore.clearSearchQuery();
  }

  public toggleBarcodeScanner(enabled: boolean): void {
    const store = this.storeStore.selectedStore();
    if (store) {
      this.storeStore.updateStore$({
        posSettings: {
          ...store.posSettings,
          useBarcodeScanner: enabled
        }
      });
    }
  }

  // Currency formatting
  private currencySymbol = computed(() => 
    this.storeStore.selectedStore()?.currency || '₦'
  );

 
  /** What the sticky "View cart" bar (phones and small tablets) shows: line count and the amount due. */
  public cartCount = computed(() =>
    this.cartStore.selectedCart()?.products.reduce((sum, p) => sum + p.quantity, 0) ?? 0
  );
  public cartTotal = computed(() => {
    const cart = this.cartStore.selectedCart();
    const store = this.storeStore.selectedStore();
    return cart && store ? this.cartService.generateCartSummary(cart, store).totalCost : 0;
  });
  public currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  // Cart state
  cartItems = signal<CartItem[]>([]);
  taxRate = signal(0);

  // Get cart quantity for a product
  getCartQuantity(productId: string): number {
    const item = this.cartItems().find(item => item.product._id === productId);
    return item?.quantity || 0;
  }

  public addToCart(args: { product: Product; isEditing: boolean }): void {
    console.log(args.product, 'added to cart. Editing:', args.isEditing);
    this.createCart();
    this.cartStore.addToCart(
      this.cartStore.selectedCart()!._id,
      args.product,
      args.isEditing
    );
    this.searchComponent.clearFilter();
  }

   private createCart(): void {
    if (!this.cartStore.selectedCart()) {
      this.cartStore.createCart();
    }
  }

  incrementQuantity(product: Product): void {
    // Check stock limit
    if (product.qty !== undefined) {
      const currentQty = this.getCartQuantity(product._id!);
      if (currentQty >= product.qty) return;
    }
    
    this.cartItems.update(items => 
      items.map(item => 
        item.product._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  

  decrementQuantity(product: Product): void {
    const currentQty = this.getCartQuantity(product._id!);
    
    if (currentQty <= 1) {
      this.removeFromCart(product._id!);
    } else {
      this.cartItems.update(items => 
        items.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    }
  }

  removeFromCart(productId: string): void {
    this.cartItems.update(items => 
      items.filter(item => item.product._id !== productId)
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  checkout(): void {
    console.log('Checkout:', this.cartItems());
    // TODO: Implement checkout flow
  }

  // Open cart in bottom sheet on mobile
  openCartModal(): void {
    this.bottomSheet.open(CartComponent, {
      panelClass: 'cart-bottom-sheet',
      // A stray tap outside must not dismiss the cart mid-sale; it closes with its own X button.
      disableClose: true,
    });
  }

  openOptionsDialog(product: Product): void {
    console.log('Open options dialog for:', product.name);
    // TODO: Implement options dialog
  }
}
