import { Discount } from "./discount.model";
import { PaymentMethod } from "./payment-method.model";
import { Product } from "./product.model";

export interface Cart {
  _id: string;
  products: Product[];
  quantity: number;
  active: boolean;
  paymentMethod?: PaymentMethod | null;
  discount?: Discount;
  delivery?: number;
  note?: string;
  user?: string;
  cartSummary?: CartSummary;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartSummary {
  totalBaseCost: number;
  totalVariantCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  totalCost: number;
}
