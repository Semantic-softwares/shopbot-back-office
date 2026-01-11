import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StoreStore } from '../../stores/store.store';
import { CartStore } from '../../stores/cart.store';
import { CartService } from '../../services/cart.service';
import { Cart, CartSummary } from '../../models';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './checkout-summary.component.html',
  styleUrl: './checkout-summary.component.scss'
})
export class CheckoutSummaryComponent {
  public readonly storeStore = inject(StoreStore);
  public cartStore = inject(CartStore);
  private cartService = inject(CartService);
  public cartSummary = output<CartSummary>();
  public cart = input<Cart>();
  public isActivity = computed(() => this.storeStore.selectedStore()?.category === '683fd24cca109bb62f6b3bd4');
  public cartTotals = computed(() => {
    const cart = this.cartStore.selectedCart() || this.cart();
    const cartSummary = this.cartService.generateCartSummary(cart!, this.storeStore.selectedStore()!);
    this.cartSummary.emit(cartSummary);
    return cartSummary;
  })


  // Inputs
  subtotal = input<number>(0);
  taxRate = input<number>(0);
  disabled = input<boolean>(true);
  checkoutLabel = input<string>('Checkout');

  // Outputs
  checkout = output<void>();

  // Computed
  currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

 


  // Methods
  onCheckout(): void {
    this.checkout.emit();
  }
}
