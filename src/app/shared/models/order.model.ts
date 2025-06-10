import { Cart } from "./cart.model";
import { SalesType } from "./sale-type.model";
import { Store } from "./store.model";
import { Table } from "./table.model";
import { User } from "./user.model";

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
  synced: boolean;
  syncTimestamp: Date;
  total?: number;
  vendorCommissionAmount?: number;
  subTotal?: number;
  discount?: number;
  serviceFee?: number;
  orderInstruction?: string;
  tax?: number;
  shippingFee?: number;
  driverTip?: number;
  payment?: string;
  deliveryType?: string;
  paymentStatus?: string;
  category?: OrderCategoryType;
  orderType?: "Personal" | "Gift";
  type: string
  salesType?: SalesType;
  table?: Table;
  receiver?: Receiver;
  gift?: boolean;
  deliveryTime?: DeliveryTime;
  vendorCommission?: number;
  currentAppVersion?: string;
  vendorIssue?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  staff?: User;
  storeId?: string;
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

export interface StatusParams {
  orderId: string;
  userId: string;
  orderCancellationReason?: string | null;
  vendorIssue?: string | null,
  statusNumber: number; 
}

