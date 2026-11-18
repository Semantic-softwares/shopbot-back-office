import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { Refund } from '../../models/refund.model';
import { TaxDisplay } from '../../tax/tax-display';
import { NOT_YET_FISCALIZED_TEXT } from '../../models/fiscal.model';
import { FiscalisationService } from '../../services/fiscalisation.service';
import { refundReasonLabel } from '../../../menu/pos/orders/refund-dialog/refund-dialog.component';

export interface CreditNoteReceiptData {
  refund: Refund;
  storeId: string;
  storeName: string;
  currency: string;
  /** The sale this credit note belongs to. */
  orderReference?: string;
  /** The invoice it credits, when the store reports to a tax authority. */
  originalInvoiceNumber?: string;
  /** The VAT this credit note carries (net taxable, each rate, total), or null when the store shows none. */
  tax?: TaxDisplay | null;
}

/**
 * A credit note's own receipt, kept inside the order it belongs to. Works with no connection and for a credit note still waiting
 * on this device: it already has its credit note number, and shows "Not Yet Fiscalized" where the QR goes until the tax authority
 * has accepted it (the QR then appears here by itself).
 */
@Component({
  selector: 'app-credit-note-receipt-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2"><mat-icon>receipt_long</mat-icon>{{ title() }}</h2>
    <mat-dialog-content>
      <div id="credit-note-receipt" class="mx-auto max-w-sm font-mono text-sm leading-relaxed" data-testid="credit-note-receipt">
        <p class="m-0 text-center text-base font-bold">{{ data.storeName }}</p>
        <p class="my-2 text-center text-lg font-bold tracking-wide">{{ title() }}</p>
        <hr class="my-2 border-dashed" />
        <div class="flex justify-between"><span>{{ fiscal() ? numberLabel : refundLabel }}</span><strong data-testid="cn-number">{{ number() }}</strong></div>
        @if (data.orderReference) { <div class="flex justify-between"><span i18n>Original sale</span><span>#{{ data.orderReference }}</span></div> }
        @if (data.originalInvoiceNumber) { <div class="flex justify-between"><span i18n>Original invoice</span><span data-testid="cn-original-invoice">{{ data.originalInvoiceNumber }}</span></div> }
        <div class="flex justify-between"><span i18n>Date</span><span>{{ data.refund.createdAt | date: 'medium' }}</span></div>
        <hr class="my-2 border-dashed" />
        <p class="m-0" data-testid="cn-items">{{ items() }}</p>
        <p class="m-0 text-xs opacity-70">{{ reason() }}</p>
        @if (data.refund.note) { <p class="m-0 text-xs italic opacity-70">{{ data.refund.note }}</p> }
        @if (methods()) { <div class="mt-1 flex justify-between"><span i18n>Refunded via</span><span>{{ methods() }}</span></div> }
        @if (data.tax; as tax) {
          <hr class="my-2 border-dashed" />
          <div class="flex justify-between" data-testid="cn-net"><span i18n>Net taxable amount</span><span>{{ tax.net | currency: data.currency : 'symbol' : '1.2-2' }}</span></div>
          @for (row of tax.rows; track row.label + row.rate) {
            <div class="flex justify-between" data-testid="cn-tax-row"><span>{{ row.label }} {{ row.rate }}%</span><span>{{ row.amount | currency: data.currency : 'symbol' : '1.2-2' }}</span></div>
          }
          <div class="flex justify-between font-bold" data-testid="cn-vat"><span i18n>Total VAT</span><span>{{ tax.total | currency: data.currency : 'symbol' : '1.2-2' }}</span></div>
        }
        <hr class="my-2 border-dashed" />
        <div class="flex justify-between text-base font-bold"><span i18n>TOTAL CREDITED</span><span data-testid="cn-total">{{ data.refund.total | currency: data.currency : 'symbol' : '1.2-2' }}</span></div>
        @if (fiscal()) {
          <hr class="my-2 border-dashed" />
          <div class="text-center">
            @if (view()?.qrCodePng; as qr) {
              <p class="m-0 text-xs font-bold" i18n>e-Invoice credit note</p>
              <img class="mx-auto mt-2 h-40 w-40 bg-white p-1" alt="Credit note QR code" i18n-alt data-testid="cn-qr" [src]="'data:image/png;base64,' + qr" />
            } @else if (viewRes.isLoading() && !view()) {
              <p class="m-0 text-xs opacity-70" i18n>Checking with the tax authority…</p>
            } @else {
              <p class="m-0 font-bold" data-testid="cn-not-yet">{{ notYet }}</p>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close i18n>Close</button>
      <button mat-flat-button type="button" (click)="print()" data-testid="cn-print"><mat-icon>print</mat-icon><ng-container i18n>Print</ng-container></button>
    </mat-dialog-actions>
  `,
})
export class CreditNoteReceiptDialogComponent {
  readonly data = inject<CreditNoteReceiptData>(MAT_DIALOG_DATA);
  private readonly fiscalisation = inject(FiscalisationService);
  readonly notYet = NOT_YET_FISCALIZED_TEXT;
  readonly numberLabel = $localize`Credit Note No.`;
  readonly refundLabel = $localize`Refund`;

  /** Only a store that reports to a tax authority issues a credit note; any other store gives a plain refund receipt. */
  readonly fiscal = computed(() => this.fiscalisation.active());
  readonly title = computed(() => (this.fiscal() ? $localize`CREDIT NOTE` : $localize`REFUND`));
  readonly number = computed(() => this.view()?.invoiceNumber || this.data.refund.refundNumber || '—');

  /** The credit note's own tag and QR (kept on the device once seen, so this opens offline). A waiting one has none yet. */
  readonly viewRes = rxResource({
    params: () => ({ storeId: this.data.storeId, id: this.data.refund._id, waiting: !!this.data.refund.pendingSync && !this.data.refund.refundNumber }),
    stream: ({ params }) => (this.fiscal() && !params.waiting ? this.fiscalisation.orderView(params.storeId, params.id) : of(null)),
  });
  readonly view = computed(() => (this.viewRes.hasValue() ? this.viewRes.value() : null));

  readonly items = computed(() => {
    const r = this.data.refund;
    if (r.summary) return r.summary;
    return r.lines?.length ? r.lines.map((l) => `${l.quantity} × ${l.name}`).join(', ') : $localize`Amount refund (no items)`;
  });
  readonly reason = computed(() => refundReasonLabel(this.data.refund.reasonCode));
  readonly methods = computed(() => (this.data.refund.tenders || []).map((t) => t.method).join(' + '));

  print(): void {
    const node = document.getElementById('credit-note-receipt');
    if (!node) return;
    const win = window.open('', '_blank', 'width=420,height=800');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${this.title()}</title><style>body{font-family:monospace;font-size:13px;margin:16px;max-width:340px}hr{border:0;border-top:1px dashed #000}.flex{display:flex}.justify-between{justify-content:space-between}.text-center{text-align:center}img{width:150px;height:150px}p{margin:2px 0}</style></head><body>${node.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}
