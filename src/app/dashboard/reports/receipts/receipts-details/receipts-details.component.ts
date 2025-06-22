import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../shared/services/orders.service';


@Component({
  selector: 'receipts-details',
  templateUrl: './receipts-details.component.html',
  styleUrl: './receipts-details.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class ReceiptsDetailsComponent {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  orderResource = rxResource({
    params: () => ({
      id: this.route.snapshot.paramMap.get('id')
    }),
    stream: ({ params }) => this.orderService.getOrder(params.id!)
  });

  getProductSubtotal(item: any, currency: string): string {
    const base = (item.price || 0) * (item.quantity || 0);
    const optionsTotal = (item.options || []).reduce(
      (sum: number, o: any) => sum + ((o.price || 0) * (o.quantity || 0)),
      0
    );
    // Use Angular's currency pipe programmatically if needed, or just return the number and let the template pipe it
    return (base + optionsTotal).toLocaleString(undefined, { style: 'currency', currency: currency || 'NGN', currencyDisplay: 'symbol' });
  }
}
