import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';

@Component({
  selector: 'app-storefront-cart-badge',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule],
  templateUrl: './cart-badge.component.html',
})
export class CartBadgeComponent {
  @Output() open = new EventEmitter<void>();

  protected readonly store = inject(StorefrontStore);
}
