export type TaxKind = 'standard' | 'zero_rated' | 'exempt';
export type MraTaxCode = 'TC01' | 'TC02' | 'TC03' | 'TC04';
export type PricingMode = 'inclusive' | 'exclusive';

export interface Tax {
  _id: string;
  store?: string;
  name: string;
  code?: string;
  description?: string;
  type?: 'percentage';
  /** Percentage, e.g. 15. */
  rate: number;
  kind: TaxKind;
  mraTaxCode?: MraTaxCode | null;
  compound?: boolean;
  priority?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface TaxSettings {
  taxesEnabled: boolean;
  defaultPricingMode: PricingMode;
  defaultTaxId: string | null;
  taxRegistrationNumber: string;
  roundingMode: 'per_line';
  version: number;
  enabledAt: string | null;
}

export interface TaxView {
  settings: TaxSettings;
  taxes: Tax[];
  currencyCode?: string;
}

export interface TaxUsage {
  count: number;
  products: Array<{ _id: string; name: string; price: number }>;
  isStoreDefault: boolean;
}

export interface PricingModePreview {
  from: PricingMode;
  to: PricingMode;
  count: number;
  sample: Array<{ _id: string; name: string; oldPrice: number; newPrice: number }>;
}

export interface TaxReport {
  currencyCode?: string;
  from: string | null;
  to: string | null;
  orders: number;
  sales: number;
  taxableAmount: number;
  totalTax: number;
  includedTax: number;
  addedTax: number;
  zeroRatedSales: number;
  exemptSales: number;
  discounts: number;
  byTax: Array<{ taxId: string | null; name: string; code?: string; rate: number; kind: TaxKind; taxableAmount: number; taxAmount: number }>;
  refunds: { count: number; taxReversed: number; amount: number };
  netTax: number;
  legacyOrders: number;
}
