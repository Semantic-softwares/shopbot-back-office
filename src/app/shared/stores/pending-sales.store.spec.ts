import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { PendingSale } from '../models/pending-sale.model';
import { AuthService } from '../services/auth.service';
import { PENDING_SALES_STORAGE_KEY, PendingSalesStore } from './pending-sales.store';
import { StoreStore } from './store.store';

const sale = (id: string, over: Partial<PendingSale> = {}): PendingSale => ({
  id,
  storeId: 's1',
  staffId: 'u1',
  cart: { _id: `cart-${id}`, products: [{ _id: 'p1', name: 'Burger', price: 10, quantity: 1 } as any], quantity: 1, active: true },
  table: null,
  customer: null,
  guest: null,
  itemCount: 1,
  total: 10,
  createdAt: 1000,
  ...over,
});

describe('PendingSalesStore', () => {
  let user$: BehaviorSubject<any>;
  const selectedStore = signal<any>({ _id: 's1' });

  function create(): InstanceType<typeof PendingSalesStore> {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: user$.asObservable() } },
        { provide: StoreStore, useValue: { selectedStore } },
      ],
    });
    return TestBed.inject(PendingSalesStore);
  }

  beforeEach(() => {
    localStorage.removeItem(PENDING_SALES_STORAGE_KEY);
    user$ = new BehaviorSubject<any>({ _id: 'u1' });
    selectedStore.set({ _id: 's1' });
  });

  it('writes to localStorage when a sale is added, and removes the key when the list empties', () => {
    const store = create();
    store.add(sale('a'));
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem(PENDING_SALES_STORAGE_KEY)!).length).toBe(1);

    store.remove('a');
    TestBed.tick();
    expect(localStorage.getItem(PENDING_SALES_STORAGE_KEY)).toBeNull();
  });

  it('restores held sales after a refresh', () => {
    localStorage.setItem(PENDING_SALES_STORAGE_KEY, JSON.stringify([sale('a'), sale('b')]));
    const store = create();
    expect(store.sales().map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('ignores corrupt or malformed storage instead of crashing', () => {
    localStorage.setItem(PENDING_SALES_STORAGE_KEY, '{not json');
    expect(create().sales()).toEqual([]);

    TestBed.resetTestingModule();
    localStorage.setItem(PENDING_SALES_STORAGE_KEY, JSON.stringify([{ id: 1 }, { nope: true }, sale('ok')]));
    expect(create().sales().map((s) => s.id)).toEqual(['ok']);
  });

  it('clears everything, in memory and in storage, when the user logs out', () => {
    const store = create();
    store.add(sale('a'));
    TestBed.tick();

    user$.next(null); // AuthService.logout()
    TestBed.tick();

    expect(store.sales()).toEqual([]);
    expect(localStorage.getItem(PENDING_SALES_STORAGE_KEY)).toBeNull();
  });

  it("never shows another cashier's held sales", () => {
    localStorage.setItem(PENDING_SALES_STORAGE_KEY, JSON.stringify([sale('mine'), sale('theirs', { staffId: 'u2' })]));
    const store = create();
    expect(store.sales().map((s) => s.id)).toEqual(['mine']);

    user$.next({ _id: 'u3' }); // a different cashier signs in on this device
    expect(store.sales()).toEqual([]);
  });

  it('lists only the current store, newest first', () => {
    const store = create();
    store.add(sale('old', { createdAt: 1 }));
    store.add(sale('new', { createdAt: 3 }));
    store.add(sale('mid', { createdAt: 2 }));
    store.add(sale('elsewhere', { storeId: 's2', createdAt: 9 }));

    expect(store.forCurrentStore().map((s) => s.id)).toEqual(['new', 'mid', 'old']);
    expect(store.count()).toBe(3);

    selectedStore.set({ _id: 's2' });
    expect(store.forCurrentStore().map((s) => s.id)).toEqual(['elsewhere']);
  });

  it('follows changes made in another tab, including a logout there', () => {
    const store = create();
    localStorage.setItem(PENDING_SALES_STORAGE_KEY, JSON.stringify([sale('from-other-tab')]));
    window.dispatchEvent(new StorageEvent('storage', { key: PENDING_SALES_STORAGE_KEY }));
    expect(store.sales().map((s) => s.id)).toEqual(['from-other-tab']);

    localStorage.clear(); // other tab logged out
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(store.sales()).toEqual([]);
  });
});
