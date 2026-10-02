import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { StoreStore } from '../../shared/stores/store.store';
import { RolesService } from '../../shared/services/roles.service';
import { SocketService } from '../../shared/services/socket.service';
import { StationsService } from '../../shared/services/station.service';
import { KitchenDisplayService } from '../../shared/services/kitchen-display.service';
import { KitchenOrder } from '../../shared/models/kitchen-display.model';

/**
 * "Kitchen Orders" — a normal back-office page (not the shopbot-kds kiosk
 * board) so kitchen staff can see and advance order items from their own
 * phone/tablet while logged into back-office, for when the big board isn't
 * within reach. Calls the exact same /kitchen-display API the standalone
 * shopbot-kds app uses, and shares this app's existing per-store socket
 * connection (see SocketService) rather than opening a second one.
 */
@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ToolbarComponent,
  ],
  templateUrl: './kitchen-display.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class KitchenDisplay {
  private storeStore = inject(StoreStore);
  private rolesService = inject(RolesService);
  private socketService = inject(SocketService);
  private stationsService = inject(StationsService);
  private kitchenDisplayService = inject(KitchenDisplayService);
  private snackBar = inject(MatSnackBar);

  /** 'kds.view' alone is read-only; only 'kds.manage' (or an admin) can advance items. */
  readonly canManage = computed(
    () => this.rolesService.isAdmin() || this.rolesService.hasAny(['kds.manage']),
  );

  readonly selectedStationId = signal<string>('all');

  /** Bumped by either kitchen socket event to trigger a re-fetch — see constructor. */
  private readonly refreshTick = signal(0);

  private readonly stationsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) =>
      params.storeId ? this.stationsService.getStations(params.storeId) : of([]),
  });

  readonly stations = computed(() => this.stationsResource.value() ?? []);

  private readonly ordersResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      stationId: this.selectedStationId(),
      tick: this.refreshTick(),
    }),
    stream: ({ params }) =>
      params.storeId
        ? this.kitchenDisplayService.getActiveOrders(params.storeId, params.stationId)
        : of([]),
  });

  readonly orders = computed(() => this.ordersResource.value() ?? []);
  readonly loading = computed(() => this.ordersResource.isLoading());

  readonly totalItems = computed(() =>
    this.orders().reduce((sum, order) => sum + order.items.length, 0),
  );

  /** orderIds with a PATCH in flight — disables their button so a slow tap can't double-fire. */
  private readonly updatingOrderIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // Both events are lightweight signals, not full payloads — just re-fetch
    // whatever station filter is currently selected rather than merging.
    this.socketService.kitchenOrderNew$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.refreshTick.update((n) => n + 1));

    this.socketService.kitchenItemStatusUpdated$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.refreshTick.update((n) => n + 1));
  }

  selectStation(stationId: string): void {
    this.selectedStationId.set(stationId);
  }

  isUpdating(orderId: string): boolean {
    return this.updatingOrderIds().has(orderId);
  }

  /** The order's single control — moves all of its items one step together. */
  advance(order: KitchenOrder): void {
    if (!this.canManage() || !order.nextAction || this.isUpdating(order.orderId)) return;

    const settle = () =>
      this.updatingOrderIds.update((set) => {
        const next = new Set(set);
        next.delete(order.orderId);
        return next;
      });
    this.updatingOrderIds.update((set) => new Set(set).add(order.orderId));

    this.kitchenDisplayService.advanceOrder(order.orderId, this.selectedStationId()).subscribe({
      next: () => {
        settle();
        this.ordersResource.reload();
      },
      error: (err) => {
        settle();
        this.snackBar.open(err?.error?.message || 'Failed to update the order.', 'Close', { duration: 4000 });
      },
    });
  }
}
