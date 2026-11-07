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
  /** Present only when the sale is priced by the tax engine (store opted in, every line carries a tax snapshot). */
  engine?: EngineCartSummary;
}

export interface EngineCartSummary {
  /** One entry per cart line, in cart order (lines with quantity 0 get zeros). */
  lines: Array<{ pricingMode: 'inclusive' | 'exclusive'; enteredAmount: number; discountAllocated: number; taxableAmount: number; taxAmount: number; total: number; taxes: any[] }>;
  taxableAmount: number;
  totalTax: number;
  includedTax: number;
  addedTax: number;
  zeroRatedSales: number;
  exemptSales: number;
  taxBreakdown: Array<{ taxId?: string; name: string; code?: string; mraTaxCode?: string | null; kind: string; rate: number; taxableAmount: number; taxAmount: number }>;
  taxConfigVersion: number | null;
}
