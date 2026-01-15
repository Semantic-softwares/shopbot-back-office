import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { Cart, CartSummary } from "../models/cart.model";
import {  Option } from "../models/product.model";
import { Store } from "../models";
import { environment } from "../../../environments/environment";
import { CartStore } from "../stores/cart.store";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private readonly _httpClient = inject(HttpClient);
  private readonly cartStore = inject(CartStore);
  private hostServer = environment.apiUrl;

  public getStoreCartsRestructured(storeId: string): Observable<Cart[]> {
    return this._httpClient.get<Cart[]>(`${this.hostServer}/carts/store/${storeId}/restructured`);
  }

  public getCartByIdRestructured(cartId: string): Observable<Cart> {
    return this._httpClient.get<Cart>(`${this.hostServer}/carts/${cartId}/restructured`);
  }
  
  public generateCartSummary(cart: Cart, store: Store): CartSummary {
    if (cart) {
      const TAX_RATE = store?.tax! || 0 / 100; // Convert 15% to 0.15
    
      // Initialize totals
      let totalBaseCost: number = 0;
      let totalVariantCost: number = 0;
      let deliveryFee: number = 0;
    
      // Calculate the total base cost and variant cost
      cart.products.forEach((product) => {
        totalBaseCost += product.price * product.quantity;
    
        if (product?.options) {
          const productVariantCost = product.options.reduce((total, variant) => {
            const selectedOptionsCost = variant.options.reduce((variantTotal, option) => {
              if (option.selected) {
                return variantTotal + option.price * option.quantity;
              }
              return variantTotal;
            }, 0);
            return total + selectedOptionsCost;
          }, 0);
          // Multiply option cost by product quantity
          totalVariantCost += productVariantCost * product.quantity;
        }
      });
    
      // Calculate subtotal before tax and discount
      const subtotal = totalBaseCost + totalVariantCost;
    
      // Handle discount based on its type (amount or percentage)
      let discountAmount = 0;
      if (cart.discount) {
        if (cart.discount.discountType === "Percentage") {
          discountAmount = (subtotal * cart.discount.value) / 100;
        } else if (cart.discount.discountType === "Amount") {
          discountAmount = cart.discount.value;
        }
      }
    
      // Ensure the discount doesn't exceed the subtotal (prevent negative total cost)
      discountAmount = Math.min(discountAmount, subtotal);
    
      // Apply tax after discount
      const taxAmount = (subtotal - discountAmount) * TAX_RATE;
    
      // If the cart has a delivery fee, add it to the subtotal
      if (cart.delivery) {
        deliveryFee = +cart.delivery; // Assuming delivery is an object with a `value` field
      }
    
      // Calculate final total cost including delivery fee
      const totalCost = subtotal - discountAmount + taxAmount + deliveryFee;
    
      // Create a summary object for the entire cart
      return {
        totalBaseCost,
        totalVariantCost,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        deliveryFee,
        totalCost,
      };
    } else {
      // Return a default summary when the cart is not provided
      return {
        totalBaseCost: 0,
        totalVariantCost: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        totalCost: 0,
        deliveryFee: 0,
      };
    }
  }
  

  public getTotalForSelectedOptions(variants: Option[]): number {
    if (variants && variants.length > 0) {
      return variants.reduce((variantTotal, variant) => {
        const selectedOptionsTotal = variant?.options?.length ? variant.options.reduce((optionTotal, option) => {
            if (option.selected) {
                return optionTotal + (option.price * option.quantity);
            }
            return optionTotal;
        }, 0) : 0;
        return variantTotal + selectedOptionsTotal;
    }, 0);
    } else {
      return 0;
    }
  }

  /**
   * Loads cart from store if available, otherwise fetches from backend
   * @param cartId - The cart ID to load
   * @returns Observable<Cart> - The loaded cart
   */
  public loadCart(cartId: string): Observable<Cart> {
    // Check if carts are loaded in the store
    const carts = this.cartStore.carts();
    
    if (carts.length > 0) {
      // Carts are loaded, try to select from store
      this.cartStore.selectCart(cartId);
      const selectedCart = this.cartStore.selectedCart();
      
      if (selectedCart) {
        // Cart found in store, return it as observable
        console.log('Using cart from store:', selectedCart);
        return of(selectedCart);
      }
    }
    
    // Carts are empty or cart not found in store, fetch from backend
    return this.getCartByIdRestructured(cartId).pipe(
      tap((restructuredCart) => {
        // Add the cart to the store's carts array
        const updatedCarts = [...this.cartStore.carts(), restructuredCart];
        this.cartStore.updateCarts(updatedCarts);
        this.cartStore.setCart(restructuredCart);
      }),
      catchError((error) => {
        console.error('Error fetching cart:', error);
        throw error;
      })
    );
  }
}
