export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type Dimension = 'weight' | 'volume' | 'count' | 'length';

export interface InventoryUnit { code: string; label: string; dimension: Dimension }

export interface InventoryLocation { _id: string; name: string; type?: string; isDefault?: boolean; active?: boolean }

export interface InventoryItem {
  _id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  baseUnit: string;
  dimension: Dimension;
  purchaseUnit?: string;
  purchaseToBaseFactor?: number;
  defaultCost?: number;
  active?: boolean;
  trackingEnabled?: boolean;
  alertDefault?: { enabled: boolean; thresholdScaled: number };
  // list extras
  quantity?: number;
  status?: StockStatus;
  threshold?: number | null;
  locations?: { location: string; quantity: number }[];
}

export interface ItemBalance { location: string; name: string; isDefault?: boolean; quantity: number; threshold: number | null; alertEnabled: boolean; isBelow: boolean; status: StockStatus }

export interface InventoryMovement {
  _id: string; type: string; deltaScaled: number; quantity?: number; unit?: string; previousScaled: number; newScaled: number; shortfallScaled?: number;
  reason?: string; createdAt: string; location?: string; source?: { type?: string; id?: string }; bomSnapshot?: { version?: number };
}

export interface ItemDetail { item: InventoryItem; total: number; balances: ItemBalance[]; movements: InventoryMovement[]; boms: { _id: string; version: number; product?: { _id: string; name: string } }[] }

export interface BomComponentRow { item: string; quantity: number; unit: string }
export interface Bom { _id?: string; version: number; outputQuantity: number; outputUnit?: string; components: { item: any; quantity: number; unit: string }[] }

export interface StocktakeLine { item: string; systemScaled: number; countedScaled: number | null; varianceScaled: number | null }
export interface Stocktake { _id: string; location: any; status: 'draft' | 'approving' | 'approved' | 'cancelled'; lines: StocktakeLine[]; note?: string; createdAt: string; approvedAt?: string }

export interface InventorySettings { consumptionLocation: string; insufficientStockPolicy: 'allow' | 'block' }
export interface StockShortage { item: string; name: string; needed: number; available: number; unit: string }

/** Plain-language names of the movement types, for the history and the reports. */
export const MOVEMENT_LABELS: Record<string, string> = {
  add: $localize`Stock added`,
  remove: $localize`Stock removed`,
  wastage: $localize`Wastage`,
  adjustment: $localize`Adjustment`,
  consumption: $localize`Used in a sale`,
  consumption_reversal: $localize`Sale cancelled or changed`,
  return_to_stock: $localize`Returned to stock`,
  transfer_out: $localize`Transfer out`,
  transfer_in: $localize`Transfer in`,
  stocktake: $localize`Stocktake`,
};

/** The one place that names and colours a stock status, so every screen agrees. */
export const STATUS_INFO: Record<StockStatus, { label: string; cls: string }> = {
  in_stock: { label: $localize`In stock`, cls: '!bg-green-100 [--mat-chip-label-text-color:#14532d] !border-green-200' },
  low_stock: { label: $localize`Low stock`, cls: '!bg-amber-100 [--mat-chip-label-text-color:#78350f] !border-amber-200' },
  out_of_stock: { label: $localize`Out of stock`, cls: '!bg-red-100 [--mat-chip-label-text-color:#7f1d1d] !border-red-200' },
};

export const DIMENSION_LABELS: Record<Dimension, string> = { weight: $localize`Weight`, volume: $localize`Volume`, count: $localize`Count`, length: $localize`Length` };

export const apiMessage = (e: any): string => {
  const m = e?.error?.message;
  return (Array.isArray(m) ? m.join(' ') : m) || $localize`Something went wrong. Please try again.`;
};
