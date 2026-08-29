import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { StorefrontApiService } from './storefront-api.service';
import {
  CartLine,
  CartLineOption,
  PublicOrderStatus,
  StorefrontMenuSection,
  StorefrontProduct,
  StorefrontStoreInfo,
  StorefrontTable,
  SubmitOrderResult,
} from './storefront.models';

type StorefrontState = {
  storeInfo: StorefrontStoreInfo | null;
  table: StorefrontTable | null;
  qrToken: string | null;
  menu: StorefrontMenuSection[];
  cart: CartLine[];
  isLoading: boolean;
  loadError: string | null;
  submitting: boolean;
  submitError: string | null;
  lastOrderResult: SubmitOrderResult | null;
  // Captured once, client-side, via a "tell us your name?" prompt before the
  // first order at a table — never re-asked for the rest of the session.
  customerName: string | null;
  hasPromptedForName: boolean;
  // The table's live order — distinct from lastOrderResult, which is just the
  // one-shot "just placed" flash. Populated on load and kept fresh by
  // StorefrontSocketService's push (see SelfOrderStatusGateway on the backend).
  orderStatus: PublicOrderStatus | null;
  // High-water mark for the order-status FAB's "someone else added something"
  // badge/chime — advances when the guest opens the order modal, or when an
  // incoming update is this device's own submission (see expectingOwnOrderUpdate).
  lastSeenOrderUpdatedAt: string | null;
  // Set right when this device's own submitOrder() succeeds, so the socket
  // echo of that same change (which typically arrives before the REST
  // refresh below even resolves, since the gateway emits from inside the
  // same request handler) doesn't get mistaken for someone else's addition.
  expectingOwnOrderUpdate: boolean;
};

const initialState: StorefrontState = {
  storeInfo: null,
  table: null,
  qrToken: null,
  menu: [],
  cart: [],
  isLoading: false,
  loadError: null,
  submitting: false,
  submitError: null,
  lastOrderResult: null,
  customerName: null,
  hasPromptedForName: false,
  orderStatus: null,
  lastSeenOrderUpdatedAt: null,
  expectingOwnOrderUpdate: false,
};

export function unitPrice(line: CartLine): number {
  const optionsTotal = line.options.reduce((sum, o) => sum + o.price * o.quantity, 0);
  return line.price + optionsTotal;
}

let lineIdCounter = 0;
function nextLineId(): string {
  lineIdCounter += 1;
  return `line-${Date.now()}-${lineIdCounter}`;
}

// Every theme reads exclusively from this store's signals — no theme ever
// fetches its own data, so switching themes never risks divergent
// data-fetching bugs (see the plan's theme-registry design).
export const StorefrontStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ storeInfo, table, cart, orderStatus, lastSeenOrderUpdatedAt }) => ({
    // The backend hardcodes self-order submissions to `type: 'table'` — there's
    // no checkout path for a browse-only (no qrToken) visit, so ordering UI is
    // only ever shown once a table has actually been resolved.
    canOrder: computed(() => !!table()),
    templateSlug: computed(() => storeInfo()?.selfOrderSettings?.templateSlug || 'classic'),
    themeSettings: computed(() => storeInfo()?.selfOrderSettings?.settingsValues || {}),
    cartCount: computed(() => cart().reduce((sum, line) => sum + line.quantity, 0)),
    // Client-side estimate only — the backend re-derives price/total on submit
    // and never trusts this figure.
    cartEstimatedTotal: computed(() => cart().reduce((sum, line) => sum + unitPrice(line) * line.quantity, 0)),
    // Drives the order-status FAB's badge/chime — true whenever the table's
    // order has changed since this device last looked at it (or caused the
    // change itself).
    hasUnseenOrderUpdate: computed(() => {
      const status = orderStatus();
      return !!status?.hasActiveOrder && !!status.updatedAt && status.updatedAt !== lastSeenOrderUpdatedAt();
    }),
  })),

  withMethods((store, api = inject(StorefrontApiService)) => {
    function loadMenuFor(storeId: string): void {
      api.getMenu(storeId).subscribe({
        next: (menu) => patchState(store, { menu, isLoading: false }),
        error: (error) =>
          patchState(store, {
            isLoading: false,
            loadError: error?.error?.message || 'Could not load the menu.',
          }),
      });
    }

    // Shared by the REST snapshot and the socket push — whichever arrives
    // first after this device's own submission consumes expectingOwnOrderUpdate
    // and marks itself seen; the other one (same content, moments later)
    // then just re-patches orderStatus without re-triggering the badge/chime.
    function applyIncomingOrderStatus(orderStatus: PublicOrderStatus): void {
      patchState(store, (state) => ({
        orderStatus,
        lastSeenOrderUpdatedAt: state.expectingOwnOrderUpdate
          ? orderStatus.updatedAt ?? null
          : state.lastSeenOrderUpdatedAt,
        expectingOwnOrderUpdate: false,
      }));
    }

    function loadOrderStatus(qrToken: string): void {
      api.getOrderStatus(qrToken).subscribe({
        next: (orderStatus) => applyIncomingOrderStatus(orderStatus),
        error: () => {
          // Non-fatal — the menu itself already loaded fine; just no status card yet.
        },
      });
    }

    /** Patched by the shell's socket subscription whenever the backend pushes a live update. */
    function setOrderStatus(orderStatus: PublicOrderStatus): void {
      applyIncomingOrderStatus(orderStatus);
    }

    /** Called when the guest opens the order-status modal — clears the FAB's unseen badge. */
    function markOrderSeen(): void {
      patchState(store, { lastSeenOrderUpdatedAt: store.orderStatus()?.updatedAt ?? null });
    }

    const resolveBySlug = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, loadError: null, table: null, qrToken: null })),
        switchMap((storeSlug) =>
          api.resolveBySlug(storeSlug).pipe(
            tapResponse({
              next: ({ store: resolvedStore }) => {
                patchState(store, { storeInfo: resolvedStore });
                loadMenuFor(resolvedStore._id);
              },
              error: (error: any) =>
                patchState(store, {
                  isLoading: false,
                  loadError: error?.error?.message || 'This store could not be found.',
                }),
            }),
          ),
        ),
      ),
    );

    const resolveByQrToken = rxMethod<string>(
      pipe(
        tap((qrToken) => patchState(store, { isLoading: true, loadError: null, qrToken })),
        switchMap((qrToken) =>
          api.resolveByQrToken(qrToken).pipe(
            tapResponse({
              next: ({ store: resolvedStore, table }) => {
                patchState(store, { storeInfo: resolvedStore, table });
                loadMenuFor(resolvedStore._id);
                loadOrderStatus(qrToken);
              },
              error: (error: any) =>
                patchState(store, {
                  isLoading: false,
                  loadError: error?.error?.message || 'This QR code is no longer valid.',
                }),
            }),
          ),
        ),
      ),
    );

    /** Quick add from a product card — only ever called for option-free products. Merges into a matching line. */
    function addToCart(product: StorefrontProduct, quantity = 1): void {
      patchState(store, (state) => {
        const existing = state.cart.find((line) => line.productId === product._id && line.options.length === 0);
        if (existing) {
          return {
            cart: state.cart.map((line) =>
              line.lineId === existing.lineId ? { ...line, quantity: line.quantity + quantity } : line,
            ),
          };
        }
        return {
          cart: [
            ...state.cart,
            {
              lineId: nextLineId(),
              productId: product._id,
              name: product.name,
              price: product.price,
              photo: product.photos?.[0],
              quantity,
              notes: '',
              options: [],
            },
          ],
        };
      });
    }

    /** From the product detail sheet — always a new line, since option selections make each addition distinct. */
    function addDetailedToCart(
      product: StorefrontProduct,
      quantity: number,
      options: CartLineOption[],
      notes: string,
    ): void {
      patchState(store, (state) => ({
        cart: [
          ...state.cart,
          {
            lineId: nextLineId(),
            productId: product._id,
            name: product.name,
            price: product.price,
            photo: product.photos?.[0],
            quantity,
            notes,
            options,
          },
        ],
      }));
    }

    function updateQuantity(lineId: string, quantity: number): void {
      if (quantity <= 0) {
        removeFromCart(lineId);
        return;
      }
      patchState(store, (state) => ({
        cart: state.cart.map((line) => (line.lineId === lineId ? { ...line, quantity } : line)),
      }));
    }

    function removeFromCart(lineId: string): void {
      patchState(store, (state) => ({ cart: state.cart.filter((line) => line.lineId !== lineId) }));
    }

    function updateNotes(lineId: string, notes: string): void {
      patchState(store, (state) => ({
        cart: state.cart.map((line) => (line.lineId === lineId ? { ...line, notes } : line)),
      }));
    }

    function clearCart(): void {
      patchState(store, { cart: [] });
    }

    function dismissOrderResult(): void {
      patchState(store, { lastOrderResult: null });
    }

    function setCustomerName(name: string | null): void {
      patchState(store, { customerName: name, hasPromptedForName: true });
    }

    const submitOrder = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { submitting: true, submitError: null })),
        switchMap(() => {
          const qrToken = store.qrToken();
          const cart = store.cart();
          if (!qrToken || cart.length === 0) {
            patchState(store, { submitting: false });
            return [];
          }
          return api
            .submitOrder(
              qrToken,
              cart.map((line) => ({
                productId: line.productId,
                quantity: line.quantity,
                notes: line.notes || undefined,
                options: line.options.map((o) => ({
                  groupId: o.groupId,
                  optionItemId: o.optionItemId,
                  quantity: o.quantity,
                })),
              })),
              store.customerName() || undefined,
            )
            .pipe(
              tapResponse({
                next: (result) => {
                  patchState(store, {
                    submitting: false,
                    lastOrderResult: result,
                    cart: [],
                    expectingOwnOrderUpdate: true,
                  });
                  // The socket push should land moments after this too — fetching
                  // here as well means the status card is never left stale if
                  // that message happened to be missed (e.g. a brief disconnect).
                  if (qrToken) loadOrderStatus(qrToken);
                },
                error: (error: any) =>
                  patchState(store, {
                    submitting: false,
                    submitError: error?.error?.message || 'Could not place your order — please try again.',
                  }),
              }),
            );
        }),
      ),
    );

    return {
      resolveBySlug,
      resolveByQrToken,
      addToCart,
      addDetailedToCart,
      updateQuantity,
      removeFromCart,
      updateNotes,
      clearCart,
      submitOrder,
      dismissOrderResult,
      setCustomerName,
      loadOrderStatus,
      setOrderStatus,
      markOrderSeen,
    };
  }),
);
