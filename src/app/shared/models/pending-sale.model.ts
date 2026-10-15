import { Cart } from './cart.model';
import { Table } from './table.model';
import { User } from './user.model';
import { Guest } from './reservation.model';

/**
 * A sale a cashier has set aside ("put on hold") so they can serve someone else and come back to it.
 * It is a complete snapshot of the sale in progress — everything needed to put the till back exactly
 * as it was — and it must survive JSON round-tripping because it is persisted to localStorage.
 */
export interface PendingSale {
  id: string;
  /** Pending sales belong to the store they were taken in and are only listed there. */
  storeId: string;
  /** The cashier who set it aside. */
  staffId: string;
  cart: Cart;
  table: Table | null;
  customer: User | null;
  guest: Guest | null;
  /** Denormalised for the list so it doesn't have to recompute anything. */
  itemCount: number;
  total: number;
  /** Epoch ms — a number, not a Date, so it survives JSON. */
  createdAt: number;
}
