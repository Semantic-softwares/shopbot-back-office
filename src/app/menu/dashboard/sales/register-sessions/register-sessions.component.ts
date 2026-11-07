import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DateRangeSelectorComponent } from '../../../../shared/components/date-range-selector/date-range-selector.component';
import { MinorPipe } from '../../../../shared/register/minor.pipe';
import { RegisterApiService } from '../../../../shared/register/register-api.service';
import { RegisterContextService } from '../../../../shared/register/register-context.service';
import { SessionRow } from '../../../../shared/register/register.models';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportColumn, ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../../reports/shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../../reports/shared/report-page.component';
import { ReportTable } from '../../reports/shared/report-table-state';
import { chipTone, reconciliationLabel, reconciliationTone, sessionStatusLabel, sessionTone, varianceTone } from '../sales-common';
import { fromMinor } from '../../../../shared/register/register-money';

/** Every register opening: who worked it, what the drawer should hold and how it closed. One row per session, newest first. */
@Component({
  selector: 'app-register-sessions',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MinorPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-report-page title="Register sessions" i18n-title subtitle="Every register opening: who worked it, what it should hold and how it closed." i18n-subtitle [exportDisabled]="!rows().length" (export)="exportData($event)">
      <ng-container filters>
        <date-range-selector />
        <div>
          <mat-form-field appearance="outline" class="compact-field">
            <mat-label i18n>Status</mat-label>
            <mat-select [value]="status()" (selectionChange)="status.set($event.value)" data-testid="sessions-status-filter">
              <mat-option value=""><ng-container i18n>All sessions</ng-container></mat-option>
              <mat-option value="open"><ng-container i18n>Open</ng-container></mat-option>
              <mat-option value="closing"><ng-container i18n>Closing</ng-container></mat-option>
              <mat-option value="closed"><ng-container i18n>Closed</ng-container></mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div>
          <mat-form-field appearance="outline" class="compact-field">
            <mat-label i18n>Register</mat-label>
            <mat-select [value]="registerId()" (selectionChange)="registerId.set($event.value)" data-testid="sessions-register-filter">
              <mat-option value=""><ng-container i18n>All registers</ng-container></mat-option>
              @for (r of registers.value() ?? []; track r._id) { <mat-option [value]="r._id">{{ r.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
      </ng-container>

      @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (res.error() && !res.hasValue()) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">error</mat-icon>
          <p class="m-0 font-semibold"><ng-container i18n>Could not load the register sessions.</ng-container></p>
          <button matButton="filled" (click)="res.reload()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else if (res.hasValue() && !rows().length) {
        <mat-card appearance="outlined"><mat-card-content class="flex flex-col items-center gap-2 !p-10 text-center" data-testid="sessions-empty">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">point_of_sale</mat-icon>
          <p class="m-0 font-medium"><ng-container i18n>No register sessions in this period.</ng-container></p>
          <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Try another date range or filter.</ng-container></p>
        </mat-card-content></mat-card>
      } @else if (rows().length) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <app-report-kpi label="Sessions" i18n-label icon="point_of_sale">{{ counts().all | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="Open now" i18n-label icon="lock_open">{{ counts().open | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="With a difference" i18n-label icon="balance" tone="text-red-700">{{ counts().different | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="Not yet reconciled" i18n-label icon="pending_actions">{{ counts().unreconciled | number:'1.0-0' }}</app-report-kpi>
        </div>

        <mat-card appearance="outlined" class="overflow-x-auto max-md:!hidden">
          <table class="w-full min-w-[960px] text-sm" data-testid="sessions-table">
            <thead>
              <tr class="border-b border-outline-variant bg-surface-container text-left text-xs uppercase tracking-wide text-on-surface-variant">
                <th class="px-3 py-2"><ng-container i18n>Register</ng-container></th>
                <th class="px-3 py-2"><ng-container i18n>Cashier</ng-container></th>
                <th class="px-3 py-2"><ng-container i18n>Opened</ng-container></th>
                <th class="px-3 py-2 text-right"><ng-container i18n>Opening float</ng-container></th>
                <th class="px-3 py-2 text-right"><ng-container i18n>Expected cash</ng-container></th>
                <th class="px-3 py-2 text-right"><ng-container i18n>Counted</ng-container></th>
                <th class="px-3 py-2 text-right"><ng-container i18n>Difference</ng-container></th>
                <th class="px-3 py-2"><ng-container i18n>Status</ng-container></th>
              </tr>
            </thead>
            <tbody>
              @for (r of table.rows(); track r._id) {
                <tr class="cursor-pointer border-b border-outline-variant last:border-0 hover:bg-surface-container" (click)="open(r)" tabindex="0" (keydown.enter)="open(r)" [attr.data-testid]="'session-row-' + r._id">
                  <td class="px-3 py-2"><div class="font-medium">{{ r.registerId.name }}</div><div class="text-xs text-on-surface-variant">{{ r.registerId.code }} · @if (r.registerId.operatingMode === 'shared') { <ng-container i18n>Shared</ng-container> } @else { <ng-container i18n>Individual</ng-container> }</div></td>
                  <td class="px-3 py-2">{{ cashier(r) }}</td>
                  <td class="px-3 py-2">{{ r.openedAt | date: 'medium' }}@if (r.closedAt) { <div class="text-xs text-on-surface-variant"><ng-container i18n>Closed</ng-container> {{ r.closedAt | date: 'medium' }}</div> }</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ r.openingFloatMinor | minor: r.exponent | currency: symbol() : 'symbol' : digits(r.exponent) }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ r.expectedCashMinor | minor: r.exponent | currency: symbol() : 'symbol' : digits(r.exponent) }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ r.actualCashMinor | minor: r.exponent | currency: symbol() : 'symbol' : digits(r.exponent) }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">@if (r.cashVarianceMinor !== undefined && r.cashVarianceMinor !== null) { <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(varianceTone(r.cashVarianceMinor))">{{ r.cashVarianceMinor > 0 ? '+' : '' }}{{ r.cashVarianceMinor | minor: r.exponent | currency: symbol() : 'symbol' : digits(r.exponent) }}</span> } @else { — }</td>
                  <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(sessionTone(r.status))">{{ statusLabel(r.status) }}</span>@if (r.status === 'closed') { <span class="ml-1 rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(reconTone(r.reconciliationStatus))">{{ reconLabel(r.reconciliationStatus) }}</span> }</td>
                </tr>
              }
            </tbody>
          </table>
          <mat-paginator [length]="rows().length" [pageSize]="table.pageSize()" [pageIndex]="table.pageIndex()" [pageSizeOptions]="[10, 25, 50]" (page)="table.onPage($event)" />
        </mat-card>

        <div class="flex flex-col gap-2 md:hidden" data-testid="sessions-cards">
          @for (r of table.rows(); track r._id) {
            <mat-card appearance="outlined" (click)="open(r)" class="cursor-pointer">
              <mat-card-content class="!p-3">
                <div class="flex items-start justify-between gap-2">
                  <div><div class="font-semibold">{{ r.registerId.name }} <span class="font-normal text-on-surface-variant">· {{ r.registerId.code }}</span></div><div class="text-xs text-on-surface-variant">{{ cashier(r) }} · {{ r.openedAt | date: 'short' }}</div></div>
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(sessionTone(r.status))">{{ statusLabel(r.status) }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between text-sm"><span class="text-on-surface-variant"><ng-container i18n>Expected</ng-container></span><span class="tabular-nums">{{ r.expectedCashMinor | minor: r.exponent | currency: symbol() : 'symbol' : digits(r.exponent) }}</span></div>
                @if (r.cashVarianceMinor !== undefined && r.cashVarianceMinor !== null) { <div class="flex items-center justify-between text-sm"><span class="text-on-surface-variant"><ng-container i18n>Difference</ng-container></span><span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(varianceTone(r.cashVarianceMinor))">{{ r.cashVarianceMinor | minor: r.exponent | currency: symbol() : 'symbol' : digits(r.exponent) }}</span></div> }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </app-report-page>
  `,
})
export class RegisterSessionsComponent {
  private readonly api = inject(RegisterApiService);
  private readonly ctx = inject(RegisterContextService);
  private readonly router = inject(Router);
  private readonly exporter = inject(ReportExportService);
  private readonly queryParams = inject(QueryParamService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);

  readonly status = signal('');
  readonly registerId = signal('');
  readonly sessionStatusLabel = sessionStatusLabel;
  readonly statusLabel = sessionStatusLabel;
  readonly reconLabel = reconciliationLabel;
  readonly reconTone = reconciliationTone;
  readonly sessionTone = sessionTone;
  readonly varianceTone = varianceTone;
  readonly tone = chipTone;

  readonly symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  readonly digits = (exponent: number) => (exponent ? '1.2-2' : '1.0-0');

  readonly registers = rxResource({ params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.ctx.enabled() }), stream: ({ params }) => (params.storeId && params.on ? this.api.registers(params.storeId) : of([])) });
  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.ctx.enabled(), query: this.query(), status: this.status(), registerId: this.registerId() }),
    stream: ({ params }) =>
      params.storeId && params.on
        ? this.api.sessions(params.storeId, { from: params.query?.['start'], to: params.query?.['end'], status: params.status || undefined, registerId: params.registerId || undefined, limit: '200' })
        : of({ data: [], total: 0, page: 1, limit: 0 }),
  });

  readonly rows = computed<SessionRow[]>(() => (this.res.hasValue() ? (this.res.value().data as unknown as SessionRow[]) : []));
  readonly table = new ReportTable<SessionRow>(() => this.rows(), 'openedAt');
  readonly counts = computed(() => {
    const r = this.rows();
    return {
      all: r.length,
      open: r.filter((x) => x.status !== 'closed').length,
      different: r.filter((x) => x.status === 'closed' && (x.cashVarianceMinor ?? 0) !== 0).length,
      unreconciled: r.filter((x) => x.status === 'closed' && x.reconciliationStatus !== 'reconciled').length,
    };
  });

  cashier(r: SessionRow): string {
    const names = (r.activeCashiers ?? []).map((c) => c.name).filter(Boolean);
    return names.length ? names.join(', ') : (r.openedBy?.name ?? '—');
  }

  open(r: SessionRow): void {
    this.router.navigate(['/menu/erp/sales/sessions', r._id]);
  }

  exportData(format: ExportFormat): void {
    const exp = (m: number | null | undefined, e: number) => (m === null || m === undefined ? null : fromMinor(m, e));
    const columns: ExportColumn[] = [
      { key: 'register', label: $localize`Register`, type: 'text' },
      { key: 'cashier', label: $localize`Cashier`, type: 'text' },
      { key: 'openedAt', label: $localize`Opened`, type: 'datetime' },
      { key: 'closedAt', label: $localize`Closed`, type: 'datetime' },
      { key: 'opening', label: $localize`Opening float`, type: 'currency' },
      { key: 'expected', label: $localize`Expected cash`, type: 'currency' },
      { key: 'actual', label: $localize`Counted`, type: 'currency' },
      { key: 'variance', label: $localize`Difference`, type: 'currency' },
      { key: 'status', label: $localize`Status`, type: 'text' },
    ];
    this.exporter.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Register sessions`,
      storeName: this.storeStore.selectedStore()?.name ?? '',
      currency: this.storeStore.selectedStore()?.currencyCode || 'MUR',
      columns,
      rows: this.rows().map((r) => ({ register: `${r.registerId.name} (${r.registerId.code})`, cashier: this.cashier(r), openedAt: r.openedAt, closedAt: r.closedAt ?? null, opening: exp(r.openingFloatMinor, r.exponent), expected: exp(r.expectedCashMinor, r.exponent), actual: exp(r.actualCashMinor, r.exponent), variance: exp(r.cashVarianceMinor, r.exponent), status: `${sessionStatusLabel(r.status)}${r.status === 'closed' ? ` · ${reconciliationLabel(r.reconciliationStatus)}` : ''}` })),
      filename: 'register-sessions',
      landscape: true,
    });
  }
}
