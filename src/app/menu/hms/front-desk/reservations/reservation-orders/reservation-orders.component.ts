import { Component, input, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { inject } from '@angular/core';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-reservation-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatListModule,
    NoRecordComponent,
    RouterLink,
  ],
  templateUrl: './reservation-orders.component.html',
  styleUrl: './reservation-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ReservationOrdersComponent {
  reservation = input.required<Reservation>();
  
  private storeStore = inject(StoreStore);

  // Computed signals
  orders = computed(() => {
    const res = this.reservation();
    return (res as any)?.orders || [];
  });

  totalOrdersAmount = computed(() => {
    return this.orders().reduce((sum: number, order: any) => {
      return sum + this.getTotalAmount(order);
    }, 0);
  });

  expandedElement = signal<any>(null);

  displayedColumns: string[] = ['date', 'guest', 'amount', 'paymentStatus', 'paymentType', 'type', 'expand'];
  columnsToDisplayWithExpand = [...this.displayedColumns];

  getOrderStatusClass(status: string): string {
    if (!status || typeof status !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCustomerName(order: any): string {
    if (order.guest) {
      return `${order.guest.firstName || ''} ${order.guest.lastName || ''}`.trim();
    } else if (order.staff) {
      return order.staff.name || order.staff.firstName || 'Staff';
    } else if (order.user) {
      return order.user.name || 'Customer';
    }
    return 'N/A';
  }

  getCustomerType(order: any): string {
    if (order.guest) return 'Guest';
    if (order.staff) return 'Staff';
    if (order.user) return 'Customer';
    return 'Unknown';
  }

  getCurrencyFormat(): string {
    return this.storeStore.selectedStore()?.currency || '$';
  }

  getTotalAmount(order: any): number {
    return order.total || order.orderCalculation?.totalPrice || 0;
  }

  getPaymentStatus(order: any): string {
    return order.paymentStatus || 'pending';
  }

  getPaymentStatusClass(status: string): string {
    if (!status || typeof status !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentType(order: any): string {
    return order.payment || 'N/A';
  }

  getOrderType(order: any): string {
    return order.orderType || order.type || 'N/A';
  }

  getOrderItems(order: any): any[] {
    // Check if cart exists and has products
    if (order.cart && order.cart.products) {
      return order.cart.products;
    }
    // Fallback to items or cart.items
    return order.items || [];
  }

  getItemTotal(item: any): number {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    
    // Add options cost if available
    let optionsTotal = 0;
    if (item.options && Array.isArray(item.options)) {
      optionsTotal = item.options.reduce((sum: number, opt: any) => {
        return sum + ((opt.price || 0) * (opt.quantity || 1));
      }, 0);
    }
    
    return (price * quantity) + optionsTotal;
  }

  getItemOptions(item: any): string {
    if (!item.options || item.options.length === 0) {
      return 'No options';
    }
    return item.options
      .map((opt: any) => `${opt.name || opt.optionItemName || 'Option'} ${opt.quantity > 1 ? '×' + opt.quantity : ''}`)
      .join(', ');
  }

  toggleExpand(order: any): void {
    this.expandedElement.set(
      this.expandedElement() === order ? null : order
    );
  }
}
