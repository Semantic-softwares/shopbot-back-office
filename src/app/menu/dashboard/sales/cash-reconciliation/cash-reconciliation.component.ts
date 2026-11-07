import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { MinorPipe } from '../../../../shared/register/minor.pipe';
import { RegisterApiService } from '../../../../shared/register/register-api.service';
import { RegisterContextService } from '../../../../shared/register/register-context.service';
import { fromMinor } from '../../../../shared/register/register-money';
import { SessionRow } from '../../../../shared/register/register.models';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportColumn, ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../../reports/shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../../reports/shared/report-page.component';
import { ReportTable } from '../../reports/shared/report-table-state';
import { chipTone, reconciliationLabel, reconciliationTone, varianceTone } from '../sales-common';

type Focus = '' | 'differences' | 'review';

/**
 * Closed registers against their cash: what each should have held, what was counted, the difference, and whether anyone still has to
 * look at it. Differences and anything provisional or late come first, because that is where a manager's attention is needed.
 */
@Component({
  selector: 'app-cash-reconciliation',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MinorPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-report-page title="Cash reconciliation" i18n-title subtitle="Closed registers: expected cash, counted cash and what is left to review." i18n-subtitle [exportDisabled]="!rows().length" (export)="exportData($event)">
      <ng-container filters>
        <date-range-selector />
        <div>
          <mat-form-field appearance="outline" class="compact-field">
            <mat-label i18n>Show</mat-label>
            <mat-select [value]="focus()" (selectionChange)="focus.set($event.value)" data-testid="recon-focus">
              <mat-option value=""><ng-container i18n>All closed registers</ng-container></mat-option>
              <mat-option value="differences"><ng-container i18n>Only with a difference</ng-container></mat-option>
              <mat-option value="review"><ng-container i18n>Needs review</ng-container></mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </ng-container>

      @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (res.error() && !res.hasValue()) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">error</mat-icon>
          <p class="m-0 font-semibold"><ng-container i18n>Could not load the reconciliation.</ng-container></p>
          <button matButton="filled" (click)="res.reload()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else if (res.hasValue() && !all().length) {
        <mat-card appearance="outlined"><mat-card-content class="flex flex-col items-center gap-2 !p-10 text-center" data-testid="recon-empty">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">balance</mat-icon>
          <p class="m-0 font-medium"><ng-container i18n>No closed registers in this period.</ng-container></p>
        </mat-card-content></mat-card>
      } @else if (res.hasValue()) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="recon-kpis">
          <app-report-kpi label="Closed registers" i18n-label icon="lock">{{ all().length | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="Shortages" i18n-label icon="trending_down" tone="text-red-700">{{ totals().shortage | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Surpluses" i18n-label icon="trending_up">{{ totals().surplus | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Needs review" i18n-label icon="pending_actions">{{ totals().review | number:'1.0-0' }}</app-report-kpi>
        </div>

        <mat-card appearance="outlined" class="overflow-x-auto max-md:!hidden">
          <table class="w-full min-w-[900px] text-sm" data-testid="recon-table">
            <thead><tr class="border-b border-outline-variant bg-surface-container text-left text-xs uppercase tracking-wide text-on-surface-variant">
              <th class="px-3 py-2"><ng-container i18n>Register</ng-container></th><th class="px-3 py-2"><ng-container i18n>Closed</ng-container></th><th class="px-3 py-2 text-right"><ng-container i18n>Expected</ng-container></th><th class="px-3 py-2 text-right"><ng-container i18n>Counted</ng-container></th><th class="px-3 py-2 text-right"><ng-container i18n>Difference</ng-container></th><th class="px-3 py-2"><ng-container i18n>Status</ng-container></th>
            </tr></thead>
            <tbody>
              @for (r of table.rows(); track r._id) {
                <tr class="cursor-pointer border-b border-outline-variant last:border-0 hover:bg-surface-container" (click)="open(r)" tabindex="0" (keydown.enter)="open(r)" [attr.data-testid]="'recon-row-' + r._id">
                  <td class="px-3 py-2"><div class="font-medium">{{ r.registerId.name }}</div><div class="text-xs text-on-surface-variant">{{ cashier(r) }}</div></td>
                  <td class="px-3 py-2">{{ r.closedAt | date: 'medium' }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ r.expectedCashMinor | minor: r.exponent | currency: symbol() : 'symbol' : '1.2-2' }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ r.actualCashMinor | minor: r.exponent | currency: symbol() : 'symbol' : '1.2-2' }}</td>
                  <td class="px-3 py-2 text-right"><span class="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums" [class]="tone(varianceTone(r.cashVarianceMinor))">{{ (r.cashVarianceMinor ?? 0) > 0 ? '+' : '' }}{{ r.cashVarianceMinor | minor: r.exponent | currency: symbol() : 'symbol' : '1.2-2' }}</span></td>
                  <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(reconTone(r.reconciliationStatus))">{{ reconLabel(r.reconciliationStatus) }}</span></td>
                </tr>
              }
            </tbody>
          </table>
          <mat-paginator [length]="rows().length" [pageSize]="table.pageSize()" [pageIndex]="table.pageIndex()" [pageSizeOptions]="[10, 25, 50]" (page)="table.onPage($event)" />
        </mat-card>

        <div class="flex flex-col gap-2 md:hidden">
          @for (r of table.rows(); track r._id) {
            <mat-card appearance="outlined" (click)="open(r)" class="cursor-pointer"><mat-card-content class="!p-3">
              <div class="flex items-start justify-between gap-2"><div><div class="font-semibold">{{ r.registerId.name }}</div><div class="text-xs text-on-surface-variant">{{ r.closedAt | date: 'short' }} · {{ cashier(r) }}</div></div><span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(reconTone(r.reconciliationStatus))">{{ reconLabel(r.reconciliationStatus) }}</span></div>
              <div class="mt-2 flex items-center justify-between text-sm"><span class="text-on-surface-variant"><ng-container i18n>Difference</ng-container></span><span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(varianceTone(r.cashVarianceMinor))">{{ r.cashVarianceMinor | minor: r.exponent | currency: symbol() : 'symbol' : '1.2-2' }}</span></div>
            </mat-card-content></mat-card>
          }
        </div>
      }
    </app-report-page>
  `,
})
export class CashReconciliationComponent {
  private readonly api = inject(RegisterApiService);
  private readonly ctx = inject(RegisterContextService);
  private readonly router = inject(Router);
  private readonly exporter = inject(ReportExportService);
  private readonly queryParams = inject(QueryParamService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);

  readonly focus = signal<Focus>('');
  readonly reconLabel = reconciliationLabel;
  readonly reconTone = reconciliationTone;
  readonly varianceTone = varianceTone;
  readonly tone = chipTone;
  readonly symbol = computed(() => this.storeStore.selectedStore()?.currency || '');

  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.ctx.enabled(), query: this.query() }),
    stream: ({ params }) => (params.storeId && params.on ? this.api.sessions(params.storeId, { from: params.query?.['start'], to: params.query?.['end'], status: 'closed', limit: '200' }) : of({ data: [], total: 0, page: 1, limit: 0 })),
  });
  readonly all = computed<SessionRow[]>(() => (this.res.hasValue() ? (this.res.value().data as unknown as SessionRow[]) : []));
  private readonly needsReview = (r: SessionRow) => r.reconciliationStatus !== 'reconciled';
  readonly rows = computed(() => {
    const f = this.focus();
    // Differences and anything still to review first.
    return this.all()
      .filter((r) => (f === 'differences' ? (r.cashVarianceMinor ?? 0) !== 0 : f === 'review' ? this.needsReview(r) : true))
      .sort((a, b) => Number(this.needsReview(b)) - Number(this.needsReview(a)) || Math.abs(b.cashVarianceMinor ?? 0) - Math.abs(a.cashVarianceMinor ?? 0));
  });
  readonly table = new ReportTable<SessionRow>(() => this.rows(), '');
  readonly totals = computed(() => {
    const e = this.ctx.exponent();
    const neg = this.all().filter((r) => (r.cashVarianceMinor ?? 0) < 0).reduce((s, r) => s + (r.cashVarianceMinor ?? 0), 0);
    const pos = this.all().filter((r) => (r.cashVarianceMinor ?? 0) > 0).reduce((s, r) => s + (r.cashVarianceMinor ?? 0), 0);
    return { shortage: fromMinor(neg, e), surplus: fromMinor(pos, e), review: this.all().filter(this.needsReview).length };
  });

  cashier(r: SessionRow): string {
    return r.openedBy?.name ?? '—';
  }
  open(r: SessionRow): void {
    this.router.navigate(['/menu/erp/sales/sessions', r._id]);
  }

  exportData(format: ExportFormat): void {
    const e = this.ctx.exponent();
    const columns: ExportColumn[] = [
      { key: 'register', label: $localize`Register`, type: 'text' },
      { key: 'cashier', label: $localize`Opened by`, type: 'text' },
      { key: 'closedAt', label: $localize`Closed`, type: 'datetime' },
      { key: 'expected', label: $localize`Expected`, type: 'currency' },
      { key: 'actual', label: $localize`Counted`, type: 'currency' },
      { key: 'variance', label: $localize`Difference`, type: 'currency' },
      { key: 'status', label: $localize`Status`, type: 'text' },
    ];
    this.exporter.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Cash reconciliation`,
      storeName: this.storeStore.selectedStore()?.name ?? '',
      currency: this.storeStore.selectedStore()?.currencyCode || 'MUR',
      columns,
      rows: this.rows().map((r) => ({ register: r.registerId.name, cashier: this.cashier(r), closedAt: r.closedAt ?? null, expected: r.expectedCashMinor === null ? null : fromMinor(r.expectedCashMinor, e), actual: r.actualCashMinor === undefined ? null : fromMinor(r.actualCashMinor, e), variance: r.cashVarianceMinor === undefined ? null : fromMinor(r.cashVarianceMinor, e), status: reconciliationLabel(r.reconciliationStatus) })),
      filename: 'cash-reconciliation',
      landscape: true,
    });
  }
}
