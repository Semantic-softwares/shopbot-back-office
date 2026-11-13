import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { OfflineStore } from '../../../../../shared/offline/offline-store.service';
import { OutboxSyncService } from '../../../../../shared/offline/outbox-sync.service';
import { ConnectivityService } from '../../../../../shared/offline/connectivity.service';
import { pendingRefundTicket } from '../../../../../shared/offline/refund-offline';
import { OutboxEntry } from '../../../../../shared/offline/offline.models';
import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { SelectionModel } from '@angular/cdk/collections';
import { EmployeeSelectorComponent } from '../../../../../shared/components/employee-selector/employee-selector.component';
import { DateRangeSelectorComponent } from '../../../../../shared/components/date-range-selector/date-range-selector.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../../shared/services/orders.service';
import { QueryParamService } from '../../../../../shared/services/query-param.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { of } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExportService } from '../../../../../shared/services/export.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TrPipe } from '../../../../../shared/i18n/tr.pipe';
import { RefundDialogComponent, refundReasonLabel } from '../../../../pos/orders/refund-dialog/refund-dialog.component';
import { VoidDialogComponent } from '../../../../pos/orders/void-dialog/void-dialog.component';
import { Refund } from '../../../../../shared/models/refund.model';
import { RefundService } from '../../../../../shared/services/refund.service';
import { PrintJobService } from '../../../../../shared/services/print-job.service';

export type ReceiptTab = 'all' | 'open' | 'sales' | 'discount' | 'refund' | 'cancelled';
export type ReceiptSort = 'attention' | 'newest' | 'oldest' | 'total' | 'discount';
type Tone = 'open' | 'paid' | 'danger' | 'muted' | 'warn';

/** Where a receipt stands, in words and colour: the one badge every row leads with. */
export interface ReceiptStatus {
  label: string;
  tone: Tone;
  /** 0 = needs someone's attention, higher = settled. Drives the default order. */
  rank: number;
}

@Component({
  selector: 'app-list-receipts',
  templateUrl: './list-receipts.component.html',
  standalone: true,
  imports: [
    TrPipe,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSelectModule,
    EmployeeSelectorComponent,
    DateRangeSelectorComponent,
    MatProgressSpinner,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ListReceiptsComponent {
  private queryParams = inject(QueryParamService);
  private orderService = inject(OrderService);
  private refundService = inject(RefundService);
  private printJobService = inject(PrintJobService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private exportService = inject(ExportService);
  readonly offline = inject(OfflineStore);
  readonly outbox = inject(OutboxSyncService);
  readonly net = inject(ConnectivityService);
  public storeStore = inject(StoreStore);

  private query = toSignal(this.queryParams.getAllParams$);
  public selection = new SelectionModel<any>(true, []);
  public isDeleting = signal(false);

  // ---- view state -----------------------------------------------------------------------------
  readonly activeTab = computed<ReceiptTab>(() => (this.query()?.['type'] as ReceiptTab) || 'all');
  readonly search = signal('');
  readonly sortBy = signal<ReceiptSort>('attention');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly currency = computed(() => this.storeStore.selectedStore()?.currency || '');

  // ---- data -----------------------------------------------------------------------------------
  /**
   * What the server is asked for: the period, employee and channel filters, NOT the tab. Tabs only choose which
   * of the receipts already on screen to show, so switching tab never refetches or flashes the page.
   */
  private dataQuery = computed(
    () => {
      const { type, ...rest } = this.query() ?? {};
      return rest;
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  public dataSource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, query: this.dataQuery() }),
    stream: ({ params }) => this.orderService.getSalesReceipts(params.storeId!, params.query),
  });

  /** Refund tickets are their own records. Fetched with the period, so the Refunds tab is instant too. */
  public refundsResource = rxResource({
    params: () => {
      const q = this.dataQuery();
      return { storeId: this.storeStore.selectedStore()?._id, start: q['start'], end: q['end'], employee: q['employee'] };
    },
    stream: ({ params }) =>
      params.storeId
        ? this.refundService.listForStore(params.storeId, {
            from: params.start ? new Date(`${params.start}T00:00:00`).toISOString() : undefined,
            to: params.end ? new Date(`${params.end}T23:59:59.999`).toISOString() : undefined,
            employee: params.employee && params.employee !== 'all' ? params.employee : undefined,
            limit: 200,
          })
        : of(null),
  });

  // While a new period loads, the previous figures stay on screen under a thin progress bar instead of the
  // whole page being swapped for a spinner.
  private lastData = signal<any>(null);
  private lastRefunds = signal<any>(null);
  /** While online, quietly keep the newest orders' details on the device so they can be opened offline. */
  private warmRecent = effect(() => {
    const d = this.dataSource.hasValue() ? this.dataSource.value() : null;
    if (!d?.orders?.length || !this.net.online()) return;
    this.orderService.warmOrders(d.orders.slice(0, 25).map((o: any) => String(o._id)).filter(Boolean));
  });

  /** When what was waiting on this device has been sent, fetch again so the server's own receipts and credit notes replace the waiting rows. */
  private lastWaiting = 0;
  private refreshAfterSync = effect(() => {
    const waiting = this.offline.waiting();
    if (this.lastWaiting > 0 && waiting === 0 && this.net.online()) {
      this.dataSource.reload();
      this.refundsResource.reload();
    }
    this.lastWaiting = waiting;
  });

  private keepLast = effect(() => {
    // `value()` throws while a request is in error (offline), so only read it when there is one.
    const d = this.dataSource.hasValue() ? this.dataSource.value() : null;
    if (d) this.lastData.set(d);
    const r = this.refundsResource.hasValue() ? this.refundsResource.value() : null;
    if (r) this.lastRefunds.set(r);
  });
  readonly data = computed(() => (this.dataSource.hasValue() ? this.dataSource.value() : null) ?? this.lastData());
  readonly refreshing = computed(() => this.dataSource.isLoading() || this.refundsResource.isLoading());

  readonly summary = computed(() => this.data()?.data);
  readonly kpis = computed(() => this.summary()?.kpis);

  readonly tabs = computed(() => {
    const d = this.summary();
    // Sales still on this device count too, in the tab they belong to.
    const local = (tab: ReceiptTab) => this.unsynced().filter((o) => this.inTab(o, tab)).length;
    return [
      { value: 'all' as ReceiptTab, label: $localize`All`, count: (d?.allReceipts ?? 0) + this.unsynced().length, icon: 'receipt_long', urgent: false },
      { value: 'open' as ReceiptTab, label: $localize`Open`, count: (d?.open ?? 0) + local('open'), icon: 'pending_actions', urgent: (d?.open ?? 0) + local('open') > 0 },
      { value: 'sales' as ReceiptTab, label: $localize`Paid`, count: (d?.sales ?? 0) + local('sales'), icon: 'paid', urgent: false },
      { value: 'discount' as ReceiptTab, label: $localize`Discounts`, count: (d?.discount ?? 0) + local('discount'), icon: 'sell', urgent: false },
      { value: 'refund' as ReceiptTab, label: $localize`Refunds`, count: (d?.refund ?? 0) + this.pendingRefunds().length, icon: 'currency_exchange', urgent: false },
      { value: 'cancelled' as ReceiptTab, label: $localize`Cancelled`, count: (d?.cancelled ?? 0) + local('cancelled'), icon: 'block', urgent: false },
    ];
  });

  /** Discounts as a share of gross sales, for the Discounts tile. */
  readonly discountRate = computed(() => {
    const k = this.kpis();
    return k && k.grossSales > 0 ? ((k.discounts?.amount ?? 0) / k.grossSales) * 100 : 0;
  });

  /** Refunds as a share of gross sales, for the Refunds tile. */
  readonly refundRate = computed(() => {
    const k = this.kpis();
    return k && k.grossSales > 0 ? (k.refunds.amount / k.grossSales) * 100 : 0;
  });

  // ---- orders still on this device (not accepted by the server yet) ------------------------------
  /**
   * Orders saved on this device that the server has not accepted yet, shaped like the server's receipt rows and marked
   * `_unsynced`, so they sit in the same list. They follow the same period, employee and channel filters.
   */
  readonly unsynced = computed<any[]>(() => {
    const store = this.storeStore.selectedStore()?._id;
    const q: any = this.query() ?? {};
    const from = q.start ? new Date(`${q.start}T00:00:00`).getTime() : -Infinity;
    const to = q.end ? new Date(`${q.end}T23:59:59.999`).getTime() : Infinity;
    return this.offline.outbox()
      .filter((e) => e.store === store)
      .map((e) => this.localRow(e))
      .filter((r) => {
        const t = new Date(r.date).getTime();
        if (t < from || t > to) return false;
        if (q.employee && q.employee !== 'all' && String(r.staffId) !== String(q.employee)) return false;
        if (q.salesChannel && r.salesChannel !== q.salesChannel) return false;
        return true;
      });
  });

  private localRow(e: OutboxEntry): any {
    const o: any = e.order;
    return {
      _id: e.id,
      _unsynced: true,
      _failed: e.status === 'failed',
      _error: e.lastError,
      receiptNo: o.reference,
      date: o.createdAt,
      ordertype: o.salesType?.name ?? o.type,
      salesChannel: o.salesChannel,
      category: o.category,
      paymentStatus: o.paymentStatus,
      type: o.payment,
      total: o.total,
      staffId: o.staff,
      servedBy: { name: o.staffName ?? '' },
      orderedBy: o.user ? { name: o.user.name } : undefined,
      note: o.note,
      refundedAmount: 0,
      discount: o.discount || 0,
    };
  }

  // ---- sales rows: search, then sort ------------------------------------------------------------
  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const tab = this.activeTab();
    const waiting = new Set(this.offline.outbox().map((e) => e.id));
    // A refund still on this device already counts against its sale, so the row shows it as refunded.
    const pendingFor = new Map<string, number>();
    for (const r of this.pendingRefunds()) pendingFor.set(r.order, (pendingFor.get(r.order) ?? 0) + r.total);
    const withPending = (o: any) => (pendingFor.has(String(o._id)) ? { ...o, refundedAmount: (o.refundedAmount || 0) + pendingFor.get(String(o._id))! } : o);
    let list: any[] = [...this.unsynced(), ...(this.data()?.orders ?? []).filter((o: any) => !waiting.has(String(o._id))).map(withPending)].filter((o: any) => this.inTab(o, tab));
    if (term) {
      list = list.filter((o) =>
        [o.receiptNo, o.orderedBy?.name, o.servedBy?.name, o.type].some((v) => String(v ?? '').toLowerCase().includes(term)),
      );
    }
    const byDate = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();
    switch (this.sortBy()) {
      case 'newest': return [...list].sort(byDate);
      case 'oldest': return [...list].sort((a, b) => -byDate(a, b));
      case 'total': return [...list].sort((a, b) => (b.total || 0) - (a.total || 0));
      case 'discount': return [...list].sort((a, b) => (b.discount || 0) - (a.discount || 0) || byDate(a, b));
      // Needs attention first: open orders, then sales that were partly refunded, then settled ones, then the
      // cancelled and fully refunded; newest first inside each group.
      default: return [...list].sort((a, b) => this.statusOf(a).rank - this.statusOf(b).rank || byDate(a, b));
    }
  });

  /**
   * Refunds made on this device that the server has not recorded yet, shaped like refund tickets. They follow the same period
   * as the rest of the list and drop out by themselves once they sync (the server's own ticket takes their place).
   */
  readonly pendingRefunds = computed<Refund[]>(() => {
    const store = this.storeStore.selectedStore()?._id;
    const q: any = this.query() ?? {};
    const from = q.start ? new Date(`${q.start}T00:00:00`).getTime() : -Infinity;
    const to = q.end ? new Date(`${q.end}T23:59:59.999`).getTime() : Infinity;
    // The server may already hold a refund the device is still waiting to hear back about: then only the recorded one is shown.
    const recorded = new Set((((this.refundsResource.hasValue() ? this.refundsResource.value() : null) ?? this.lastRefunds())?.data ?? []).map((r: Refund) => r.idempotencyKey).filter(Boolean));
    return this.offline.refunds()
      .filter((e) => e.store === store && !recorded.has(e.id))
      .map((e) => pendingRefundTicket(e))
      .filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t >= from && t <= to;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  readonly refundRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list: any[] = [...this.pendingRefunds(), ...(((this.refundsResource.hasValue() ? this.refundsResource.value() : null) ?? this.lastRefunds())?.data ?? [])];
    if (!term) return list;
    return list.filter((r) =>
      [r.refundNumber, r.orderReference, r.createdBy?.name, refundReasonLabel(r.reasonCode)].some((v) => String(v ?? '').toLowerCase().includes(term)),
    );
  });

  /** Every refund ticket of the period, by the sale it belongs to, so a sale can show what its refunds were noted as. */
  private readonly refundsByOrder = computed(() => {
    const list: Refund[] = ((this.refundsResource.hasValue() ? this.refundsResource.value() : null) ?? this.lastRefunds())?.data ?? [];
    const map = new Map<string, Refund[]>();
    for (const r of list) map.set(String(r.order), [...(map.get(String(r.order)) ?? []), r]);
    return map;
  });

  /** What to read without opening the receipt: the sale's own note and the notes on its refunds, one per line. Empty when there is none. */
  receiptTip(row: any): string {
    const lines: string[] = [];
    if (row?.note) lines.push(row.note);
    for (const r of this.refundsByOrder().get(String(row?._id)) ?? []) {
      if (r.note) lines.push(`${r.refundNumber} · ${this.reasonLabel(r.reasonCode)}: ${r.note}`);
    }
    return lines.join('\n');
  }

  /** The reason and the note on a refund ticket. Empty when there is no note. */
  refundTip(refund: Refund): string {
    return refund.note ? `${this.reasonLabel(refund.reasonCode)}\n${refund.note}` : '';
  }

  readonly isRefundTab = computed(() => this.activeTab() === 'refund');
  readonly activeRows = computed(() => (this.isRefundTab() ? this.refundRows() : this.rows()));
  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.activeRows().slice(start, start + this.pageSize());
  });
  /** Only the very first load has nothing to show; after that the screen keeps what it has. */
  readonly loading = computed(() => !this.data() && !this.dataSource.error());

  readonly columns = ['select', 'receipt', 'date', 'status', 'payment', 'people', 'total', 'actions'];
  readonly refundColumns = ['ticket', 'date', 'items', 'method', 'by', 'amount', 'actions'];

  // ---- filters --------------------------------------------------------------------------------
  salesChannelOptions = [
    { value: '', label: $localize`All Channels` },
    { value: 'Point of Sale', label: $localize`Point of Sale` },
    { value: 'Qrcode', label: $localize`Self-Order (QR)` },
    { value: 'Storefront', label: $localize`Storefront` },
    { value: 'Shopbot', label: $localize`Shopbot` },
  ];

  orderTypeOptions = [
    { value: '', label: $localize`All Order Types` },
    { value: 'table', label: $localize`Table` },
    { value: 'quick', label: $localize`Quick Sale` },
    { value: 'online', label: $localize`Online` },
  ];

  sortOptions: { value: ReceiptSort; label: string }[] = [
    { value: 'attention', label: $localize`Needs attention first` },
    { value: 'newest', label: $localize`Newest first` },
    { value: 'oldest', label: $localize`Oldest first` },
    { value: 'total', label: $localize`Highest total` },
    { value: 'discount', label: $localize`Highest discount` },
  ];

  selectedSalesChannel = computed(() => this.query()?.['salesChannel'] || '');
  selectedOrderType = computed(() => this.query()?.['orderType'] || '');

  onSalesChannelChange(value: string): void {
    this.pageIndex.set(0);
    value ? this.queryParams.add({ salesChannel: value }) : this.queryParams.remove('salesChannel');
  }

  onOrderTypeChange(value: string): void {
    this.pageIndex.set(0);
    value ? this.queryParams.add({ orderType: value }) : this.queryParams.remove('orderType');
  }

  onTabChange(tab: ReceiptTab): void {
    this.selection.clear();
    this.pageIndex.set(0);
    this.queryParams.add({ type: tab });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  /** Which tab a receipt belongs to. */
  private inTab(order: any, tab: ReceiptTab): boolean {
    const cancelled = order.category === 'Cancel';
    switch (tab) {
      case 'open': return order.paymentStatus !== 'Paid' && !cancelled;
      case 'sales': return order.paymentStatus === 'Paid' && !cancelled;
      case 'cancelled': return cancelled;
      // The receipts the Discounts figure adds up: paid sales that had something taken off.
      case 'discount': return order.paymentStatus === 'Paid' && !cancelled && (order.discount || 0) > 0;
      default: return true;
    }
  }

  // ---- how a receipt looks ----------------------------------------------------------------------
  statusOf(order: any): ReceiptStatus {
    if (order._unsynced) return order._failed ? { label: $localize`Sync failed`, tone: 'danger', rank: -2 } : { label: $localize`Not synced`, tone: 'open', rank: -1 };
    if (order.category === 'Cancel') return { label: $localize`Cancelled`, tone: 'muted', rank: 3 };
    if (order.paymentStatus !== 'Paid') return { label: $localize`Open`, tone: 'open', rank: 0 };
    if (order.refundStatus === 'Full') return { label: $localize`Refunded`, tone: 'danger', rank: 3 };
    if (order.refundStatus === 'Partial') return { label: $localize`Partially refunded`, tone: 'warn', rank: 1 };
    return { label: $localize`Paid`, tone: 'paid', rank: 2 };
  }

  toneClass(tone: Tone): string {
    switch (tone) {
      case 'open': return 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'warn': return 'bg-orange-100 text-orange-800';
      case 'danger': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  /** The colour of the stripe on the left of open and problem rows, so they read at a glance down a long list. */
  accentBg(order: any): string {
    switch (this.statusOf(order).tone) {
      case 'open': return 'bg-amber-400';
      case 'warn': return 'bg-orange-400';
      case 'danger': return 'bg-red-400';
      default: return 'bg-transparent';
    }
  }

  accentBorder(order: any): string {
    switch (this.statusOf(order).tone) {
      case 'open': return 'border-l-amber-400';
      case 'warn': return 'border-l-orange-400';
      case 'danger': return 'border-l-red-400';
      default: return 'border-l-transparent';
    }
  }

  channelLabel(channel: string): string {
    return channel === 'Qrcode' ? $localize`QR` : channel === 'Point of Sale' ? $localize`POS` : channel;
  }

  reasonLabel = refundReasonLabel;

  /** "1 × Burger, 2 × Fries", or what kind of refund it was when no items were chosen. */
  refundSummary(refund: Refund): string {
    if (refund.summary) return refund.summary;
    return refund.lines?.length ? refund.lines.map((l) => `${l.quantity} × ${l.name}`).join(', ') : $localize`Amount refund (no items)`;
  }

  refundMethods(refund: Refund): string {
    return (refund.tenders || []).map((t) => t.method).join(' + ');
  }

  // ---- actions ---------------------------------------------------------------------------------
  /** Throws away a sale that could not be sent. Always asks first: this is the only copy. */
  discardLocal(row: any): void {
    this.dialog
      .open(ConfirmationDialogComponent, { width: '380px', data: { message: $localize`Discard receipt #${row.receiptNo}? It never reached the server and will be lost.` } })
      .afterClosed()
      .subscribe((yes) => { if (yes) void this.outbox.discard(row._id); });
  }

  viewRecipesDetails(orderId: string) {
    this.router.navigate(['../', orderId, 'details'], { relativeTo: this.route });
  }

  /** A paid sale that still has something left to refund. */
  canRefund(order: any): boolean {
    return !order?._unsynced && order?.paymentStatus === 'Paid' && order?.category !== 'Cancel' && order?.refundStatus !== 'Full';
  }

  /** An order nobody has paid for is cancelled (voided), not refunded. */
  canVoid(order: any): boolean {
    return !order?._unsynced && order?.paymentStatus !== 'Paid' && order?.category !== 'Cancel';
  }

  refundReceipt(order: any): void {
    this.dialog
      .open(RefundDialogComponent, { width: '560px', maxWidth: '96vw', maxHeight: '92vh', data: { orderId: order._id } })
      .afterClosed()
      .subscribe((refund: Refund | undefined) => {
        if (!refund) return;
        this.snackBar.open(refund.pendingSync ? $localize`Refund saved on this device. It will be recorded when you are back online.` : $localize`Refund ${refund.refundNumber} recorded`, $localize`Close`, { duration: 5000 });
        this.dataSource.reload();
      });
  }

  voidReceipt(order: any): void {
    this.dialog
      .open(VoidDialogComponent, { width: '460px', maxWidth: '96vw', data: { orderId: order._id, reference: order.receiptNo } })
      .afterClosed()
      .subscribe((voided: unknown) => {
        if (!voided) return;
        this.snackBar.open($localize`Order voided`, $localize`Close`, { duration: 3000 });
        this.dataSource.reload();
      });
  }

  printRefund(refund: Refund): void {
    if (refund.pendingSync) return;
    const sending = this.snackBar.open($localize`Sending to printer...`, '', { duration: 0 });
    this.printJobService.printRefund(refund._id).subscribe({
      next: (response) => {
        sending.dismiss();
        this.snackBar.open(response.success ? response.message || $localize`Print job created` : $localize`Failed to create print job`, $localize`Close`, { duration: 4000 });
      },
      error: (error) => {
        sending.dismiss();
        this.snackBar.open($localize`Print failed: ${error.error?.error || error.message}`, $localize`Close`, { duration: 5000 });
      },
    });
  }

  /** A sale that took money is a financial record: it is refunded or voided, never deleted. */
  isPaid(order: any): boolean {
    return !!order?._unsynced || order?.paymentStatus === 'Paid' || (order?.refundedAmount || 0) > 0;
  }

  private deleteFailed(err: any): void {
    this.snackBar.open(err?.error?.message || $localize`The receipt could not be deleted.`, $localize`Close`, { duration: 6000 });
  }

  deleteReceipt(orderId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: $localize`Delete Receipt`,
        message: $localize`Are you sure you want to delete this receipt? This action cannot be undone.`,
        confirmText: $localize`Delete`,
        cancelText: $localize`Cancel`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.isDeleting.set(true);
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.dataSource.reload();
        },
        error: (err) => {
          console.error('Error deleting receipt:', err);
          this.isDeleting.set(false);
          this.deleteFailed(err);
        },
      });
    });
  }

  // ---- selection (only rows that may be deleted can be ticked) -------------------------------------
  deletable(): any[] {
    return this.pagedRows().filter((r) => !this.isPaid(r));
  }

  toggleAllRows(checked: boolean) {
    if (checked) this.selection.select(...this.deletable());
    else this.selection.clear();
  }

  isAllSelected(): boolean {
    const rows = this.deletable();
    return rows.length > 0 && rows.every((r) => this.selection.isSelected(r));
  }

  deleteMultiple() {
    const selectedReceipts = this.selection.selected.filter((r: any) => !this.isPaid(r));
    if (selectedReceipts.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: $localize`Delete Multiple Receipts`,
        message: $localize`Are you sure you want to delete ${selectedReceipts.length} receipt(s)? This action cannot be undone.`,
        confirmText: $localize`Delete`,
        cancelText: $localize`Cancel`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.isDeleting.set(true);
      Promise.all(selectedReceipts.map((receipt) => this.orderService.deleteOrder(receipt._id).toPromise())).then(
        () => {
          this.isDeleting.set(false);
          this.selection.clear();
          this.dataSource.reload();
        },
        (error) => {
          console.error('Error deleting receipts:', error);
          this.isDeleting.set(false);
          this.dataSource.reload();
          this.deleteFailed(error);
        },
      );
    });
  }

  // ---- export ----------------------------------------------------------------------------------
  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    const filename = this.isRefundTab() ? 'refunds' : 'receipts';
    if (this.isRefundTab()) {
      const rows = this.refundRows().map((r: any) => ({
        'Refund No': r.refundNumber,
        'Sale': r.orderReference,
        'Date': this.exportService.formatDateTime(r.createdAt),
        'Reason': refundReasonLabel(r.reasonCode),
        'Items': this.refundSummary(r),
        'Refunded via': this.refundMethods(r),
        'By': r.createdBy?.name || '',
        'Amount': r.total,
      }));
      if (format === 'excel') this.exportService.exportToExcel(rows, filename);
      else this.exportService.exportToCSV(rows, filename);
      return;
    }

    const data = this.rows();
    if (!data.length) return;
    switch (format) {
      case 'pdf':
        this.exportService.exportToPdf(data, filename, { from: this.query()!['start'], to: this.query()!['end'] });
        break;
      case 'csv':
        this.exportService.exportToCSV(data, filename);
        break;
      case 'excel': {
        const excelData = data.map((item: any) => ({
          'Receipt No': item.receiptNo,
          'Date': this.exportService.formatDateTime(item.date),
          'Status': this.statusOf(item).label,
          'Order Type': item.ordertype,
          'Payment Type': item.type,
          'Ordered By': item.orderedBy?.name || 'N/A',
          'Served By': item.servedBy?.name || 'N/A',
          'Grand Total': item.total || 0,
          'Discount': item.discount || 0,
          'Refunded': item.refundedAmount || 0,
        }));
        excelData.push({
          'Receipt No': '', 'Date': '', 'Status': '', 'Order Type': '', 'Payment Type': '', 'Ordered By': 'Grand Total', 'Served By': '',
          'Grand Total': data.reduce((sum: number, item: any) => sum + (item.total || 0), 0),
          'Discount': data.reduce((sum: number, item: any) => sum + (item.discount || 0), 0),
          'Refunded': data.reduce((sum: number, item: any) => sum + (item.refundedAmount || 0), 0),
        });
        this.exportService.exportToExcel(excelData, filename);
        break;
      }
    }
  }
}
