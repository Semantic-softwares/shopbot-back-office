import { Order } from './order.model';
import { Station } from './station.model';
import { Store } from './store.model';

export type PrintJobStatus = 'pending' | 'processing' | 'printed' | 'failed';

export interface PrintJob {
  _id: string;
  order: Order | string;
  station: Station | string;
  store: Store | string;
  printerIp: string;
  printerPort: number;
  status: PrintJobStatus;
  content: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
  printedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrintJobStats {
  total: number;
  pending: number;
  processing: number;
  printed: number;
  failed: number;
}
