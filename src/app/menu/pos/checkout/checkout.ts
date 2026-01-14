import { Component, computed, inject, signal, ViewChild } from '@angular/core';
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
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
    MatSlideToggleModule,
    MatButtonModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  public categoryStore = inject(CategoryStore);
  public storeStore = inject(StoreStore);
  public productStore = inject(ProductsStore);
  public cartStore = inject(CartStore);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
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

  //  public tapProduct(product: Product, isEditing: boolean): void {
  //   const options = product?.options as Option[];
  //   if (options.length > 0) {
  //     this.openOptions(product, isEditing);
  //   } else {
  //     this.addToCart({ product, isEditing });
  //   }
  // }

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

 
  // Cart state
  cartItems = signal<CartItem[]>([]);
  taxRate = signal(0);

  // Get cart quantity for a product
  getCartQuantity(productId: string): number {
    const item = this.cartItems().find(item => item.product._id === productId);
    return item?.quantity || 0;
  }

  public addToCart(args: { product: Product; isEditing: boolean }): void {
    console.log('Adding to cart:', args.product.name, 'Editing:', args.isEditing);
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

  // Open cart in full-screen modal on mobile
  openCartModal(): void {
    const dialogRef = this.dialog.open(CartComponent, {
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
    });

    // Check if mobile and update size to full screen
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    if (isMobile) {
      dialogRef.updateSize('100vw', '100vh');
    }
  }

  openOptionsDialog(product: Product): void {
    console.log('Open options dialog for:', product.name);
    // TODO: Implement options dialog
  }
}
