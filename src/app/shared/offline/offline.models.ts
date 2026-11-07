import { Order } from '../models/order.model';
import { CreateRefundRequest } from '../models/refund.model';

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

/**
 * A refund made with no connection, kept on the device until the server records it. `id` is the refund's idempotency key, so
 * sending it twice can never refund twice. Everything the server decides (the exact amount, the credit note) happens when it
 * arrives; `estimate` is only what the cashier was shown.
 */
export interface RefundOutboxEntry {
  id: string;
  store: string;
  orderId: string;
  reference?: string;
  body: CreateRefundRequest;
  estimate: number;
  /** For the "waiting" list: what was refunded, in words. */
  summary: string;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  nextTryAt: number;
}

/**
 * Something a cashier did at the register while the device had no connection, kept until the server has it. Each carries its own id
 * (`id`), which the server uses to recognise a repeat, so sending it twice can never record it twice.
 *  - open: the register was opened here; `sessionKey` is the id this device made for the session.
 *  - movement: cash in or out of the drawer.
 *  - close: the closing count.
 */
export interface RegisterEventEntry {
  id: string;
  store: string;
  kind: 'open' | 'movement' | 'close';
  /** Monotonic on this device: events are sent in the order they were made. */
  seq: number;
  /** The id this device knows the session by: the server's id, or the one it made when it opened the register offline. */
  sessionKey: string;
  body: any;
  /** For the "waiting" list, in words. */
  summary: string;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  nextTryAt: number;
}

export interface ReferenceEntry<T = unknown> { key: string; value: T; fetchedAt: number }
