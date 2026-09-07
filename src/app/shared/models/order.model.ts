import { Cart } from "./cart.model";
import { Guest } from "./reservation.model";
import { SalesType } from "./sale-type.model";
import { Store } from "./store.model";
import { Table } from "./table.model";
import { User } from "./user.model";

/**
 * One tender taken against an order. The three figures are deliberately
 * distinct: `amount` settles the bill, `tendered` is what the customer handed
 * over, and `change` is the difference given back. Revenue and the cash drawer
 * both sum `amount` — summing `tendered` would book change as takings.
 */
export interface OrderPayment {
  method: string;
  amount: number;
  tendered: number;
  change: number;
}

export interface ShippingDetails {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  isoCountryCode?: string;
  locality?: string;
  postalCode?: string;
  administrativeArea?: string;
  subAdministrativeArea?: string;
  subLocality?: string;
  subThoroughfare?: string;
  thoroughfare?: string;
  apartmentOrHouse?: string;
  label?: string;
  dropOfOption?: string;
  driversInstruction?: string;
}

export interface Status {
  id: number;
  name: string;
  color: string;
  icon?: string;
  imageUrl?: string;
  eta?: string;
  title?: string;
  description?: string;
  updatedOn?: Date;
  vendorIssue?: boolean;
  orderCancellationReason?: string;
}

export interface Receiver {
  name?: string;
  phoneNumber?: string;
  note?: string;
  surprise?: boolean;
  address?: ShippingDetails & { streetName?: string };
}

export interface DeliveryTime {
  name?: string;
  time?: string;
  date?: string;
}

export interface Order {
  _id: string;
  cart?: Cart; // Reference to Cart
  store?: Store; // Reference to Store
  settled?: boolean;
  shipping?: ShippingDetails;
  user?: User; // Reference to User
  rider?: string; // Reference to Rider
  watchers?: string[]; // Reference to Staff
  promo?: string; // Reference to Promo
  note?: string;
  orderCancellationReason?: string;
  status?: Status[];
  reference?: string;
  // Free-text name captured for orders with no account (self-order, no
  // login) — display fallback when `user` isn't set.
  guestName?: string;
  synced?: boolean;
  syncTimestamp?: Date;
  total?: number;
  vendorCommissionAmount?: number;
  subTotal?: number;
  discount?: number;
  serviceFee?: number;
  orderInstruction?: string;
  tax?: number;
  shippingFee?: number;
  driverTip?: number;
  /**
   * Summary of how the order was paid: the method's name, or 'Split' when
   * more than one was used. Kept as a single string because the orders list,
   * the receipts report and the backend's quick-sale guard all read it.
   */
  payment?: string;
  /** One row per tender taken. Absent on orders placed before split payments. */
  payments?: OrderPayment[];
  /** Sum of payments[].amount — what settled the bill, excluding change. */
  amountPaid?: number;
  /** Sum of payments[].change — cash handed back. */
  changeDue?: number;
  deliveryType?: string;
  paymentStatus?: string;
  category?: OrderCategoryType;
  orderType?: "Personal" | "Gift";
  type: string
  salesType?: SalesType;
  table?: Table;
  guest?: Guest;
  receiver?: Receiver;
  gift?: boolean;
  deliveryTime?: DeliveryTime;
  vendorCommission?: number;
  currentAppVersion?: string;
  vendorIssue?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  staff?: User | any;
  storeId?: string;
  salesChannel?: SalesChannel;
}

export interface SearchFilter {
    "store": string;
    "categories": string;
    "initiators": string;
    "types": string;
    "status": string;
    "paymentType": string;
    "startedAt": string;
}

export enum OrderCategoryType {
  NEW = "New",
  PROCESSING = "Processing",
  READY = "Ready",
  COMPLETE = "Complete",
  CANCEL = "Cancel",
}

export enum SalesChannel {
  POINT_OF_SALE = "Point of Sale",
  SHOPBOT = "Shopbot",
  QRCODE = "Qrcode",
}

export interface StatusParams {
  orderId: string;
  userId: string;
  orderCancellationReason?: string | null;
  vendorIssue?: string | null,
  statusNumber: number; 
}

