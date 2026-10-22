/**
 * A very small promise wrapper over IndexedDB, just enough for the POS outbox and its reference-data cache.
 * IndexedDB is the one browser store that is big, survives a reload and is available offline.
 */
export const OFFLINE_DB_NAME = 'shopbot-offline';
const VERSION = 1;
export type OfflineTable = 'outbox' | 'reference';
const KEY_PATH: Record<OfflineTable, string> = { outbox: 'id', reference: 'key' };

export class OfflineDb {
  private opening: Promise<IDBDatabase> | null = null;

  constructor(private readonly name = OFFLINE_DB_NAME) {}

  private open(): Promise<IDBDatabase> {
    this.opening ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(this.name, VERSION);
      req.onupgradeneeded = () => {
        for (const [table, keyPath] of Object.entries(KEY_PATH)) {
          if (!req.result.objectStoreNames.contains(table)) req.result.createObjectStore(table, { keyPath });
        }
      };
      req.onsuccess = () => {
        // Another tab upgrading the database must not be blocked by this connection.
        req.result.onversionchange = () => { req.result.close(); this.opening = null; };
        resolve(req.result);
      };
      req.onerror = () => { this.opening = null; reject(req.error); };
    });
    return this.opening;
  }

  private async run<T>(table: OfflineTable, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(table, mode);
      const req = work(tx.objectStore(table));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error ?? req.error);
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    });
  }

  get<T>(table: OfflineTable, key: string): Promise<T | undefined> { return this.run<T | undefined>(table, 'readonly', (s) => s.get(key)); }
  getAll<T>(table: OfflineTable): Promise<T[]> { return this.run<T[]>(table, 'readonly', (s) => s.getAll()); }
  put<T>(table: OfflineTable, value: T): Promise<IDBValidKey> { return this.run(table, 'readwrite', (s) => s.put(value)); }
  delete(table: OfflineTable, key: string): Promise<undefined> { return this.run<undefined>(table, 'readwrite', (s) => s.delete(key)); }
  clear(table: OfflineTable): Promise<undefined> { return this.run<undefined>(table, 'readwrite', (s) => s.clear()); }

  /** True when this browser can keep data at all (private windows and very old browsers cannot). */
  static supported(): boolean {
    try { return typeof indexedDB !== 'undefined' && !!indexedDB; } catch { return false; }
  }
}
