import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TrPipe } from '../../i18n/tr.pipe';
import { SocketService } from '../../services/socket.service';

export interface OrderReadyAlert {
  orderId: string;
  tableName?: string;
  stationName?: string;
  itemsLabel?: string;
  /** Everything on the order is ready (otherwise just part of it). */
  fullyPrepared?: boolean;
  readyAt: string;
}

const SOUND_SOURCE = 'order-ready';

/**
 * Always mounted (see app.component.html). When the kitchen marks food ready for an order THIS employee placed, the server sends an
 * alert to them alone (socket, plus a push for a tab in the background); this shows it with the same repeating sound as an incoming
 * table order until they acknowledge it, so the food does not wait on the pass.
 */
@Component({
  selector: 'app-order-ready-alert',
  imports: [MatButtonModule, MatIconModule, TrPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (queue().length > 0) {
      @let alert = queue()[0];
      <div class="fixed left-1/2 top-4 z-[10000] w-[360px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-black/10" role="alert" aria-live="assertive" data-testid="order-ready-alert">
        <div class="flex items-center gap-2 bg-green-600 px-4 py-2 text-white">
          <mat-icon class="!text-lg animate-pulse">room_service</mat-icon>
          <span class="text-sm font-semibold">
            @if (alert.fullyPrepared) { <ng-container i18n>Order ready to pick up</ng-container> } @else { <ng-container i18n>Part of your order is ready</ng-container> }
          </span>
          @if (queue().length > 1) {
            <span class="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium"><ng-container i18n>+{{ queue().length - 1 }} more</ng-container></span>
          }
        </div>
        <button type="button" class="block w-full px-4 py-3 text-left hover:bg-surface-container" (click)="view(alert)" data-testid="order-ready-open">
          <p class="m-0 text-lg font-bold">{{ alert.tableName || ('Your order' | tr) }}</p>
          <p class="m-0 text-sm text-on-surface-variant">
            {{ alert.itemsLabel }}@if (alert.stationName) { · {{ alert.stationName }} }
          </p>
          <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>Tap to open the order</ng-container></p>
        </button>
        <div class="flex gap-2 border-t border-outline-variant px-4 py-3">
          <button mat-stroked-button class="!flex-1" (click)="dismiss(alert)" data-testid="order-ready-dismiss"><ng-container i18n>On my way</ng-container></button>
          <button mat-flat-button color="primary" class="!flex-1" (click)="view(alert)"><ng-container i18n>View order</ng-container></button>
        </div>
      </div>
    }
  `,
})
export class OrderReadyAlertComponent {
  private readonly socket = inject(SocketService);
  private readonly router = inject(Router);

  protected readonly queue = signal<OrderReadyAlert[]>([]);

  constructor() {
    this.socket.orderReady$.pipe(takeUntilDestroyed()).subscribe((data: OrderReadyAlert) => {
      if (!data?.orderId) return;
      // The socket and the push can both deliver the same alert: one entry per order and moment.
      this.queue.update((list) => (list.some((a) => a.orderId === data.orderId && a.readyAt === data.readyAt) ? list : [...list, data]));
    });
    effect(() => {
      if (this.queue().length > 0) this.socket.playAlertLoop(SOUND_SOURCE);
      else this.socket.stopAlertLoop(SOUND_SOURCE);
    });
    inject(DestroyRef).onDestroy(() => this.socket.stopAlertLoop(SOUND_SOURCE));
  }

  protected dismiss(alert: OrderReadyAlert): void {
    this.queue.update((list) => list.filter((a) => !(a.orderId === alert.orderId && a.readyAt === alert.readyAt)));
  }

  protected view(alert: OrderReadyAlert): void {
    this.dismiss(alert);
    this.router.navigate(['/menu/pos/orders', alert.orderId, 'details']);
  }
}
