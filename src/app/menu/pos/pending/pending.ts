import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TrPipe } from '../../../shared/i18n/tr.pipe';
import { PendingSale } from '../../../shared/models/pending-sale.model';
import { GuestService } from '../../../shared/services/guest.service';
import { PendingSalesService } from '../../../shared/services/pending-sales.service';
import { PendingSalesStore } from '../../../shared/stores/pending-sales.store';
import { StoreStore } from '../../../shared/stores/store.store';

/** Most lines shown on a card before collapsing the rest into "+N more". */
const PREVIEW_LINES = 4;

@Component({
  selector: 'app-pending-sales',
  imports: [CurrencyPipe, MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, NoRecordComponent, TrPipe],
  templateUrl: './pending.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingSales {
  protected readonly store = inject(PendingSalesStore);
  private readonly service = inject(PendingSalesService);
  private readonly storeStore = inject(StoreStore);
  private readonly guestService = inject(GuestService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  // Ticks so "5 min ago" stays true while the page is open.
  private readonly now = signal(Date.now());

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected restore(sale: PendingSale): void {
    this.service.restore(sale.id);
  }

  protected remove(sale: PendingSale): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: $localize`Delete pending sale`,
          message: $localize`Delete this pending sale? Its items will be lost and this cannot be undone.`,
          confirmText: $localize`Delete`,
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.store.remove(sale.id);
        this.snackBar.open($localize`Pending sale deleted`, $localize`Close`, { duration: 3000 });
      });
  }

  protected preview(sale: PendingSale) {
    return sale.cart.products.slice(0, PREVIEW_LINES);
  }

  protected hiddenLines(sale: PendingSale): number {
    return Math.max(0, sale.cart.products.length - PREVIEW_LINES);
  }

  /** Who the sale is for, if anyone: a guest (hotel) or a customer. */
  protected buyerName(sale: PendingSale): string | null {
    if (sale.guest) return this.guestService.getGuestName(sale.guest);
    if (sale.customer) return sale.customer.name || sale.customer.email || null;
    return null;
  }

  protected age(sale: PendingSale): string {
    const minutes = Math.max(0, Math.floor((this.now() - sale.createdAt) / 60_000));
    if (minutes < 1) return $localize`Just now`;
    if (minutes < 60) return $localize`${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return $localize`${hours} h ago`;
  }
}
