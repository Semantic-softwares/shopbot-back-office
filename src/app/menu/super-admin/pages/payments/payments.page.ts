import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PaymentV2 } from '../../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';

@Component({
  selector: 'app-admin-payments',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatProgressBarModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Payments" i18n-title subtitle="Money received, newest first" i18n-subtitle />
    <mat-card appearance="outlined" class="mb-3"><mat-card-content class="!p-3 sm:!p-4"><div class="max-w-xs">
      <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic"><mat-label i18n>Method</mat-label>
        <mat-select [ngModel]="method()" (ngModelChange)="method.set($event); page.set(1)"><mat-option value="" i18n>All</mat-option><mat-option value="paystack" i18n>Card (Paystack)</mat-option><mat-option value="bank_transfer" i18n>Bank transfer</mat-option><mat-option value="cash" i18n>Cash</mat-option></mat-select></mat-form-field></div></mat-card-content></mat-card>
    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the payments.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <mat-card appearance="outlined" class="overflow-x-auto"><table class="w-full min-w-[640px] text-sm" data-testid="pay-table">
        <thead class="text-left text-xs uppercase text-on-surface-variant"><tr><th class="p-3" i18n>Received</th><th class="p-3" i18n>Store</th><th class="p-3" i18n>Invoice</th><th class="p-3" i18n>Method</th><th class="p-3" i18n>Reference</th><th class="p-3 text-right" i18n>Amount</th></tr></thead>
        <tbody>@for (p of res.value().rows; track p._id) {
          <tr class="border-t border-outline-variant"><td class="p-3">{{ p.receivedAt | date: 'medium' }}</td><td class="p-3">@if (store(p); as s) { <a [routerLink]="['../stores', s.id]" class="text-inherit hover:underline">{{ s.name }}</a> }</td>
            <td class="p-3">@if (invoice(p); as v) { <a [routerLink]="['../invoices', v.id]" class="text-primary">{{ v.number }}</a> }</td><td class="p-3">{{ label(p.providerKey) }}</td><td class="max-w-48 truncate p-3">{{ p.reference || p.providerPaymentRef || '—' }}</td><td class="p-3 text-right font-medium tabular-nums">{{ p.amount | currency: p.currency }}</td></tr>
        } @empty { <tr><td colspan="6" class="p-8 text-center text-on-surface-variant" i18n>No payments yet.</td></tr> }</tbody></table></mat-card>
      <div class="mt-3 flex items-center justify-end gap-2 text-sm"><span class="text-on-surface-variant">{{ res.value().total }} <span i18n>payments</span></span>
        <button mat-stroked-button [disabled]="page() <= 1" (click)="page.set(page() - 1)" i18n>Previous</button><button mat-stroked-button [disabled]="page() * 25 >= res.value().total" (click)="page.set(page() + 1)" i18n>Next</button></div>
    }
  `,
})
export class PaymentsPage {
  private readonly api = inject(PlatformBillingService);
  readonly method = signal('');
  readonly page = signal(1);
  readonly res = rxResource({ params: () => ({ m: this.method(), p: this.page() }), stream: ({ params }) => this.api.adminPayments({ providerKey: params.m || undefined, page: params.p, limit: 25 }) });
  label = (k: string) => (k === 'paystack' ? $localize`Card (Paystack)` : k === 'cash' ? $localize`Cash` : $localize`Bank transfer`);
  store(p: PaymentV2) {
    const s = p.storeId;
    return s && typeof s === 'object' ? { id: s._id, name: s.name } : s ? { id: s, name: s } : null;
  }
  invoice(p: PaymentV2) {
    const v = p.invoiceId;
    return v && typeof v === 'object' ? { id: v._id, number: v.invoiceNumber } : null;
  }
}
