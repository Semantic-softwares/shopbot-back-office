import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Product, Option } from '../../models';
import { StoreStore } from '../../stores/store.store';
import { CartStore } from '../../stores/cart.store';
import { VariantStore } from '../../stores/variant.store';
import { ProductOptionsComponent, ProductOptionsDialogData, ProductOptionsDialogResult } from '../product-options/product-options.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private storeStore = inject(StoreStore);
  private cartStore = inject(CartStore);
  private variantStore = inject(VariantStore);
  private dialog = inject(MatDialog);

  // Inputs
  product = input.required<Product>();
  cartQuantity = input<number>(0);

  // Outputs
  addToCart = output<Product>();
  increment = output<Product>();
  decrement = output<Product>();
  openOptions = output<Product>();

  // Computed
  currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  hasOptions = computed(() => {
    const prod = this.product();
    return prod.options && prod.options.length > 0;
  });

  public isProductInCart = computed(() => {
    const cart = this.cartStore.selectedCart();
    if (cart) {
      return cart.products.find(
        (product) => product._id === this.product()._id
      );
    }
    return false
  });

  public productQuantity = computed(() => {
    const cart = this.cartStore.selectedCart();
    if (cart) {
      const cartItem = cart.products.find(
        (product) => product._id === this.product()._id
      );
      return cartItem ? cartItem.quantity : 0;
    }
    return 0;
  });

  isOutOfStock = computed(() => !this.product().active);

  isLowStock = computed(() => {
    const prod = this.product();
    return prod.active && prod.qty !== undefined && prod.qty <= 5;
  });

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product());
  }


  public removeOrDeleteProduct(product: Product): void {
    if (this.productQuantity() > 1) {
      this.cartStore.decrementProductQuantity(product._id);
    } else {
      this.cartStore.updateCartAction("delete");
      this.cartStore.removeFromCart(
        this.cartStore.selectedCart()!._id,
        product._id
      );
    }
  }

  onOpenOptions(event: Event): void {
    event.stopPropagation();
    this.openProductOptionsDialog();
  }

  public openProductOptionsDialog(): void {
    this.variantStore.getProductVariants(this.product()._id);
    const cart = this.cartStore.selectedCart();
    let foundProduct: Product | null = null;
    let isEditing = false;

    if (cart) {
      foundProduct = cart.products.find(
        (product) => product._id === this.product()._id
      ) || null;
      isEditing = !!foundProduct;
    }

    const dialogData: ProductOptionsDialogData = {
      product: foundProduct || this.product(),
      isEditing,
    };
    

    const dialogRef = this.dialog.open(ProductOptionsComponent, {
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      panelClass: 'product-options-dialog-panel',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: ProductOptionsDialogResult | undefined) => {
      if (result) {
        this.cartStore.updateCartAction(isEditing ? 'edit' : 'add');
        // Ensure cart exists
        if (!this.cartStore.selectedCart()) {
          this.cartStore.createCart();
        }
        // Add to cart directly with correct isEditing flag
        this.cartStore.addToCart(
          this.cartStore.selectedCart()!._id,
          result,
          isEditing
        );
      }
    });
  }
}
