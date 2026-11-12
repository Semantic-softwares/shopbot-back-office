import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ReportExportService } from '../../../../shared/services/report-export.service';
import { ExportFormat, ReportPageComponent } from '../shared/report-page.component';
import { ReportKpiComponent } from '../shared/report-kpi.component';
import { AccountingTaxService } from '../../../../shared/services/accounting-tax.service';
import { Tax, TaxReport } from '../../../../shared/models/tax.model';
import { StoreStore } from '../../../../shared/stores/store.store';

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Tax collected, from the sales priced with tax management (their immutable tax snapshots, never today's tax settings).
 * Sales made before the store used tax management are counted aside and are not part of these figures.
 */
@Component({
  selector: 'app-tax-report',
  imports: [CurrencyPipe, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, ReportPageComponent, ReportKpiComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-report-page title="Tax Report" i18n-title subtitle="Tax collected on your sales" i18n-subtitle [exportDisabled]="!report()" (export)="exportData($event)">
      <ng-container filters>
        <div><mat-form-field appearance="outline"><mat-label i18n>From</mat-label><input matInput type="date" [ngModel]="from()" (ngModelChange)="from.set($event)" data-testid="report-from" /></mat-form-field></div>
        <div><mat-form-field appearance="outline"><mat-label i18n>To</mat-label><input matInput type="date" [ngModel]="to()" (ngModelChange)="to.set($event)" data-testid="report-to" /></mat-form-field></div>
        <div>
          <mat-form-field appearance="outline">
            <mat-label i18n>Tax</mat-label>
            <mat-select [ngModel]="taxId()" (ngModelChange)="taxId.set($event)" data-testid="report-tax">
              <mat-option value="" i18n>All taxes</mat-option>
              @for (t of taxes(); track t._id) { <mat-option [value]="t._id">{{ t.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="flex items-start"><button matButton="filled" class="!h-14 w-full" (click)="run()" data-testid="report-run" i18n>Show report</button></div>
      </ng-container>

      @if (loading()) {
        <div class="flex justify-center py-16"><mat-spinner diameter="32"></mat-spinner></div>
      } @else if (error()) {
        <div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">{{ error() }}</div>
      } @else if (report(); as r) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="report-kpis">
          <app-report-kpi label="Total sales" i18n-label icon="payments">{{ r.sales | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Net taxable sales" i18n-label icon="receipt_long">{{ r.taxableAmount | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="VAT collected" i18n-label icon="percent" data-testid="kpi-tax">{{ r.totalTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="VAT after refunds" i18n-label icon="undo">{{ r.netTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Zero-rated sales" i18n-label>{{ r.zeroRatedSales | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="Exempt sales" i18n-label>{{ r.exemptSales | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="VAT included in prices" i18n-label>{{ r.includedTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
          <app-report-kpi label="VAT added at checkout" i18n-label>{{ r.addedTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</app-report-kpi>
        </div>

        <mat-card appearance="outlined" class="overflow-x-auto">
          <table class="w-full min-w-[520px] text-sm" data-testid="report-by-tax">
            <thead><tr class="bg-surface-container text-left text-on-surface-variant"><th class="px-4 py-3 font-medium" i18n>Tax</th><th class="px-4 py-3 text-right font-medium" i18n>Rate</th><th class="px-4 py-3 text-right font-medium" i18n>Taxable amount</th><th class="px-4 py-3 text-right font-medium" i18n>Tax</th></tr></thead>
            <tbody>
              @for (row of r.byTax; track $index) {
                <tr class="border-t border-outline-variant/60">
                  <td class="px-4 py-3">{{ row.name }}
                    @if (row.kind === 'zero_rated') { <span class="ml-1 text-xs text-on-surface-variant" i18n>(zero-rated)</span> }
                    @if (row.kind === 'exempt') { <span class="ml-1 text-xs text-on-surface-variant" i18n>(exempt)</span> }
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ row.rate }}%</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ row.taxableAmount | currency: r.currencyCode : 'symbol' : '1.2-2' }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ row.taxAmount | currency: r.currencyCode : 'symbol' : '1.2-2' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-4 py-8 text-center text-on-surface-variant" i18n>No taxed sales in this period.</td></tr>
              }
            </tbody>
          </table>
        </mat-card>

        <div class="flex flex-col gap-1 px-1">
          <p class="m-0 text-sm text-on-surface-variant" data-testid="report-refunds">
            <ng-container i18n>Refund adjustments: {{ r.refunds.count }} refund(s), {{ r.refunds.taxReversed | currency: r.currencyCode : 'symbol' : '1.2-2' }} of VAT reversed.</ng-container>
          </p>
          @if (r.legacyOrders > 0) {
            <p class="m-0 text-sm text-on-surface-variant" data-testid="report-legacy">
              <ng-container i18n>{{ r.legacyOrders }} sale(s) in this period were made before tax management was set up. They are not included here and were not changed.</ng-container>
            </p>
          }
        </div>
      }
    </app-report-page>
  `,
})
export class TaxReportComponent {
  private readonly api = inject(AccountingTaxService);
  private readonly storeStore = inject(StoreStore);
  private readonly exporter = inject(ReportExportService);

  protected readonly from = signal(ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  protected readonly to = signal(ymd(new Date()));
  protected readonly taxId = signal('');
  protected readonly taxes = signal<Tax[]>([]);
  protected readonly report = signal<TaxReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');

  constructor() {
    effect(() => {
      const id = this.storeId();
      if (!id) return;
      untracked(() => {
        this.api.view(id).subscribe((v) => this.taxes.set(v.taxes));
        this.run();
      });
    });
  }

  /** Exports what is on screen: one row per tax and a total row, with the headline figures on the Excel info sheet. */
  protected exportData(format: ExportFormat): void {
    const r = this.report();
    if (!r) return;
    const tax = this.taxes().find((t) => t._id === this.taxId());
    const rows: Array<Record<string, any>> = r.byTax.map((t) => ({
      tax: t.name + (t.kind === 'zero_rated' ? ' (zero-rated)' : t.kind === 'exempt' ? ' (exempt)' : ''),
      rate: t.rate,
      taxable: t.taxableAmount,
      amount: t.taxAmount,
    }));
    rows.push({ tax: $localize`Total`, rate: '', taxable: r.byTax.reduce((s, t) => s + t.taxableAmount, 0), amount: r.totalTax });
    this.exporter.export(format === 'excel' ? 'xlsx' : format, {
      title: $localize`Tax Report`,
      storeName: this.storeStore.selectedStore()?.name ?? '',
      currency: r.currencyCode,
      subtitle: `${this.from()} → ${this.to()}${tax ? ' · ' + tax.name : ''}`,
      info: [
        [$localize`Total sales`, String(r.sales)],
        [$localize`Net taxable sales`, String(r.taxableAmount)],
        [$localize`VAT collected`, String(r.totalTax)],
        [$localize`VAT after refunds`, String(r.netTax)],
        [$localize`Zero-rated sales`, String(r.zeroRatedSales)],
        [$localize`Exempt sales`, String(r.exemptSales)],
        [$localize`VAT included in prices`, String(r.includedTax)],
        [$localize`VAT added at checkout`, String(r.addedTax)],
        [$localize`Refunds`, `${r.refunds.count} · ${r.refunds.taxReversed}`],
      ],
      columns: [
        { key: 'tax', label: $localize`Tax`, type: 'text' },
        { key: 'rate', label: $localize`Rate (%)`, type: 'number' },
        { key: 'taxable', label: $localize`Taxable amount`, type: 'currency' },
        { key: 'amount', label: $localize`Tax`, type: 'currency' },
      ],
      rows,
      filename: `tax-report-${this.from()}-${this.to()}`,
      landscape: false,
    });
  }

  protected run(): void {
    const id = this.storeId();
    if (!id) return;
    this.loading.set(true);
    // The end of the chosen day is included.
    const to = this.to() ? `${this.to()}T23:59:59.999` : '';
    this.api.report(id, { from: this.from() ? `${this.from()}T00:00:00` : '', to, taxId: this.taxId() }).subscribe({
      next: (r) => {
        this.report.set(r);
        this.error.set(null);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? $localize`Something went wrong. Please try again.`);
        this.loading.set(false);
      },
    });
  }
}
