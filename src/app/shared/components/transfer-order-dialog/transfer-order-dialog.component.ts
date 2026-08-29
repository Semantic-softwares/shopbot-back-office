import { Component, computed, inject, linkedSignal, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrderService, transferFailureMessage } from '../../services/orders.service';
import { StoreStore } from '../../stores/store.store';
import { Table } from '../../models';
import {
  TableSelectionDialogComponent,
  TableSelectionDialogData,
  TableSelectionDialogResult,
} from '../table-selection-dialog/table-selection-dialog.component';

export interface TransferOrderDialogData {
  orderId: string;
  /** The table the order is currently on — shown in the header and excluded from the picker. */
  fromTable: Table;
}

export interface TransferOrderDialogResult {
  transferred: true;
  type: 'full' | 'partial';
  toTableName: string;
}

/** One cart line, with how much of it the operator has chosen to move. */
interface TransferLine {
  productId: string;
  name: string;
  price: number;
  available: number;
  selected: number;
}

@Component({
  selector: 'app-transfer-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './transfer-order-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TransferOrderDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TransferOrderDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly orderService = inject(OrderService);
  private readonly storeStore = inject(StoreStore);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data = inject<TransferOrderDialogData>(MAT_DIALOG_DATA);

  protected readonly currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');
  protected readonly mode = signal<'full' | 'partial'>('full');
  protected readonly destination = signal<Table | null>(null);
  protected readonly submitting = signal(false);

  // The table card's populated order doesn't include cart products, so fetch
  // the order itself — its `cart` populate carries the raw lines, which is
  // also exactly the shape (productId + quantity) the transfer API takes.
  protected readonly orderResource = rxResource({
    params: () => ({ orderId: this.data.orderId }),
    stream: ({ params }) => this.orderService.getOrder(params.orderId),
  });

  /**
   * The pickable lines, rebuilt whenever the order loads. Nothing is
   * pre-selected — moving items is opt-in, so a mis-tap can never silently
   * move a whole table's worth of food.
   */
  protected readonly lines = linkedSignal<any, TransferLine[]>({
    source: () => this.orderResource.value(),
    computation: (order) =>
      (order?.cart?.products || []).map((p: any) => ({
        productId: this.productKey(p),
        name: p.name,
        price: p.price || 0,
        available: p.quantity || 1,
        selected: 0,
      })),
  });

  /** Cart lines store productId as a string, but a populated call site hands back a Food doc. */
  private productKey(product: any): string {
    const raw = product?.productId ?? product?._id;
    return raw && typeof raw === 'object' ? String(raw._id || raw) : String(raw);
  }

  protected readonly selectedLines = computed(() =>
    this.lines().filter((l) => l.selected > 0),
  );

  protected readonly selectedTotal = computed(() =>
    this.selectedLines().reduce((sum, l) => sum + l.price * l.selected, 0),
  );

  protected readonly orderTotal = computed(() => this.orderResource.value()?.total || 0);

  /** True once every line is selected in full — that's a whole-order move, not a partial. */
  protected readonly movesEverything = computed(() => {
    const lines = this.lines();
    return lines.length > 0 && lines.every((l) => l.selected >= l.available);
  });

  protected readonly canSubmit = computed(() => {
    if (this.submitting() || !this.destination()) return false;
    return this.mode() === 'full' || this.selectedLines().length > 0;
  });

  /** The picker allows occupied tables only for item transfers — a whole order onto an occupied table is a merge. */
  protected readonly pickerMode = computed<'free-only' | 'any'>(() =>
    this.mode() === 'partial' && !this.movesEverything() ? 'any' : 'free-only',
  );

  protected adjust(productId: string, delta: number): void {
    const next = this.lines().map((line) =>
      line.productId === productId
        ? { ...line, selected: Math.min(line.available, Math.max(0, line.selected + delta)) }
        : line,
    );
    this.lines.set(next);

    // Selecting everything is a whole-order move — a destination that's only
    // valid for item transfer (occupied) would now be rejected by the server,
    // so drop it rather than let the operator submit something that can't work.
    if (this.movesEverything() && this.destination()?.orderId) {
      this.destination.set(null);
    }
  }

  protected onModeChange(mode: 'full' | 'partial'): void {
    this.mode.set(mode);
    if (mode === 'full' && this.destination()?.orderId) {
      this.destination.set(null);
    }
  }

  protected chooseTable(): void {
    const data: TableSelectionDialogData = {
      mode: this.pickerMode(),
      excludeTableId: this.data.fromTable._id,
      title: 'Move to which table?',
    };

    this.dialog
      .open(TableSelectionDialogComponent, { width: '720px', maxHeight: '90vh', data })
      .afterClosed()
      .subscribe((result: TableSelectionDialogResult | undefined) => {
        if (result?.action === 'select' && result.table) {
          this.destination.set(result.table);
        }
      });
  }

  protected transfer(): void {
    const toTable = this.destination();
    if (!toTable) return;

    const movingItems = this.mode() === 'partial' && !this.movesEverything();
    const payload = movingItems
      ? {
          toTableId: toTable._id,
          items: this.selectedLines().map((l) => ({ productId: l.productId, quantity: l.selected })),
        }
      : { toTableId: toTable._id };

    this.submitting.set(true);
    this.orderService.transferOrder(this.data.orderId, payload).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.dialogRef.close({
          transferred: true,
          type: result.type ?? (movingItems ? 'partial' : 'full'),
          toTableName: toTable.name,
        } satisfies TransferOrderDialogResult);
      },
      error: (error) => {
        this.submitting.set(false);
        // The backend puts its reason code in the error body; anything else
        // falls back to a generic message rather than surfacing a raw 500.
        const reason = error?.error?.reason;
        this.snackBar.open(transferFailureMessage(reason, toTable.name), 'Close', { duration: 6000 });

        // Someone else took the table while this dialog was open — clear the
        // stale choice so the operator has to pick a table that still exists.
        if (reason === 'destination_occupied' || reason === 'destination_locked') {
          this.destination.set(null);
        }
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
