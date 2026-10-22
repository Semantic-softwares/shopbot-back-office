import { Order } from '../models/order.model';

/** `pending`: waiting for its turn or for the network. `syncing`: being sent right now. `failed`: given up, needs a person. */
export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export interface OutboxEntry {
  /** The order's own id, made by the POS: the server uses it to recognise a replay. */
  id: string;
  store: string;
  order: Order;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  /** Not before this time (backoff). */
  nextTryAt: number;
}

export interface ReferenceEntry<T = unknown> { key: string; value: T; fetchedAt: number }
