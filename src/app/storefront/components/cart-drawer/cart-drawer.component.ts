import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StorefrontStore, unitPrice } from '../../data-access/storefront.store';
import { CartLine } from '../../data-access/storefront.models';
import { CustomerNameDialogComponent } from '../customer-name-dialog/customer-name-dialog.component';

@Component({
  selector: 'app-storefront-cart-drawer',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cart-drawer.component.html',
})
export class CartDrawerComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  protected readonly store = inject(StorefrontStore);
  private readonly dialog = inject(MatDialog);
  protected readonly unitPrice = unitPrice;

  optionsSummary(line: CartLine): string {
    return line.options.map((o) => o.optionItemName).join(', ');
  }

  placeOrder(): void {
    if (this.store.hasPromptedForName()) {
      this.store.submitOrder();
      return;
    }

    this.dialog
      .open(CustomerNameDialogComponent, { width: '380px', disableClose: true })
      .afterClosed()
      .subscribe((name: string | null) => {
        // disableClose + no skip path means this only resolves with a real,
        // trimmed name — but afterClosed() is still typed as nullable.
        if (!name) {
          return;
        }
        this.store.setCustomerName(name);
        this.store.submitOrder();
      });
  }
}
