// Deliberately independent of shared/models's staff-facing Product/Store types —
// this is a separate, public data contract, not a reuse of the authenticated
// app's models. See the plan's "don't reuse staff components/stores" decision.

export interface SelfOrderSettings {
  enabled: boolean;
  templateSlug: string;
  settingsValues: Record<string, any>;
  showWifi?: boolean;
  showContactInfo?: boolean;
}

// Only what a guest would use to find or call the venue. The backend already
// omits this block entirely when the store has filled nothing in (or has the
// toggle off), so the footer decides whether to render on presence alone.
export interface StorefrontContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface StorefrontStoreInfo {
  _id: string;
  name: string;
  logo?: string;
  bannerImage?: string;
  currency?: string;
  selfOrderSettings: SelfOrderSettings;
  contactInfo?: StorefrontContactInfo;
}

export interface StorefrontWifi {
  ssid: string;
  password?: string;
}

export interface StorefrontTable {
  _id: string;
  name: string;
  // Present only when this table has a network name AND the store hasn't
  // switched the card off — the backend does that filtering, so any `wifi`
  // that arrives here is meant to be shown.
  wifi?: StorefrontWifi;
}

export interface StorefrontOptionItem {
  _id: string;
  name: string;
  price: number;
}

export interface StorefrontOptionGroup {
  _id: string;
  name: string;
  mandatory: boolean;
  atLeast: number;
  atMost: number;
  enabled: boolean;
  options: StorefrontOptionItem[];
}

export interface StorefrontProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  photos: string[];
  options: StorefrontOptionGroup[];
}

export interface StorefrontMenuSection {
  _id: string;
  name: string;
  position: number;
  foods: StorefrontProduct[];
}

export interface CartLineOption {
  groupId: string;
  groupName: string;
  optionItemId: string;
  optionItemName: string;
  price: number;
  quantity: number;
}

export interface CartLine {
  // Client-generated — lets two lines for the same product with different
  // option selections coexist (a plain productId key can't distinguish them).
  lineId: string;
  productId: string;
  name: string;
  price: number; // base product price, per unit — options are priced separately
  photo?: string;
  quantity: number;
  notes: string;
  options: CartLineOption[];
}

export interface SubmitOrderResult {
  orderReference: string;
  itemCount: number;
  total: number;
}

export interface PublicOrderStatusItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  orderedBy?: string;
  options?: { name: string; price: number; quantity: number }[];
}

// The table's current order, live — not the one-shot "just placed" flash
// (see SubmitOrderResult/OrderConfirmationComponent). Populated on load via
// StorefrontApiService.getOrderStatus() and kept fresh after that by
// StorefrontSocketService's push (see SelfOrderStatusGateway on the backend).
export interface PublicOrderStatus {
  hasActiveOrder: boolean;
  orderReference?: string;
  category?: string;
  statusLabel?: string;
  paymentStatus?: string;
  items?: PublicOrderStatusItem[];
  total?: number;
  updatedAt?: string;
  assignedStaffName?: string;
  // Set only when staff just moved this table's order to another table. This
  // page is bound to the OLD table's qrToken so it can't follow — it shows a
  // "rescan at your new table" notice instead. Live-socket only: a hard
  // refresh reads the now-empty table and falls back to the normal menu.
  movedToTableName?: string;
}
