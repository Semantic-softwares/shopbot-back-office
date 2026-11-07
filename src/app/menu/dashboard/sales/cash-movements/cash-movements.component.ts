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
import { MinorPipe } from '../../../../shared/register/minor.pipe';
import { RegisterApiService } from '../../../../shared/register/register-api.service';
import { RegisterContextService } from '../../../../shared/register/register-context.service';
import { fromMinor } from '../../../../shared/register/register-money';
import { StoreMovement } from '../../../../shared/register/register.models';
import { QueryParamService } from '../../../../shared/services/query-param.service';
import { ExportColumn, ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ReportKpiComponent } from '../../reports/shared/report-kpi.component';
import { ExportFormat, ReportPageComponent } from '../../reports/shared/report-page.component';
import { ReportTable } from '../../reports/shared/report-table-state';

const OUT = ['cash_out', 'cash_deposit', 'cash_transfer_out', 'cash_refund'];

/** Every cash movement made by hand in the store: added to or taken out of a drawer. Recorded once, never edited; a mistake shows as a reversal. */
@Component({
  selector: 'app-cash-movements-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MinorPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, DateRangeSelectorComponent, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-report-page title="Cash movements" i18n-title subtitle="Cash put into or taken out of a drawer: who, why and how much." i18n-subtitle [exportDisabled]="!rows().length" (export)="exportData($event)">
      <ng-container filters>
        <date-range-selector />
        <div>
          <mat-form-field appearance="outline" class="compact-field">
            <mat-label i18n>Type</mat-label>
            <mat-select [value]="type()" (selectionChange)="type.set($event.value)" data-testid="movements-type-filter">
              <mat-option value=""><ng-container i18n>All movements</ng-container></mat-option>
              <mat-option value="cash_in"><ng-container i18n>Cash in</ng-container></mat-option>
              <mat-option value="cash_out"><ng-container i18n>Cash out</ng-container></mat-option>
              <mat-option value="cash_deposit"><ng-container i18n>Deposits</ng-container></mat-option>
              <mat-option value="cash_transfer_in"><ng-container i18n>Transfers in</ng-container></mat-option>
              <mat-option value="cash_transfer_out"><ng-container i18n>Transfers out</ng-container></mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div>
          <mat-form-field appearance="outline" class="compact-field">
            <mat-label i18n>Register</mat-label>
            <mat-select [value]="registerId()" (selectionChange)="registerId.set($event.value)" data-testid="movements-register-filter">
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
          <p class="m-0 font-semibold"><ng-container i18n>Could not load the cash movements.</ng-container></p>
          <button matButton="filled" (click)="res.reload()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else if (res.hasValue() && !rows().length) {
        <mat-card appearance="outlined"><mat-card-content class="flex flex-col items-center gap-2 !p-10 text-center" data-testid="movements-empty">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">payments</mat-icon>
          <p class="m-0 font-medium"><ng-container i18n>No cash movements in this period.</ng-container></p>
        </mat-card-content></mat-card>
      } @else if (rows().length) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <app-report-kpi label="Movements" i18n-label icon="swap_vert">{{ rows().length | number:'1.0-0' }}</app-report-kpi>
          <app-report-kpi label="Cash in" i18n-label icon="add_card">{{ totals().in | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Cash out" i18n-label icon="payments" tone="text-red-700">{{ totals().out | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Deposits" i18n-label icon="account_balance">{{ totals().deposits | currency: symbol() : 'symbol' : '1.2-2' }}</app-report-kpi>
        </div>

        <mat-card appearance="outlined" class="overflow-x-auto max-md:!hidden">
          <table class="w-full min-w-[860px] text-sm" data-testid="movements-table">
            <thead><tr class="border-b border-outline-variant bg-surface-container text-left text-xs uppercase tracking-wide text-on-surface-variant">
              <th class="px-3 py-2"><ng-container i18n>When</ng-container></th><th class="px-3 py-2"><ng-container i18n>Register</ng-container></th><th class="px-3 py-2"><ng-container i18n>Type</ng-container></th><th class="px-3 py-2"><ng-container i18n>Reason</ng-container></th><th class="px-3 py-2"><ng-container i18n>By</ng-container></th><th class="px-3 py-2 text-right"><ng-container i18n>Amount</ng-container></th>
            </tr></thead>
            <tbody>
              @for (m of table.rows(); track m._id) {
                <tr class="border-b border-outline-variant last:border-0" [attr.data-testid]="'movement-row-' + m.type">
                  <td class="px-3 py-2">{{ (m.at ?? m.createdAt) | date: 'medium' }}</td>
                  <td class="px-3 py-2">{{ reg(m).name }} <span class="text-on-surface-variant">· {{ reg(m).code }}</span></td>
                  <td class="px-3 py-2">{{ label(m) }}@if (m.late) { <span class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900"><ng-container i18n>Late</ng-container></span> }</td>
                  <td class="px-3 py-2">{{ m.reason }}</td>
                  <td class="px-3 py-2">{{ m.performedBy?.name || '—' }}@if (m.approvedBy) { <div class="text-xs text-on-surface-variant"><ng-container i18n>Approved by</ng-container> {{ m.approvedBy.name }}</div> }</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ outflow(m) ? '-' : '' }}{{ m.amountMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <mat-paginator [length]="rows().length" [pageSize]="table.pageSize()" [pageIndex]="table.pageIndex()" [pageSizeOptions]="[10, 25, 50]" (page)="table.onPage($event)" />
        </mat-card>

        <div class="flex flex-col gap-2 md:hidden">
          @for (m of table.rows(); track m._id) {
            <mat-card appearance="outlined"><mat-card-content class="!p-3">
              <div class="flex items-start justify-between gap-2"><div><div class="font-semibold">{{ label(m) }}</div><div class="text-xs text-on-surface-variant">{{ reg(m).name }} · {{ (m.at ?? m.createdAt) | date: 'short' }}</div></div><span class="tabular-nums">{{ outflow(m) ? '-' : '' }}{{ m.amountMinor | minor: exponent() | currency: symbol() : 'symbol' : '1.2-2' }}</span></div>
              <div class="mt-1 text-sm text-on-surface-variant">{{ m.reason }} · {{ m.performedBy?.name || '—' }}</div>
            </mat-card-content></mat-card>
          }
        </div>
      }
    </app-report-page>
  `,
})
export class CashMovementsPageComponent {
  private readonly api = inject(RegisterApiService);
  private readonly ctx = inject(RegisterContextService);
  private readonly exporter = inject(ReportExportService);
  private readonly queryParams = inject(QueryParamService);
  readonly storeStore = inject(StoreStore);
  private readonly query = toSignal(this.queryParams.getAllParams$);

  readonly type = signal('');
  readonly registerId = signal('');
  readonly symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  readonly exponent = computed(() => this.ctx.exponent());

  readonly registers = rxResource({ params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.ctx.enabled() }), stream: ({ params }) => (params.storeId && params.on ? this.api.registers(params.storeId) : of([])) });
  readonly res = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, on: this.ctx.enabled(), query: this.query(), type: this.type(), registerId: this.registerId() }),
    stream: ({ params }) => (params.storeId && params.on ? this.api.storeMovements(params.storeId, { from: params.query?.['start'], to: params.query?.['end'], type: params.type || undefined, registerId: params.registerId || undefined, limit: '200' }) : of({ data: [], total: 0, page: 1, limit: 0 })),
  });
  readonly rows = computed<StoreMovement[]>(() => (this.res.hasValue() ? this.res.value().data : []));
  readonly table = new ReportTable<StoreMovement>(() => this.rows(), 'at');
  readonly totals = computed(() => {
    const sum = (types: string[]) => this.rows().filter((m) => types.includes(m.type)).reduce((s, m) => s + (m.reversalOf ? -m.amountMinor : m.amountMinor), 0);
    const e = this.exponent();
    return { in: fromMinor(sum(['cash_in', 'cash_transfer_in']), e), out: fromMinor(sum(['cash_out', 'cash_transfer_out']), e), deposits: fromMinor(sum(['cash_deposit']), e) };
  });

  reg(m: StoreMovement): { name: string; code: string } {
    return typeof m.registerId === 'string' ? { name: '—', code: '' } : m.registerId;
  }
  outflow(m: StoreMovement): boolean {
    return OUT.includes(m.type) !== !!m.reversalOf;
  }
  label(m: StoreMovement): string {
    const base = m.type === 'cash_in' ? $localize`Cash in` : m.type === 'cash_out' ? $localize`Cash out` : m.type === 'cash_deposit' ? $localize`Deposit` : m.type === 'cash_transfer_in' ? $localize`Transfer in` : $localize`Transfer out`;
    return m.reversalOf ? $localize`${base} (reversal)` : base;
  }

  exportData(format: ExportFormat): void {
    const columns: ExportColumn[] = [
      { key: 'at', label: $localize`When`, type: 'datetime' },
      { key: 'register', label: $localize`Register`, type: 'text' },
      { key: 'type', label: $localize`Type`, type: 'text' },
      { key: 'reason', label: $localize`Reason`, type: 'text' },
      { key: 'by', label: $localize`By`, type: 'text' },
      { key: 'amount', label: $localize`Amount`, type: 'currency' },
    ];
    this.exporter.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Cash movements`,
      storeName: this.storeStore.selectedStore()?.name ?? '',
      currency: this.storeStore.selectedStore()?.currencyCode || 'MUR',
      columns,
      rows: this.rows().map((m) => ({ at: m.at ?? m.createdAt, register: this.reg(m).name, type: this.label(m), reason: m.reason, by: m.performedBy?.name ?? '', amount: (this.outflow(m) ? -1 : 1) * fromMinor(m.amountMinor, this.exponent()) })),
      filename: 'cash-movements',
      landscape: true,
    });
  }
}
