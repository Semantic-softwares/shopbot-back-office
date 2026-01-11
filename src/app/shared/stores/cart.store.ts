import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { Cart, CartSummary } from '../models/cart.model';
import { Product } from '../models/product.model';
import { Discount, PaymentMethod } from '../models';
import { objectId } from '../constants/identity.constant';


type CartState = {
  carts: Cart[];
  selectedCart: Cart | null;
  quantity: number;
  isLoading: boolean;
  pendingCarts: Cart[];
  cartChangeType: 'add' | 'edit' | 'delete' | null;
};

const initialState: CartState = {
  carts: [],
  selectedCart: null,
  quantity: 1,
  isLoading: false,
  pendingCarts: [],
  cartChangeType: null,
};

export const CartStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ carts, selectedCart, pendingCarts }) => ({
    cartCount: computed(() => carts().length),

    activeCarts: computed(() => carts().filter((cart) => cart.active)),

    pendingCartsCount: computed(() => pendingCarts().length),

    selectedCartProducts: computed(() => {
      return selectedCart() ? selectedCart()!.products : [];
    }),

    isSelectedCart: computed(() => {
      return !!selectedCart();
    }),
  })),

  withMethods((store) => ({
    async loadAll(): Promise<void> {
      patchState(store, { isLoading: true });
    },

    updateSelectedCartPaymentMethod(newPaymentMethod: PaymentMethod): void {
      const selectedCart = store.selectedCart();
      if (!selectedCart) {
        console.warn('No selected cart found.');
        return;
      }

      patchState(store, {
        selectedCart: {
          ...selectedCart,
          paymentMethod: { ...newPaymentMethod },
        },
      });
    },

    updateCartSummary(cartSummary: CartSummary): void {
      const selectedCart = store.selectedCart();
      if (!selectedCart) {
        console.warn('No selected cart found.');
        return;
      }

      patchState(store, {
        selectedCart: {
          ...selectedCart,
          cartSummary: { ...cartSummary },
        },
      });
    },

    createCart(): void {
      let newCart = {
        _id: objectId(),
        products: [],
        quantity: 1,
        paymentMethod: null,
        active: true,
        note: '',
      };
      patchState(store, {
        carts: [...store.carts(), newCart],
        selectedCart: newCart,
      });
    },

    addSelectedCartToPending(): void {
      const selectedCart = store.selectedCart();

      if (selectedCart) {
        patchState(store, (state) => {
          // Update the carts array to remove the selected cart
          const updatedCarts = state.carts.filter(
            (cart) => cart._id !== selectedCart._id
          );

          // Add the selected cart to pending carts
          const updatedPendingCarts = [...state.pendingCarts, selectedCart];

          return {
            carts: updatedCarts,
            pendingCarts: updatedPendingCarts,
            selectedCart: null, // Clear the selected cart
          };
        });

        // Create a new cart
        // this.createCart();
      }
    },

    deleteFromPendingCarts(cartId: string): void {
      const pendingCarts = store.pendingCarts();
      // Filter only the cart with the matching ID
      const updatedCarts = pendingCarts.filter((cart) => cart._id !== cartId);
      // Update the state with the remaining carts
      patchState(store, {
        pendingCarts: updatedCarts,
      });
    },

    restorePendingCart(cart: Cart): void {
      patchState(store, (state) => {
        const cartExists = state.carts.some(
          (existingCart) => existingCart._id === cart._id
        );
        return {
          // Add the restored cart to carts if it's not already there
          carts: cartExists ? state.carts : [...state.carts, cart],
          // Update the selectedCart to the restored cart
          selectedCart: cart,
        };
      });
    },

    removeSelectedCart(): void {
      patchState(store, {
        selectedCart: null,
      });
    },

    updateCartAction(action: 'add' | 'delete' | 'edit' | null): void {
      patchState(store, {
        cartChangeType: action,
      });
    },

    selectCart(cartId: string): void {
      const selected =
        store.carts().find((cart) => { 
          console.log('Comparing cart._id', cart._id, 'with cartId', cartId,  cart._id === cartId);
          return cart._id === cartId
        }) || null;
      patchState(store, { selectedCart: selected });
    },

    setCart(cart: Cart): void {
      patchState(store, { selectedCart: cart });
    },

    updateCarts(carts: Cart[]): void {
      patchState(store, { carts });
    },

    addToCart(cartId: string, product: Product, isEditing = false): void {
      const currentSelectedCart = store.selectedCart();
      patchState(store, (state) => {
        const updatedCarts = state.carts.map((cart) => {
          if (cart._id === cartId) {
            // Use the current selected cart data if it exists and matches
            if (currentSelectedCart && currentSelectedCart._id === cartId) {
              if (isEditing) {
                // Replace the product in the cart with the new product object
                return {
                  ...currentSelectedCart,
                  products: currentSelectedCart.products.map((p) =>
                    p._id === product._id ? { ...product } : p
                  ),
                };
              } else {
                return {
                  ...currentSelectedCart,
                  products: currentSelectedCart.products.some(
                    (p) => p._id === product._id
                  )
                    ? currentSelectedCart.products.map((p) =>
                        p._id === product._id
                          ? { ...p, quantity: p.quantity + 1 }
                          : p
                      )
                    : [
                        ...currentSelectedCart.products,
                        { ...product, quantity: product.quantity || 1 },
                      ],
                };
              }
            }
            // Otherwise, check if the product exists in the cart
            const existingProduct = cart.products.find(
              (p) => p._id === product._id
            );
            if (existingProduct) {
              if (isEditing) {
                return {
                  ...cart,
                  products: cart.products.map((p) =>
                    p._id === product._id ? { ...product } : p
                  ),
                  cartSummary: cart.cartSummary,
                  discount: cart.discount,
                  user: cart.user,
                  note: cart.note,
                  delivery: cart.delivery,
                  paymentMethod: cart.paymentMethod,
                };
              } else {
                // If product exists, update the quantity
                return {
                  ...cart,
                  products: cart.products.map((p) =>
                    p._id === product._id
                      ? { ...p, quantity: p.quantity + 1 }
                      : p
                  ),
                  cartSummary: cart.cartSummary,
                  discount: cart.discount,
                  user: cart.user,
                  note: cart.note,
                  delivery: cart.delivery,
                  paymentMethod: cart.paymentMethod,
                };
              }
            } else {
              // If product does not exist, add it to the cart
              return {
                ...cart,
                products: [
                  ...cart.products,
                  { ...product, quantity: product.quantity || 1 },
                ],
                cartSummary: cart.cartSummary,
                discount: cart.discount,
                user: cart.user,
                note: cart.note,
                delivery: cart.delivery,
                paymentMethod: cart.paymentMethod,
              };
            }
          }
          return cart;
        });

        // Always update selectedCart to the updated cart object
        const updatedSelectedCart =
          updatedCarts.find((cart) => cart._id === cartId) || null;
        console.log('Updated selected cart:', updatedSelectedCart);
        return {
          carts: updatedCarts,
          selectedCart: updatedSelectedCart,
        };
      });
    },

    removeFromCart(cartId: string, productId: string): void {
      patchState(store, (state) => {
        const updatedCarts = state.carts.map((cart) => {
          if (cart._id === cartId) {
            return {
              ...cart,
              products: cart.products.filter((p) => p._id !== productId),
            };
          }
          return cart;
        });

        // Update selectedCart if it matches the updated cart
        const updatedSelectedCart =
          state.selectedCart && state.selectedCart._id === cartId
            ? updatedCarts.find((cart) => cart._id === cartId) || null
            : state.selectedCart;

        return {
          carts: updatedCarts,
          selectedCart: updatedSelectedCart,
        };
      });
    },

    clearCart(cartId: string): void {
      patchState(store, (state) => {
        const updatedCarts = state.carts.map((cart) => {
          if (cart._id === cartId) {
            return {
              ...cart,
              products: [],
            };
          }
          return cart;
        });

        // Update selectedCart if it matches the updated cart
        const updatedSelectedCart =
          state.selectedCart && state.selectedCart._id === cartId
            ? updatedCarts.find((cart) => cart._id === cartId) || null
            : state.selectedCart;

        return {
          carts: updatedCarts,
          selectedCart: updatedSelectedCart,
        };
      });
    },

    updateCartDiscount(cartId: string, newDiscount: Discount): void {
      const selectedCart = store.selectedCart(); // Get the selected cart from the store

      if (!selectedCart || selectedCart._id !== cartId) return; // Exit if no selected cart or mismatched cartId

      // Update the selected cart's discount and recalculate cartSummary
      const updatedCart: Cart = {
        ...selectedCart,
        discount: newDiscount, // Update the discount field in the cart
        cartSummary: {
          ...selectedCart.cartSummary,
          discount: newDiscount.value, // Set the discount value in the summary
        } as CartSummary,
      };

      // Update the store with the updated selected cart
      patchState(store, {
        selectedCart: updatedCart, // Only update the selected cart
      });
    },

    updateCartUser(cartId: string, userId: string): void {
      const selectedCart = store.selectedCart(); // Get the selected cart from the store

      if (!selectedCart || selectedCart._id !== cartId) return; // Exit if no selected cart or mismatched cartId

      // Update the selected cart's user
      const updatedCart = {
        ...selectedCart,
        user: userId, // Store the user ID
      };

      // Update the store with the updated selected cart
      patchState(store, {
        selectedCart: updatedCart, // Only update the selected cart
      });
    },

    updateCartDelivery(cartId: string, deliveryFee: number): void {
      const selectedCart = store.selectedCart(); // Get the selected cart from the store

      if (!selectedCart || selectedCart._id !== cartId) return; // Exit if no selected cart or mismatched cartId

      // Update the selected cart's delivery and recalculate cartSummary
      const updatedCart: Cart = {
        ...selectedCart,
        delivery: deliveryFee, // Update the delivery field in the cart
        cartSummary: {
          ...selectedCart.cartSummary,
          deliveryFee: deliveryFee, // Set the delivery fee value in the summary
        } as CartSummary,
      };

      // Update the store with the updated selected cart
      patchState(store, {
        selectedCart: updatedCart, // Only update the selected cart
      });
    },

    updateCartNote(cartId: string, note: string): void {
      const selectedCart = store.selectedCart(); // Get the selected cart from the store

      if (!selectedCart || selectedCart._id !== cartId) return; // Exit if no selected cart or mismatched cartId

      // Update the selected cart's discount and recalculate cartSummary
      const updatedCart = {
        ...selectedCart,
        note: note, // Update the discount field in the cart
      };

      // Update the store with the updated selected cart
      patchState(store, {
        selectedCart: updatedCart, // Only update the selected cart
      });
    },

    incrementProductQuantity(productId: string): void {
      const cart = store.selectedCart();
      if (cart) {
        const updatedProducts = cart.products.map((p) =>
          p._id === productId ? { ...p, quantity: p.quantity + 1 } : p
        );
        patchState(store, {
          selectedCart: { ...cart, products: updatedProducts },
        });
      }
    },

    decrementProductQuantity(productId: string): void {
      const cart = store.selectedCart();
      if (cart) {
        const product = cart.products.find((p) => p._id === productId);
        if (product && product.quantity > 1) {
          this.updateCartAction('edit');
          const updatedProducts = cart.products.map((p) =>
            p._id === productId ? { ...p, quantity: p.quantity - 1 } : p
          );
          patchState(store, {
            selectedCart: { ...cart, products: updatedProducts },
          });
        } else if (product) {
          this.updateCartAction('delete');
          this.removeFromCart(cart._id, product._id);
        }
      }
    },
  })),

  withHooks({
    onInit(store) {
      // Initialize with an empty cart if none exists
      if (store.carts().length === 0 && !store.selectedCart()) {
        store.createCart();
      }
    },
  })
);

// const d = {
//   _id: '6961f920e887ee52b174b17b',
//   products: [
//     {
//       location: {
//         type: 'Point',
//         coordinates: [4.9304004, 6.3143665],
//       },
//       _id: '677badf1e51c59c6dbdacf25',
//       photos: [
//         'http://res.cloudinary.com/sportbay-co/image/upload/v1736158943/pt4htb6gv1shfjqllvcb.jpg',
//       ],
//       name: 'Rot pieces',
//       active: true,
//       description: '1 pieces of regular chicken ',
//       price: 1900,
//       quantity: 1,
//       options: [
//         {
//           _id: '677bae9ae51c59c6dbdacf4b',
//           name: 'Rot pcs chicken ',
//           mandatory: false,
//           atLeast: 1,
//           atMost: 1,
//           enabled: true,
//           options: [
//             {
//               quantity: 1,
//               _id: '677bae45e51c59c6dbdacf37',
//               name: 'Fried chicken ',
//               price: 0,
//               inStock: true,
//               store: {
//                 _id: '64d0cf286aed04b44852d21c',
//                 name: 'Chicken Republic',
//                 currency: '₦',
//               },
//               selected: true,
//             },
//           ],
//           products: ['677badf1e51c59c6dbdacf25'],
//           store: {
//             _id: '64d0cf286aed04b44852d21c',
//             currency: '₦',
//           },
//           createdAt: '2025-01-06T10:21:14.096Z',
//           updatedAt: '2025-06-20T14:12:23.499Z',
//           __v: 0,
//           invalid: false,
//         },
//       ],
//       menu: {
//         _id: '64edd419c38ea4d31e2b36bf',
//         name: 'Meals',
//       },
//       store: {
//         _id: '64d0cf286aed04b44852d21c',
//         currency: '₦',
//       },
//       featured: false,
//       createdAt: '2025-01-06T10:18:25.167Z',
//       updatedAt: '2026-01-10T06:42:23.865Z',
//       __v: 1,
//       costPrice: 0,
//       criticalStockLevel: 0,
//       initialStock: 0,
//       profit: 0,
//       qty: 0,
//       stockLevelAlert: true,
//       barcode: '6091020010029',
//       sku: '0',
//       station: null,
//       units: null,
//     },
//   ],
//   quantity: 1,
//   paymentMethod: null,
//   active: true,
//   note: '',
// };
