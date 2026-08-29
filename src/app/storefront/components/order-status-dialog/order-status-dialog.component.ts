import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';
import { PublicOrderStatusItem } from '../../data-access/storefront.models';

// Full view of the table's live order, opened from OrderStatusFabComponent.
// Replaces the old always-visible inline banner — a floating, badge-driven
// FAB is a better fit for "someone else at the table just added something"
// than a card that scrolls out of view with the rest of the page.
@Component({
  selector: 'app-storefront-order-status-dialog',
  standalone: true,
  imports: [CurrencyPipe, MatDialogModule, MatIconModule],
  templateUrl: './order-status-dialog.component.html',
})
export class OrderStatusDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<OrderStatusDialogComponent>);
  protected readonly store = inject(StorefrontStore);

  close(): void {
    this.dialogRef.close();
  }

  optionsSummary(item: PublicOrderStatusItem): string {
    return (item.options || [])
      .map((o) => (o.quantity > 1 ? `${o.name} ×${o.quantity}` : o.name))
      .join(', ');
  }

  // The backend returns a plain-English `statusLabel` alongside the raw
  // `category` enum — using that directly would bypass i18n entirely (it's
  // server-generated text, not template markup), so this maps the stable
  // enum to a $localize'd string here instead, the same way as
  // ProductDetailSheetComponent#groupBadgeLabel.
  categoryLabel(category: string | undefined): string {
    switch (category) {
      case 'New':
        return $localize`:@@storefront.orderStatus.new:Order received`;
      case 'Processing':
        return $localize`:@@storefront.orderStatus.processing:Preparing your order`;
      case 'Ready':
        return $localize`:@@storefront.orderStatus.ready:Ready — your server will bring it out`;
      case 'Complete':
        return $localize`:@@storefront.orderStatus.complete:Complete`;
      case 'Cancel':
        return $localize`:@@storefront.orderStatus.cancel:Cancelled`;
      default:
        return category || '';
    }
  }
}
