import { Store } from './store.model';
import { Category } from './category.model';
import { Station } from './station.model';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  photos?: string[];
  category: string | Category | any;
  menu?: string | Category | any;
  price: number;
  quantity: number;
  activate?: boolean;
  active?: boolean;
  created?: string;
  update?: string;
  position?: number;
  items?: number;
  color?: string;
  options?: Option[];
  store?: Store | string | any;
  featured: boolean;
  // Whether this product shows up on the public self-order storefront.
  // Defaults to true — staff opt individual items out.
  availableForSelfOrder?: boolean;
  location?: any;
  units?: string;
  sku?: string;
  barcode?: string;
  costPrice?: number;
  profit?: number;
  initialStock?: number;
  criticalStockLevel?: number;
  reorderTarget?: number;
  stockLevelAlert?: boolean;
  qty?: number;
  /** How a sale affects stock: its own qty ('direct', the default), ingredient/component use ('bom'), or nothing ('none'). */
  inventoryTracking?: 'none' | 'direct' | 'bom';
  station?: Station | string | any;
  expiryDate?: Date;
  // Tax management (opt-in per store): which taxes apply and whether the price includes them.
  tax?: ProductTaxSettings;
  // Immutable tax snapshot taken when the item went into a sale (cart line / order line), see shared/tax.
  taxLine?: TaxLine;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductTaxSettings {
  taxIds?: string[];
  pricingMode?: 'inherit' | 'inclusive' | 'exclusive';
}

/** The tax rules in force when a line was priced, and (once calculated) its amounts in major units. */
export interface TaxLine {
  pricingMode: 'inclusive' | 'exclusive';
  taxes: TaxLineRule[];
  /** Store tax config version the rules came from. */
  configVersion?: number;
  enteredAmount?: number;
  discountAllocated?: number;
  taxableAmount?: number;
  taxAmount?: number;
  total?: number;
}

export interface TaxLineRule {
  taxId?: string;
  name: string;
  code?: string;
  mraTaxCode?: string | null;
  kind: 'standard' | 'zero_rated' | 'exempt';
  rate: number;
  compound?: boolean;
  taxableAmount?: number;
  taxAmount?: number;
}

export interface Option {
  _id: string;
  name: string;
  atLeast: number;
  atMost: number;
  enabled: boolean;
  options: OptionItem[];
  store?: string;
  invalid?: boolean;
  products: string[];
}

export interface OptionItem {
  _id: string;
  name: string;
  price: number;
  inStock: boolean;
  option?: Option;
  quantity: number;
  selected: boolean;
  store?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
