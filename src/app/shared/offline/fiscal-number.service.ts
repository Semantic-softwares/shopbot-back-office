import { Injectable, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfflineStore } from './offline-store.service';
import { ConnectivityService } from './connectivity.service';
import { FiscalisationService } from '../services/fiscalisation.service';
import { StoreStore } from '../stores/store.store';

/** What a document is given on this device and what it will be issued under by the tax authority's system when it syncs. */
export interface FiscalAssignment {
  counter: number;
  sequence: number;
  /** "INV-7885-000024" or "CRN-7885-000014". */
  number: string;
}

interface Sequence { counter: number; invSeq: number; crnSeq: number; storeNumber: string }

/**
 * Numbers sales and refunds of a store that reports to a tax authority, with or without a connection, so the invoice number and
 * counter on screen are the final ones (they do not change when the document syncs).
 *
 * The till keeps its own running copy of the store's sequence and a sale only ever reads that copy (never the network, which can be
 * slow or gone). The copy is refreshed from the server in the background, but only while nothing of this till is waiting to be sent
 * (otherwise the server cannot have seen those documents yet and the copy would go backwards). The server keeps the numbers when
 * they are still the next free ones (always so with one till); if another till took them first it renumbers and flags the document.
 */
@Injectable({ providedIn: 'root' })
export class FiscalNumberService {
  private readonly http = inject(HttpClient);
  private readonly offline = inject(OfflineStore);
  private readonly net = inject(ConnectivityService);
  private readonly fiscalisation = inject(FiscalisationService);
  private readonly storeStore = inject(StoreStore);
  private queue: Promise<unknown> = Promise.resolve();
  /** Bumped by every number given out, so a refresh that raced with one is thrown away. */
  private taken = 0;
  private refreshing = false;
  private reportSaved = false;
  private lastWaiting = 0;

  /** Starts keeping this device's copy fresh. Call once from a long-lived component. */
  start(): void {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      const online = this.net.online();
      const waiting = this.offline.waiting();
      const drained = this.lastWaiting > 0 && waiting === 0;
      this.lastWaiting = waiting;
      if (storeId && online && this.fiscalisation.active() && (drained || waiting === 0)) void this.refresh(storeId);
    });
    if (typeof window !== 'undefined') {
      setInterval(() => {
        const storeId = this.storeStore.selectedStore()?._id;
        if (storeId && this.net.online() && this.fiscalisation.active()) void this.refresh(storeId);
      }, 60_000);
    }
  }

  /** The numbers for the next sale (`INV`) or refund (`CRN`) of this store, or null when the store does not report sales or none are known yet. */
  take(storeId: string, series: 'INV' | 'CRN'): Promise<FiscalAssignment | null> {
    if (!this.fiscalisation.active()) return Promise.resolve(null);
    const run = this.queue.then(() => this.assign(storeId, series), () => this.assign(storeId, series));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private key(storeId: string): string { return `fiscal-sequence:${storeId}`; }

  private async load(storeId: string): Promise<Sequence | null> {
    try { return (await this.offline.getReference<Sequence>(this.key(storeId)))?.value ?? null; } catch { return null; }
  }

  private async read(storeId: string, ms: number): Promise<Sequence | null> {
    try {
      const res = await firstValueFrom(this.http.get<{ numbers: Sequence | null }>(`${environment.apiUrl}/revenue-authority/stores/${storeId}/next-numbers`).pipe(timeout(ms)));
      return res.numbers ?? null;
    } catch { return null; }
  }

  /** Re-reads the server's next numbers into this device's copy, unless this till has anything waiting or took a number meanwhile. */
  async refresh(storeId: string): Promise<void> {
    if (this.refreshing || this.offline.waiting() > 0) return;
    this.refreshing = true;
    const before = this.taken;
    try {
      const fresh = await this.read(storeId, 15_000);
      if (!fresh || this.taken !== before || this.offline.waiting() > 0) return;
      // Serialised with take(), so the write cannot land between a read and a write of a number being given out.
      let changed = false;
      await this.queue.then(async () => {
        if (this.taken !== before) return;
        const known = await this.load(storeId);
        changed = !known || known.counter !== fresh.counter;
        await this.offline.setReference(this.key(storeId), fresh);
      }, () => undefined);
      // The saved report only needs refreshing when the sequence moved (something was issued since last time).
      if (changed || !this.reportSaved) { this.reportSaved = true; this.saveReport(storeId); }
    } finally {
      this.refreshing = false;
    }
  }

  /**
   * Keeps this month's fiscal report saved on the device, current as of the last sync, so the offline report does not show documents
   * only up to some earlier visit. Owner-only on the server: for anyone else the call is refused and nothing is saved.
   */
  private saveReport(storeId: string): void {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const ym = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    this.fiscalisation.transactions(storeId, { from: `${ym}-01`, to: `${ym}-${pad(last)}`, limit: 5000 }).subscribe({ error: () => undefined });
  }

  private async assign(storeId: string, series: 'INV' | 'CRN'): Promise<FiscalAssignment | null> {
    let seq = await this.load(storeId);
    // The very first time on this device there is no copy yet: wait for the server's (only possible online).
    if (!seq && this.net.online()) seq = await this.read(storeId, 15_000);
    if (!seq) return null;
    this.taken++;
    const sequence = series === 'INV' ? seq.invSeq : seq.crnSeq;
    const out: FiscalAssignment = { counter: seq.counter, sequence, number: `${series}-${seq.storeNumber}-${String(sequence).padStart(6, '0')}` };
    const next: Sequence = { ...seq, counter: seq.counter + 1, ...(series === 'INV' ? { invSeq: seq.invSeq + 1 } : { crnSeq: seq.crnSeq + 1 }) };
    try { await this.offline.setReference(this.key(storeId), next); } catch { /* the numbers are still used for this document */ }
    return out;
  }
}
