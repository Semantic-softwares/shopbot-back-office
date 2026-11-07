import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
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
  imports: [CurrencyPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Tax Report" i18n-title subtitle="Tax collected on your sales" i18n-subtitle></app-page-header>

    <div class="flex flex-wrap items-start gap-3 mb-4">
      <mat-form-field appearance="outline"><mat-label i18n>From</mat-label><input matInput type="date" [ngModel]="from()" (ngModelChange)="from.set($event)" data-testid="report-from" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label i18n>To</mat-label><input matInput type="date" [ngModel]="to()" (ngModelChange)="to.set($event)" data-testid="report-to" /></mat-form-field>
      <mat-form-field appearance="outline" class="w-56">
        <mat-label i18n>Tax</mat-label>
        <mat-select [ngModel]="taxId()" (ngModelChange)="taxId.set($event)" data-testid="report-tax">
          <mat-option value="" i18n>All taxes</mat-option>
          @for (t of taxes(); track t._id) { <mat-option [value]="t._id">{{ t.name }}</mat-option> }
        </mat-select>
      </mat-form-field>
      <button mat-flat-button color="primary" class="!mt-2" (click)="run()" data-testid="report-run" i18n>Show report</button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (error()) {
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error() }}</div>
    } @else if (report(); as r) {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4" data-testid="report-kpis">
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>Total sales</div><div class="text-lg font-semibold tabular-nums">{{ r.sales | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>Net taxable sales</div><div class="text-lg font-semibold tabular-nums">{{ r.taxableAmount | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>VAT collected</div><div class="text-lg font-semibold tabular-nums" data-testid="kpi-tax">{{ r.totalTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>VAT after refunds</div><div class="text-lg font-semibold tabular-nums">{{ r.netTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>Zero-rated sales</div><div class="text-lg font-semibold tabular-nums">{{ r.zeroRatedSales | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>Exempt sales</div><div class="text-lg font-semibold tabular-nums">{{ r.exemptSales | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>VAT included in prices</div><div class="text-lg font-semibold tabular-nums">{{ r.includedTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
        <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500" i18n>VAT added at checkout</div><div class="text-lg font-semibold tabular-nums">{{ r.addedTax | currency: r.currencyCode : 'symbol' : '1.2-2' }}</div></div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white overflow-x-auto mb-4">
        <table class="w-full text-sm" data-testid="report-by-tax">
          <thead><tr class="bg-gray-50 text-left"><th class="p-3" i18n>Tax</th><th class="p-3 text-right" i18n>Rate</th><th class="p-3 text-right" i18n>Taxable amount</th><th class="p-3 text-right" i18n>Tax</th></tr></thead>
          <tbody>
            @for (row of r.byTax; track $index) {
              <tr class="border-t border-gray-100">
                <td class="p-3">{{ row.name }}
                  @if (row.kind === 'zero_rated') { <span class="ml-1 text-xs text-gray-500" i18n>(zero-rated)</span> }
                  @if (row.kind === 'exempt') { <span class="ml-1 text-xs text-gray-500" i18n>(exempt)</span> }
                </td>
                <td class="p-3 text-right tabular-nums">{{ row.rate }}%</td>
                <td class="p-3 text-right tabular-nums">{{ row.taxableAmount | currency: r.currencyCode : 'symbol' : '1.2-2' }}</td>
                <td class="p-3 text-right tabular-nums">{{ row.taxAmount | currency: r.currencyCode : 'symbol' : '1.2-2' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="p-6 text-center text-gray-500" i18n>No taxed sales in this period.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <p class="text-sm text-gray-600" data-testid="report-refunds">
        <ng-container i18n>Refund adjustments: {{ r.refunds.count }} refund(s), {{ r.refunds.taxReversed | currency: r.currencyCode : 'symbol' : '1.2-2' }} of VAT reversed.</ng-container>
      </p>
      @if (r.legacyOrders > 0) {
        <p class="mt-2 text-sm text-gray-500" data-testid="report-legacy">
          <ng-container i18n>{{ r.legacyOrders }} sale(s) in this period were made before tax management was set up. They are not included here and were not changed.</ng-container>
        </p>
      }
    }
  `,
})
export class TaxReportComponent {
  private readonly api = inject(AccountingTaxService);
  private readonly storeStore = inject(StoreStore);

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
