import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CartSummary } from '../models/cart.model';
import { PendingSale } from '../models/pending-sale.model';
import { objectId } from '../constants/identity.constant';
import { CartStore } from '../stores/cart.store';
import { PendingSalesStore } from '../stores/pending-sales.store';
import { SalesTypeStore } from '../stores/sale-type.store';
import { StoreStore } from '../stores/store.store';
import { TableStore } from '../stores/table.store';
import { AuthService } from './auth.service';

/**
 * Puts the sale in progress on hold and brings a held sale back. It lives in a service rather than the
 * cart component because "restore" happens from a different screen (the Pending list), and because it
 * has to coordinate four stores — cart, table, customer/guest and the pending list itself.
 */
@Injectable({ providedIn: 'root' })
export class PendingSalesService {
  private readonly pending = inject(PendingSalesStore);
  private readonly cartStore = inject(CartStore);
  private readonly tableStore = inject(TableStore);
  private readonly saleTypeStore = inject(SalesTypeStore);
  private readonly storeStore = inject(StoreStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Whether there is a real sale on screen that could be put on hold. */
  canHold(): boolean {
    const cart = this.cartStore.selectedCart();
    // Editing an existing order is an update to that order, not a new sale — nothing to hold.
    return !!cart && cart.products.length > 0 && !this.saleTypeStore.isEditing();
  }

  /**
   * Snapshots the sale in progress into the pending list and clears the till for the next customer.
   * `summary` is the live totals from the cart panel (the cart itself only records them at checkout).
   * Returns the held sale, or null when there was nothing to hold.
   */
  hold(summary: CartSummary | null): PendingSale | null {
    const user = this.auth.currentUserValue;
    const storeId = this.storeStore.selectedStore()?._id;
    const cart = this.cartStore.selectedCart();
    // No user means we are logging out: holding now would write the sale back AFTER the logout wiped storage.
    if (!user || !storeId || !cart || !this.canHold()) return null;

    const cartSummary = summary ?? cart.cartSummary;
    const sale: PendingSale = {
      id: objectId(),
      storeId,
      staffId: user._id,
      cart: { ...cart, cartSummary },
      table: this.tableStore.selectedTable(),
      customer: this.cartStore.customer(),
      guest: this.cartStore.guest(),
      itemCount: cart.products.reduce((sum, product) => sum + product.quantity, 0),
      total: cartSummary?.totalCost ?? cart.products.reduce((sum, p) => sum + p.price * p.quantity, 0),
      createdAt: Date.now(),
    };

    this.pending.add(sale);
    this.clearTill();
    return sale;
  }

  /**
   * Puts a held sale back on the till and opens the checkout. If a different sale is already in
   * progress it is held first (a swap), so nothing is ever lost by restoring.
   */
  restore(id: string): boolean {
    const sale = this.pending.sales().find((s) => s.id === id);
    if (!sale) return false;

    if (this.saleTypeStore.isEditing()) {
      this.toast($localize`Finish or cancel the order you're editing before restoring a pending sale.`);
      return false;
    }

    // Swap: park whatever is currently being rung up so it isn't overwritten.
    if (this.canHold()) this.hold(null);

    this.pending.remove(id);
    this.cartStore.restoreCart(sale.cart);
    this.cartStore.setCustomer(sale.customer);
    this.cartStore.setGuest(sale.guest);
    this.saleTypeStore.setDefaultSaleType();
    const tableKept = this.restoreTable(sale);

    void this.router.navigate(['/menu/pos/checkout']);
    this.toast(
      tableKept
        ? $localize`Pending sale restored`
        : $localize`Pending sale restored. Its table is no longer free, so it was removed from the sale.`,
    );
    return true;
  }

  /** Re-selects the sale's table only if it still exists and nobody has opened an order on it since. */
  private restoreTable(sale: PendingSale): boolean {
    this.tableStore.clearSelectedTable();
    if (!sale.table) return true;
    const table = this.tableStore.tables().find((t) => t._id === sale.table!._id);
    if (!table || table.orderId) return false;
    this.tableStore.selectTable(table._id);
    return true;
  }

  private clearTill(): void {
    this.cartStore.releaseSelectedCart();
    this.cartStore.setCustomer(null);
    this.cartStore.setGuest(null);
    this.tableStore.clearSelectedTable();
    this.saleTypeStore.setDefaultSaleType();
  }

  private toast(message: string): void {
    this.snackBar.open(message, $localize`Close`, {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
