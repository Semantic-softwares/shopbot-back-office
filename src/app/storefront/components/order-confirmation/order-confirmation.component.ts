import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';

@Component({
  selector: 'app-storefront-order-confirmation',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule],
  templateUrl: './order-confirmation.component.html',
})
export class OrderConfirmationComponent {
  protected readonly store = inject(StorefrontStore);
}
