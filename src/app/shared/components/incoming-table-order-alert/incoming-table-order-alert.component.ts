import { Component, DestroyRef, inject, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { OrderService } from '../../services/orders.service';

export interface IncomingTableOrder {
  orderId: string;
  tableId: string;
  tableName: string;
  itemCount: number;
  itemPreview: string[];
  createdAt: string;
  /** True when guests added to an order this employee is already serving. */
  isAddition?: boolean;
}

// Global, always-mounted (see app.component.html) queue of incoming self-order
// table alerts for this on-duty staff member. Plays a continuous sound for as
// long as at least one alert is pending — starts/stops purely off queue
// length, so stacking a second table's alert never restarts or overlaps the
// sound already playing for the first.
@Component({
  selector: 'app-incoming-table-order-alert',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './incoming-table-order-alert.component.html',
})
export class IncomingTableOrderAlertComponent {
  private readonly socketService = inject(SocketService);
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly queue = signal<IncomingTableOrder[]>([]);
  protected readonly claiming = signal(false);

  constructor() {
    this.socketService.tableNewOrder$.pipe(takeUntilDestroyed()).subscribe((data: IncomingTableOrder) => {
      if (!data?.orderId) return;
      // Dedupe on orderId + createdAt, not orderId alone: the same order can
      // legitimately alert more than once (first the new order, later "items
      // added"), and each emit carries its own timestamp. Keying on orderId
      // alone would silently swallow every follow-up addition.
      this.queue.update((list) =>
        list.some((o) => o.orderId === data.orderId && o.createdAt === data.createdAt)
          ? list
          : [...list, data],
      );
    });

    this.socketService.tableOrderClaimed$.pipe(takeUntilDestroyed()).subscribe((data: { orderId: string; staffName?: string }) => {
      this.queue.update((list) => list.filter((o) => o.orderId !== data.orderId));
    });

    effect(() => {
      if (this.queue().length > 0) {
        this.socketService.playAlertLoop();
      } else {
        this.socketService.stopAlertLoop();
      }
    });

    inject(DestroyRef).onDestroy(() => this.socketService.stopAlertLoop());
  }

  protected accept(order: IncomingTableOrder): void {
    this.claiming.set(true);
    this.orderService.claimOrder(order.orderId).subscribe({
      next: (result) => {
        this.claiming.set(false);
        // Clear every pending alert for this order, not just this one entry.
        this.queue.update((list) => list.filter((o) => o.orderId !== order.orderId));
        if (result.success) {
          this.snackBar
            .open(`You're serving ${order.tableName}`, 'View', { duration: 5000 })
            .onAction()
            .subscribe(() => this.router.navigate(['/menu/pos/orders', order.orderId, 'details']));
        } else {
          this.snackBar.open(
            result.assignedTo ? `Already taken by ${result.assignedTo}` : 'Someone else already took this table',
            'Close',
            { duration: 4000 },
          );
        }
      },
      error: () => {
        this.claiming.set(false);
        this.queue.update((list) => list.filter((o) => o.orderId !== order.orderId));
        this.snackBar.open('Could not claim this table — please check the orders list', 'Close', { duration: 4000 });
      },
    });
  }

  /**
   * For an "items added" alert the employee already owns the order, so there's
   * nothing to claim — just take them to it.
   */
  protected view(order: IncomingTableOrder): void {
    this.queue.update((list) => list.filter((o) => !(o.orderId === order.orderId && o.createdAt === order.createdAt)));
    this.router.navigate(['/menu/pos/orders', order.orderId, 'details']);
  }

  protected decline(order: IncomingTableOrder): void {
    // Purely local — this staff member passing doesn't affect anyone else's
    // ability to claim it, so there's nothing to tell the server.
    this.queue.update((list) => list.filter((o) => !(o.orderId === order.orderId && o.createdAt === order.createdAt)));
  }
}
