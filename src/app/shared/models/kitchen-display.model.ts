import { StationStatusStep } from './station.model';

/**
 * Shapes returned by the backend's /kitchen-display API
 * (src/kitchen-display/kitchen-display.controller.ts in shopbot-server).
 * This is the same contract the standalone shopbot-kds kiosk app consumes —
 * do not change these shapes without changing the backend first.
 */

export interface KitchenOrderChannel {
  label: string;
  icon: string;
}

export interface KitchenOrderTable {
  id: string;
  name: string;
}

export interface KitchenOrderItemOption {
  name: string;
  price: number;
  quantity: number;
  optionItemName?: string;
}

export interface KitchenOrderItemStation {
  id: string;
  name: string;
  type: string;
}

export interface KitchenOrderItem {
  itemId: string;
  productId: string;
  name: string;
  quantity: number;
  options: KitchenOrderItemOption[];
  notes: string;
  orderedBy?: string;
  kitchenStatus: string;
  isDone: boolean;
  station: KitchenOrderItemStation;
  statusFlow: StationStatusStep[];
}

export interface KitchenOrder {
  orderId: string;
  reference?: string;
  channel: KitchenOrderChannel;
  /** "Table - 05", "Delivery", "Take-Out", ... */
  service: string;
  person?: { name: string; kind: 'staff' | 'customer' };
  table?: KitchenOrderTable;
  guestName?: string;
  note?: string;
  createdAt: string;
  stage: 'new' | 'in_progress' | 'done';
  currentStepLabel: string;
  /** What the order's single button does next; null once it's done. */
  nextAction: { key: string; label: string; isFinal: boolean } | null;
  items: KitchenOrderItem[];
}

export interface KitchenOrderAdvanceResult {
  orderId: string;
  fullyPrepared: boolean;
}
