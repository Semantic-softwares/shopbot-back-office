import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PO_STATUS_LABELS, PO_STATUS_TONES, PurchaseOrder, PurchasingService } from '../../../../shared/services/purchasing.service';
import { RolesService } from '../../../../shared/services/roles.service';
import { SuppliersService } from '../../../../shared/services/suppliers.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { PoConfirmDialogComponent, PoInvoiceDialogComponent, PoReasonDialogComponent, PoReceiveDialogComponent, PoSendDialogComponent } from './po-dialogs';

const EVENT_LABELS: Record<string, () => string> = {
  created: () => $localize`Order created`,
  edited: () => $localize`Draft edited`,
  amended: () => $localize`Order amended`,
  sent: () => $localize`Emailed to the supplier`,
  resent: () => $localize`Emailed to the supplier again`,
  send_failed: () => $localize`Email could not be sent`,
  supplier_confirmed: () => $localize`Supplier confirmed`,
  goods_received: () => $localize`Goods received`,
  cancelled: () => $localize`Order cancelled`,
  closed: () => $localize`Remaining balance closed`,
  invoice_recorded: () => $localize`Supplier invoice recorded`,
};

/** One purchase order: where it stands, what to do next, what arrived, who it was sent to, and its history. */
@Component({
  selector: 'app-po-detail',
  imports: [MatCardModule, MatTableModule, CurrencyPipe, DatePipe, DecimalPipe, RouterLink, PageHeaderComponent, MatButtonModule, MatDialogModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './po-detail.component.html',
})
export class PoDetailComponent {
  private readonly api = inject(PurchasingService);
  private readonly storeStore = inject(StoreStore);
  private readonly suppliersApi = inject(SuppliersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly roles = inject(RolesService);

  /** Follows the address: moving from one order to another reuses this component. */
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  readonly idSignal = computed(() => this.params().get('id') ?? '');
  get id() { return this.idSignal(); }
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currencyOf = (o: PurchaseOrder) => o.currency || this.storeStore.selectedStore()?.currency || '';
  private readonly refresh = signal(0);
  readonly columns = ['product', 'ordered', 'accepted', 'rejected', 'outstanding', 'unitCost', 'total'];
  readonly busy = signal(false);

  private readonly res = rxResource({ params: () => ({ s: this.storeId(), n: this.refresh(), id: this.idSignal() }), stream: ({ params }) => (params.s && params.id ? this.api.get(params.s, params.id) : of(null)) });
  readonly order = computed<PurchaseOrder | null>(() => (this.res.hasValue() ? this.res.value() : null));
  readonly failed = computed(() => !!this.res.error() && !this.order());

  private readonly can = (code: string) => this.roles.isAdmin() || this.roles.hasAny([code]);
  readonly canCreate = computed(() => this.can('erp.purchasing.create'));
  readonly canSend = computed(() => this.can('erp.purchasing.send'));
  readonly canConfirm = computed(() => this.can('erp.purchasing.confirm'));
  readonly canReceive = computed(() => this.can('erp.purchasing.receive'));
  readonly canResolve = computed(() => this.can('erp.purchasing.resolve'));
  readonly canAmend = computed(() => this.can('erp.purchasing.amend'));

  readonly status = computed(() => this.order()?.status);
  readonly waiting = computed(() => ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(this.status() ?? ''));
  readonly hasReceipts = computed(() => (this.order()?.receipts ?? []).length > 0);
  readonly statusLabel = (s: any) => PO_STATUS_LABELS[s as keyof typeof PO_STATUS_LABELS]?.() ?? s;
  readonly tone = (s: any) => PO_STATUS_TONES[s as keyof typeof PO_STATUS_TONES] ?? '';
  readonly eventLabel = (t: string) => EVENT_LABELS[t]?.() ?? t;
  readonly outstanding = (l: { quantity: number; accepted: number; rejected: number; cancelled: number }) => Math.max(0, Math.round((l.quantity - l.accepted - l.rejected - l.cancelled) * 1000) / 1000);
  readonly stuck = computed(() => (this.order()?.receipts ?? []).filter((r) => r.state === 'posting'));

  reload() { this.refresh.update((n) => n + 1); }
  private note(text: string) { this.snack.open(text, $localize`Close`, { duration: 3500 }); }
  private fail(e: any) { this.note(e?.error?.message || $localize`Something went wrong. Please try again.`); this.busy.set(false); }
  private done(text: string) { this.busy.set(false); this.note(text); this.reload(); }

  edit() { this.router.navigate(['/menu/erp/inventory/purchasing', this.id, 'edit']); }
  amend() { this.router.navigate(['/menu/erp/inventory/purchasing', this.id, 'amend']); }

  async send() {
    const o = this.order()!;
    let email = '';
    try { email = (await firstValueFrom(this.suppliersApi.getSupplier(o.supplier, this.storeId()))).email ?? ''; } catch { /* the dialog lets them type one */ }
    this.dialog.open(PoSendDialogComponent, { width: '560px', maxWidth: '95vw', data: { storeId: this.storeId(), order: o, supplierEmail: email } }).afterClosed().subscribe((r) => { if (r) this.done($localize`Purchase order sent.`); else this.reload(); });
  }
  confirm() { this.dialog.open(PoConfirmDialogComponent, { width: '480px', maxWidth: '95vw', data: { storeId: this.storeId(), order: this.order() } }).afterClosed().subscribe((r) => r && this.done($localize`Supplier confirmation recorded.`)); }
  invoice() { this.dialog.open(PoInvoiceDialogComponent, { width: '520px', maxWidth: '95vw', data: { storeId: this.storeId(), order: this.order() } }).afterClosed().subscribe((r) => r && this.done($localize`Invoice reference saved.`)); }
  receive() {
    this.dialog.open(PoReceiveDialogComponent, { width: '980px', maxWidth: '96vw', data: { storeId: this.storeId(), order: this.order(), canResolve: this.canResolve() } }).afterClosed().subscribe((r) => r && this.done($localize`Goods received and stock updated.`));
  }

  private reason(title: string, message: string, confirm: string, run: (reason: string) => void) {
    this.dialog.open(PoReasonDialogComponent, { width: '460px', maxWidth: '95vw', data: { title, message, confirm } }).afterClosed().subscribe((r) => r && run(r));
  }
  cancel() {
    this.reason($localize`Cancel this order`, $localize`The order is kept in your history but nothing more will be expected from the supplier.`, $localize`Cancel order`, (reason) => {
      this.busy.set(true);
      this.api.cancel(this.storeId(), this.id, reason).subscribe({ next: () => this.done($localize`Order cancelled.`), error: (e) => this.fail(e) });
    });
  }
  close() {
    this.reason($localize`Close the remaining balance`, $localize`What already arrived stays in stock. The part that never came is no longer expected.`, $localize`Close balance`, (reason) => {
      this.busy.set(true);
      this.api.close(this.storeId(), this.id, reason).subscribe({ next: () => this.done($localize`Remaining balance closed.`), error: (e) => this.fail(e) });
    });
  }
  resume(receiptId: string) {
    this.busy.set(true);
    this.api.resume(this.storeId(), receiptId).subscribe({ next: () => this.done($localize`Receipt finished.`), error: (e) => this.fail(e) });
  }
  pdf() {
    this.api.pdf(this.storeId(), this.id).subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60_000); },
      error: (e) => this.fail(e),
    });
  }
}
