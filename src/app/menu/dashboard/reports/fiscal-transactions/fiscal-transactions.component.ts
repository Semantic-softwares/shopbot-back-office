import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { FiscalTag, FiscalTransaction, NOT_YET_FISCALIZED_TEXT } from '../../../../shared/models/fiscal.model';
import { FiscalisationService } from '../../../../shared/services/fiscalisation.service';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportColumn, ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { OfflineStore } from '../../../../shared/offline/offline-store.service';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

/** Short hash for the table; the full value is in the export and the tooltip. */
const short = (v: string | null) => (v ? `${v.slice(0, 8)}…${v.slice(-6)}` : '—');

/**
 * Every invoice and credit note the store's tax authority has been given, in the order they were issued. For the owner and
 * for the authority's audit: counter, invoice number, IRN, previous-invoice hash, state. Shown only when the authority is on.
 */
@Component({
  selector: 'app-fiscal-transactions',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatSortModule, MatTableModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './fiscal-transactions.component.html',
})
export class FiscalTransactionsComponent {
  private readonly queryParams = inject(QueryParamService);
  private readonly fiscalisation = inject(FiscalisationService);
  private readonly exporter = inject(ReportExportService);
  private readonly offlineStore = inject(OfflineStore);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);
  readonly short = short;
  readonly notYetFiscalized = NOT_YET_FISCALIZED_TEXT;
  readonly active = this.fiscalisation.active;
  readonly authority = this.fiscalisation.authorityName;

  readonly type = signal<'' | 'INVOICE' | 'CREDIT_NOTE'>('');
  readonly tag = signal<'' | FiscalTag>('');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, active: this.active(), query: this.query(), type: this.type(), tag: this.tag() }),
    stream: ({ params }) =>
      params.storeId && params.active
        ? this.fiscalisation.transactions(params.storeId, { from: params.query?.['start'], to: params.query?.['end'], type: this.type() || undefined, tag: this.tag() || undefined, limit: 5000 })
        : of({ rows: [], total: 0, page: 1, limit: 0 }),
  });

  /**
   * Sales and refunds saved on this device that the server has not recorded yet. They have no counter: it is given, in order,
   * when they reach the server. Shown at the end so the owner sees them waiting rather than missing.
   */
  private readonly waitingHere = computed<FiscalTransaction[]>(() => {
    if (!this.active()) return [];
    const note = $localize`Saved on this device. The server confirms its counter when it syncs.`;
    const sales = this.offlineStore.outbox()
      .filter((e) => e.order?.paymentStatus === 'Paid')
      .map((e): FiscalTransaction => ({ counter: null, invoiceNumber: '—', documentType: 'INVOICE', irn: null, previousInvoiceHash: null, tag: 'NOT_YET_FISCALIZED', detail: note, issuedAt: e.order.createdAt ? new Date(e.order.createdAt).toISOString() : null, fiscalizedAt: null, total: e.order.total ?? null, currency: null, orderReference: e.order.reference ?? null, provisional: true }));
    const refunds = this.offlineStore.refunds()
      .map((e): FiscalTransaction => ({ counter: null, invoiceNumber: '—', documentType: 'CREDIT_NOTE', irn: null, previousInvoiceHash: null, tag: 'NOT_YET_FISCALIZED', detail: note, issuedAt: e.body.requestedAt ?? e.createdAt, fiscalizedAt: null, total: e.estimate, currency: null, orderReference: e.reference ?? null, provisional: true }));
    // The number each is expected to get: the next ones after the highest the server has given, in the order they were made.
    // Another till syncing first can shift them, which is why they are shown as "expected" and never exported as final.
    const known = (this.res.hasValue() ? this.res.value().rows : []).reduce((max, r) => Math.max(max, r.counter ?? 0), 0);
    return [...sales, ...refunds]
      .sort((x, y) => String(x.issuedAt).localeCompare(String(y.issuedAt)))
      .map((r, i) => ({ ...r, counter: known + i + 1 }))
      .filter((r) => !this.type() || r.documentType === this.type())
      .filter((r) => !this.tag() || r.tag === this.tag());
  });

  readonly rows = computed<FiscalTransaction[]>(() => [...(this.res.hasValue() ? this.res.value().rows : []), ...this.waitingHere()]);
  readonly table = new ReportTable<FiscalTransaction>(() => this.rows(), 'counter');
  readonly columns = ['counter', 'invoiceNumber', 'documentType', 'irn', 'previousInvoiceHash', 'tag', 'issuedAt', 'total'];
  readonly failed = computed(() => !!this.res.error() && !this.res.hasValue());

  readonly counts = computed(() => {
    const r = this.rows();
    return {
      all: r.length,
      fiscalized: r.filter((x) => x.tag === 'FISCALIZED').length,
      waiting: r.filter((x) => x.tag === 'NOT_YET_FISCALIZED').length,
      attention: r.filter((x) => x.tag === 'NEEDS_ATTENTION').length,
    };
  });
  readonly currency = computed(() => this.rows().find((r) => r.currency)?.currency || this.storeStore.selectedStore()?.currencyCode || 'MUR');

  constructor() {
    // The report reads oldest first: the counter is the order of issue.
    this.table.sortDir.set('asc');
  }

  tagLabel(tag: FiscalTag): string {
    return tag === 'FISCALIZED' ? $localize`Fiscalized` : tag === 'NEEDS_ATTENTION' ? $localize`Needs attention` : NOT_YET_FISCALIZED_TEXT;
  }
  typeLabel(t: string): string {
    return t === 'CREDIT_NOTE' ? $localize`Credit note` : $localize`Invoice`;
  }

  exportData(format: ExportFormat): void {
    const columns: ExportColumn[] = [
      { key: 'counter', label: $localize`Counter`, type: 'number' },
      { key: 'invoiceNumber', label: $localize`Invoice number`, type: 'text' },
      { key: 'documentType', label: $localize`Type`, type: 'status' },
      { key: 'irn', label: $localize`IRN`, type: 'text' },
      { key: 'previousInvoiceHash', label: $localize`Previous invoice hash`, type: 'text' },
      { key: 'tag', label: $localize`Status`, type: 'status' },
      { key: 'detail', label: $localize`Detail`, type: 'text' },
      { key: 'issuedAt', label: $localize`Issued`, type: 'datetime' },
      { key: 'orderReference', label: $localize`Order`, type: 'text' },
      { key: 'total', label: $localize`Total`, type: 'currency' },
    ];
    const from = this.query()?.['start'];
    const to = this.query()?.['end'];
    this.exporter.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Fiscal transactions`,
      storeName: this.storeStore.selectedStore()?.name ?? '',
      currency: this.currency(),
      subtitle: from && to ? `${from} – ${to}` : undefined,
      columns,
      // Only what the server has numbered: an expected number is not a fiscal record.
      rows: this.rows().filter((r) => !r.provisional).sort((a, b) => (a.counter ?? 0) - (b.counter ?? 0)),
      filename: 'fiscal-transactions',
      landscape: true,
      statusLabel: (v) => (v === 'CREDIT_NOTE' || v === 'INVOICE' ? this.typeLabel(String(v)) : this.tagLabel(v as FiscalTag)),
    });
  }
}
