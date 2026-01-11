import { Component, computed, inject, signal } from '@angular/core';
import { CategoryStore } from '../../../shared/stores/category.store';
import { StoreStore } from '../../../shared/stores/store.store';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductsStore } from '../../../shared/stores/product.store';
import { CartStore } from '../../../shared/stores/cart.store';
import { SearchComponent } from "../../../shared/components/search/search.component";
import { ProductCardComponent } from "../../../shared/components/product-card/product-card.component";
import { CartComponent, CartItem } from "../../../shared/components/cart/cart.component";
import { Category, Product } from '../../../shared/models';
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'checkout',
  imports: [
    CommonModule,
    SearchComponent,
    ProductCardComponent,
    CartComponent,
    MatChipsModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  public categoryStore = inject(CategoryStore);
  public storeStore = inject(StoreStore);
  public productStore = inject(ProductsStore);
  public cartStore = inject(CartStore);
  public searchFilter: string = "";

  public searchProduct(enteredFilter: string): void {
    if (this.storeStore.selectedStore()!.useBarcodeScanner) {
      const product = this.productStore.searchByBarcode(enteredFilter);
      const cart = this.cartStore.selectedCart();
      let foundProduct = null;
      let isEditing = false;

      if (cart) {
        foundProduct = cart.products.find(
          (product) => product._id === product._id
        );
        isEditing = !!foundProduct;
      }
      if (product) {
        // this.tapProduct(product, isEditing);
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

  // Currency formatting
  private currencySymbol = computed(() => 
    this.storeStore.selectedStore()?.currency || '₦'
  );

  formatPrice(price: number): string {
    const symbol = this.currencySymbol();
    return `${symbol}${price?.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}`;
  }

  // Cart state
  cartItems = signal<CartItem[]>([]);
  taxRate = signal(0);

  // Get cart quantity for a product
  getCartQuantity(productId: string): number {
    const item = this.cartItems().find(item => item.product._id === productId);
    return item?.quantity || 0;
  }

  // addToCart(product: Product): void {
  //   const existingItem = this.cartItems().find(item => item.product._id === product._id);
    
  //   if (existingItem) {
  //     this.cartItems.update(items => 
  //       items.map(item => 
  //         item.product._id === product._id 
  //           ? { ...item, quantity: item.quantity + 1 }
  //           : item
  //       )
  //     );
  //   } else {
  //     this.cartItems.update(items => [...items, { product, quantity: 1 }]);
  //   }
  // }

  public addToCart(args: { product: Product; isEditing: boolean }): void {
    this.createCart();
    this.cartStore.addToCart(
      this.cartStore.selectedCart()!._id,
      args.product,
      args.isEditing
    );
    // setTimeout(() => {
    //   this.searchComponent.onClear();
    // }, 100);
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

  openOptionsDialog(product: Product): void {
    console.log('Open options dialog for:', product.name);
    // TODO: Implement options dialog
  }
}
