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
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { BlinkApiService } from '../../../../shared/blink/blink-api.service';
import { BlinkContextService } from '../../../../shared/blink/blink-context.service';
import { BlinkPaymentRow } from '../../../../shared/blink/blink.models';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportColumn, ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportTable } from '../shared/report-table-state';

type Focus = '' | 'unattached' | 'success' | 'failed';

/**
 * Every Blink payment taken in the store. A payment the customer made that never reached a sale (the cashier cancelled, or it arrived
 * too late) is marked so the owner can reconcile it by hand: that money is real and is already in the merchant's Blink account.
 */
@Component({
  selector: 'app-blink-payments',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-report-page title="Blink payments" i18n-title subtitle="Payments taken through Blink, and which of them reached a sale." i18n-subtitle [exportDisabled]="!rows().length" (export)="exportData($event)">
      <ng-container filters>
        <date-range-selector />
        <div>
          <mat-form-field appearance="outline" class="compact-field">
            <mat-label i18n>Show</mat-label>
            <mat-select [value]="focus()" (selectionChange)="focus.set($event.value)" data-testid="blink-focus">
              <mat-option value=""><ng-container i18n>All payments</ng-container></mat-option>
              <mat-option value="unattached"><ng-container i18n>Paid but not on a sale</ng-container></mat-option>
              <mat-option value="success"><ng-container i18n>Paid</ng-container></mat-option>
              <mat-option value="failed"><ng-container i18n>Not completed</ng-container></mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </ng-container>

      @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (res.error() && !res.hasValue()) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
          <p class="m-0 font-semibold"><ng-container i18n>Could not load the Blink payments.</ng-container></p>
          <button matButton="filled" (click)="res.reload()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else if (res.hasValue() && !all().length) {
        <mat-card appearance="outlined"><mat-card-content class="flex flex-col items-center gap-2 !p-10 text-center" data-testid="blink-empty">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">bolt</mat-icon>
          <p class="m-0 font-medium"><ng-container i18n>No Blink payments in this period.</ng-container></p>
        </mat-card-content></mat-card>
      } @else if (res.hasValue()) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="blink-kpis">
          <app-report-kpi label="Received" i18n-label icon="bolt">{{ totals().received | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Payments" i18n-label icon="receipt_long">{{ totals().paid | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="Not completed" i18n-label icon="cancel">{{ totals().notDone | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="Paid but not on a sale" i18n-label icon="report" tone="text-red-700">{{ totals().unattached | number:'1.0-0' }}</app-report-kpi>
        </div>

        @if (totals().unattached) {
          <div class="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container" data-testid="blink-unattached-note">
            <ng-container i18n>Some customers paid through Blink but the payment never reached a sale (the sale was cancelled or the payment arrived late). The money is in your Blink account: record or refund it by hand.</ng-container>
          </div>
        }

        <mat-card appearance="outlined" class="overflow-x-auto max-md:!hidden">
          <table class="w-full min-w-[820px] text-sm" data-testid="blink-table">
            <thead><tr class="border-b border-outline-variant bg-surface-container text-left text-xs uppercase tracking-wide text-on-surface-variant">
              <th class="px-3 py-2"><ng-container i18n>When</ng-container></th><th class="px-3 py-2"><ng-container i18n>How</ng-container></th><th class="px-3 py-2"><ng-container i18n>Customer</ng-container></th><th class="px-3 py-2 text-right"><ng-container i18n>Amount</ng-container></th><th class="px-3 py-2"><ng-container i18n>Status</ng-container></th><th class="px-3 py-2"><ng-container i18n>Transaction</ng-container></th>
            </tr></thead>
            <tbody>
              @for (r of table.rows(); track r.id) {
                <tr class="border-b border-outline-variant last:border-0" [attr.data-testid]="'blink-row-' + r.id">
                  <td class="px-3 py-2">{{ r.createdAt | date: 'medium' }}</td>
                  <td class="px-3 py-2">{{ r.mode === 'qr' ? qrLabel : pushLabel }}</td>
                  <td class="px-3 py-2">{{ r.customerMobileMasked || '—' }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ r.amount | currency: symbol() : 'symbol' : '1.2-2' }}</td>
                  <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(r)">{{ label(r) }}</span></td>
                  <td class="px-3 py-2 text-xs">{{ r.transactionId || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <mat-paginator [length]="rows().length" [pageSize]="table.pageSize()" [pageIndex]="table.pageIndex()" [pageSizeOptions]="[10, 25, 50]" (page)="table.onPage($event)" />
        </mat-card>

        <div class="flex flex-col gap-2 md:hidden">
          @for (r of table.rows(); track r.id) {
            <mat-card appearance="outlined"><mat-card-content class="!p-3">
              <div class="flex items-start justify-between gap-2">
                <div><div class="font-semibold tabular-nums">{{ r.amount | currency: symbol() : 'symbol' : '1.2-2' }}</div><div class="text-xs text-on-surface-variant">{{ r.createdAt | date: 'short' }} · {{ r.mode === 'qr' ? qrLabel : pushLabel }}</div></div>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(r)">{{ label(r) }}</span>
              </div>
            </mat-card-content></mat-card>
          }
        </div>
      }
    </app-report-page>
  `,
})
export class BlinkPaymentsComponent {
  private readonly api = inject(BlinkApiService);
  private readonly blink = inject(BlinkContextService);
  private readonly exporter = inject(ReportExportService);
  private readonly queryParams = inject(QueryParamService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);

  readonly focus = signal<Focus>('');
  readonly qrLabel = $localize`QR code`;
  readonly pushLabel = $localize`Sent to phone`;
  readonly symbol = computed(() => this.storeStore.selectedStore()?.currency || '');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.blink.enabled(), query: this.query() }),
    stream: ({ params }) => (params.storeId && params.on ? this.api.list(params.storeId, { from: params.query?.['start'], to: params.query?.['end'] }) : of({ data: [] as BlinkPaymentRow[] })),
  });
  readonly all = computed<BlinkPaymentRow[]>(() => (this.res.hasValue() ? this.res.value().data : []));
  readonly rows = computed(() => {
    const f = this.focus();
    return this.all().filter((r) => (f === 'unattached' ? r.unattached : f === 'success' ? r.status === 'success' : f === 'failed' ? ['failed', 'expired', 'cancelled'].includes(r.status) : true));
  });
  readonly table = new ReportTable<BlinkPaymentRow>(() => this.rows(), '');
  readonly totals = computed(() => ({
    received: this.all().filter((r) => r.status === 'success').reduce((s, r) => s + r.amount, 0),
    paid: this.all().filter((r) => r.status === 'success').length,
    notDone: this.all().filter((r) => ['failed', 'expired', 'cancelled'].includes(r.status)).length,
    unattached: this.all().filter((r) => r.unattached).length,
  }));

  label(r: BlinkPaymentRow): string {
    if (r.unattached) return r.lateSuccess ? $localize`Paid late, not on a sale` : $localize`Paid, not on a sale`;
    return { success: $localize`Paid`, pending: $localize`Waiting`, failed: $localize`Failed`, expired: $localize`Expired`, cancelled: $localize`Cancelled` }[r.status];
  }
  tone(r: BlinkPaymentRow): string {
    if (r.unattached) return 'bg-error-container text-on-error-container';
    return r.status === 'success' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant';
  }

  exportData(format: ExportFormat): void {
    const columns: ExportColumn[] = [
      { key: 'when', label: $localize`When`, type: 'datetime' },
      { key: 'how', label: $localize`How`, type: 'text' },
      { key: 'amount', label: $localize`Amount`, type: 'currency' },
      { key: 'status', label: $localize`Status`, type: 'text' },
      { key: 'tx', label: $localize`Transaction`, type: 'text' },
    ];
    this.exporter.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Blink payments`,
      storeName: this.storeStore.selectedStore()?.name ?? '',
      currency: this.storeStore.selectedStore()?.currencyCode || 'MUR',
      columns,
      rows: this.rows().map((r) => ({ when: r.createdAt, how: r.mode === 'qr' ? this.qrLabel : this.pushLabel, amount: r.amount, status: this.label(r), tx: r.transactionId ?? '' })),
      filename: 'blink-payments',
      landscape: true,
    });
  }
}
