import { objectId } from "../constants";
import { ShippingDetails, Status, Receiver, DeliveryTime, SalesType, Table, Store, User, OrderCategoryType, SalesTypeId } from "../models";
import { Cart } from "../models/cart.model";

export class Order {
    _id: string;
    cart: Cart | null;
    store: Store | string | null;
    settled: boolean;
    shipping: ShippingDetails;
    user: User | string | null;
    rider: string | null;
    watchers: string[];
    promo: string | null;
    note: string;
    status: Status[];
    reference: string;
    total: number;
    vendorCommissionAmount: number;
    subTotal: number;
    discount: number;
    serviceFee: number;
    tax: number;
    shippingFee: number;
    driverTip: number;
    payment: string;
    deliveryType: string;
    paymentStatus: string;
    category: OrderCategoryType;
    orderType: "Personal" | "Gift";
    type: string;
    salesType: SalesType;
    table: Table; 
    receiver: Receiver | null;
    gift: boolean;
    deliveryTime: DeliveryTime | null;
    currentAppVersion: string;
    createdAt: Date

  
  
    constructor(init?: Partial<Order>) {
      this._id = objectId();
      this.cart = null;
      this.store = null;
      this.settled = false;
      this.shipping = {};
      this.user = null;
      this.rider = null;
      this.watchers = [];
      this.promo = null;
      this.note = "";
      this.status = [{name: "Pending", id: 0, color: "Red"}];
      this.reference = this.generateReference(); // Generate a unique reference
      this.total = 0;
      this.vendorCommissionAmount = 0;
      this.subTotal = 0;
      this.discount = 0;
      this.serviceFee = 0;
      this.tax = 0;
      this.shippingFee = 0;
      this.driverTip = 0;
      this.payment = "Cash";
      this.deliveryType = "Personal";
      this.paymentStatus = "Unpaid";
      this.category = OrderCategoryType.NEW;
      this.orderType = "Personal";
      this.type = null;
      this.salesType = null;
      this.table = null;
      this.receiver = null;
      this.gift = false;
      this.deliveryTime = null;
      this.currentAppVersion = "1.0.0";
      this.createdAt = new Date()
  
      // Override defaults with provided initialization object
      Object.assign(this, init);
    }
  
    private generateReference(): string {
      return `ORD-${Date.now()}`; // Example reference generator
    }
  
    validate(): boolean {
      if (!this.cart) throw new Error("Cart is required.");
      if (!this.store) throw new Error("Store is required.");
      if (!this.user) throw new Error("User is required.");
      return true;
    }
  }
  