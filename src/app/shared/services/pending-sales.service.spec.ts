import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartSummary } from '../models/cart.model';
import { CartStore } from '../stores/cart.store';
import { PENDING_SALES_STORAGE_KEY, PendingSalesStore } from '../stores/pending-sales.store';
import { SalesTypeStore } from '../stores/sale-type.store';
import { StoreStore } from '../stores/store.store';
import { TableStore } from '../stores/table.store';
import { AuthService } from './auth.service';
import { PendingSalesService } from './pending-sales.service';

const product = (id: string, qty = 1) => ({ _id: id, name: `P-${id}`, price: 10, quantity: qty, options: [] }) as any;
const summary = (totalCost: number): CartSummary => ({ totalBaseCost: totalCost, totalVariantCost: 0, subtotal: totalCost, discount: 0, tax: 0, deliveryFee: 0, totalCost });

describe('PendingSalesService', () => {
  let service: PendingSalesService;
  let cart: InstanceType<typeof CartStore>;
  let pending: InstanceType<typeof PendingSalesStore>;
  let saleType: InstanceType<typeof SalesTypeStore>;
  let router: { navigate: jasmine.Spy };
  let toast: jasmine.Spy;
  let user$: BehaviorSubject<any>;
  const tables = signal<any[]>([]);
  const selectedTable = signal<any>(null);
  const tableStore = {
    tables,
    selectedTable,
    selectTable: (id: string) => selectedTable.set(tables().find((t) => t._id === id) ?? null),
    clearSelectedTable: () => selectedTable.set(null),
  };

  beforeEach(() => {
    localStorage.removeItem(PENDING_SALES_STORAGE_KEY);
    user$ = new BehaviorSubject<any>({ _id: 'u1' });
    router = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };
    toast = jasmine.createSpy('open');
    tables.set([]);
    selectedTable.set(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: user$.asObservable(), get currentUserValue() { return user$.value; } } },
        { provide: StoreStore, useValue: { selectedStore: signal({ _id: 's1' }) } },
        { provide: TableStore, useValue: tableStore },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: { open: toast } },
      ],
    });
    service = TestBed.inject(PendingSalesService);
    cart = TestBed.inject(CartStore);
    pending = TestBed.inject(PendingSalesStore);
    saleType = TestBed.inject(SalesTypeStore);
    saleType.setDefaultSaleType();
  });

  /** Rings up `ids` on a fresh cart, the way the till does. */
  function ringUp(...ids: string[]): Cart {
    cart.createCart();
    const id = cart.selectedCart()!._id;
    ids.forEach((p) => cart.addToCart(id, product(p)));
    return cart.selectedCart()!;
  }

  describe('hold', () => {
    it('snapshots the whole sale, then clears the till', () => {
      ringUp('a', 'b');
      cart.setCustomer({ _id: 'c1', name: 'Ada' } as any);
      tables.set([{ _id: 't1', name: 'T1' }]);
      tableStore.selectTable('t1');

      const held = service.hold(summary(25))!;

      expect(held).toBeTruthy();
      expect(held.itemCount).toBe(2);
      expect(held.total).toBe(25);
      expect(held.customer?._id).toBe('c1');
      expect(held.table?._id).toBe('t1');
      expect(held.staffId).toBe('u1');
      expect(pending.sales().length).toBe(1);
      // till is clear for the next customer
      expect(cart.selectedCart()).toBeNull();
      expect(cart.customer()).toBeNull();
      expect(selectedTable()).toBeNull();
    });

    it('does nothing for an empty cart', () => {
      cart.createCart();
      expect(service.hold(null)).toBeNull();
      expect(pending.sales().length).toBe(0);
    });

    it('does not hold an order that is being edited', () => {
      ringUp('a');
      saleType.setSelectedSaleType('table', true);
      expect(service.canHold()).toBeFalse();
      expect(service.hold(null)).toBeNull();
    });

    it('does not hold once logged out (would otherwise re-save after the logout wipe)', () => {
      ringUp('a');
      user$.next(null);
      expect(service.hold(null)).toBeNull();
      expect(localStorage.getItem(PENDING_SALES_STORAGE_KEY)).toBeNull();
    });
  });

  describe('restore', () => {
    function holdOne(...ids: string[]) {
      ringUp(...ids);
      return service.hold(summary(10 * ids.length))!;
    }

    it('puts the sale, buyer and table back and opens the checkout', () => {
      tables.set([{ _id: 't1', name: 'T1' }]);
      ringUp('a', 'b');
      cart.setGuest({ _id: 'g1' } as any);
      tableStore.selectTable('t1');
      const held = service.hold(summary(20))!;

      expect(service.restore(held.id)).toBeTrue();

      expect(cart.selectedCart()!.products.map((p) => p._id)).toEqual(['a', 'b']);
      expect(cart.guest()?._id).toBe('g1');
      expect(selectedTable()?._id).toBe('t1');
      expect(pending.sales().length).toBe(0);
      expect(router.navigate).toHaveBeenCalledWith(['/menu/pos/checkout']);
    });

    it('drops a table that has since been taken, and says so', () => {
      tables.set([{ _id: 't1', name: 'T1' }]);
      ringUp('a');
      tableStore.selectTable('t1');
      const held = service.hold(null)!;

      tables.set([{ _id: 't1', name: 'T1', orderId: 'someone-elses-order' }]);
      service.restore(held.id);

      expect(selectedTable()).toBeNull();
      expect(toast.calls.mostRecent().args[0]).toContain('no longer free');
      expect(cart.selectedCart()!.products.length).toBe(1); // the items still come back
    });

    it('swaps: a sale already in progress is held, not overwritten', () => {
      const first = holdOne('a');
      ringUp('b'); // cashier starts another sale…
      service.restore(first.id); // …then restores the first

      expect(cart.selectedCart()!.products.map((p) => p._id)).toEqual(['a']);
      expect(pending.sales().map((s) => s.cart.products[0]._id)).toEqual(['b']);
    });

    it('refuses while an existing order is being edited', () => {
      const held = holdOne('a');
      saleType.setSelectedSaleType('table', true);

      expect(service.restore(held.id)).toBeFalse();
      expect(pending.sales().length).toBe(1); // untouched
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('returns false for a sale that no longer exists', () => {
      expect(service.restore('missing')).toBeFalse();
    });
  });
});
