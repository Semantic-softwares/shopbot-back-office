import { Component, Input, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { StorefrontStore } from '../../data-access/storefront.store';
import { StorefrontProduct } from '../../data-access/storefront.models';
import { ProductDetailSheetComponent } from '../product-detail-sheet/product-detail-sheet.component';

@Component({
  selector: 'app-storefront-product-card',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: StorefrontProduct;
  // Matches the staff ProductCard's convention (shared/components/product-card):
  // the store's `currency` field is often a raw symbol (e.g. '₦'), not an ISO
  // code — the `currency` pipe with `'symbol'` display falls back to printing
  // it verbatim when it doesn't recognize the code, so this is safe either way.
  @Input() currency = '₦';

  protected readonly store = inject(StorefrontStore);
  private readonly bottomSheet = inject(MatBottomSheet);
  protected readonly quantity = signal(1);

  // Only real, enabled option groups count — defensive against the menu
  // aggregation's null-placeholder entries for products with zero groups
  // (fixed at the source too, but cheap to guard against here as well) and
  // against a group with no selectable items in it.
  protected readonly enabledOptionGroups = computed(() =>
    (this.product.options || []).filter((g) => g && g._id && g.enabled !== false && (g.options?.length ?? 0) > 0),
  );
  protected readonly hasOptions = computed(() => this.enabledOptionGroups().length > 0);

  // Total quantity of this product already in the cart, across every line
  // (a product can have multiple lines when different option selections were
  // added separately) — shown as a badge so customers can see what they've
  // already ordered without opening the cart drawer.
  protected readonly cartQuantity = computed(() =>
    this.store.cart().reduce((sum, line) => (line.productId === this.product._id ? sum + line.quantity : sum), 0),
  );

  increment(event: Event): void {
    event.stopPropagation();
    this.quantity.update((qty) => qty + 1);
  }

  decrement(event: Event): void {
    event.stopPropagation();
    this.quantity.update((qty) => Math.max(1, qty - 1));
  }

  add(event: Event): void {
    event.stopPropagation();
    this.store.addToCart(this.product, this.quantity());
    this.quantity.set(1);
  }

  openDetails(): void {
    this.bottomSheet.open(ProductDetailSheetComponent, {
      data: {
        product: { ...this.product, options: this.enabledOptionGroups() },
        currency: this.currency,
      },
      panelClass: 'storefront-bottom-sheet',
    });
  }
}
