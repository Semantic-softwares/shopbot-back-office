import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusPillComponent } from '../../../../shared/components/status-pill/status-pill.component';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';

@Component({
  selector: 'app-admin-invoices',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule, PageHeaderComponent, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Invoices" i18n-title subtitle="Every subscription invoice on the platform" i18n-subtitle />
    <mat-card appearance="outlined" class="mb-3"><mat-card-content class="!p-3 sm:!p-4">
      <div class="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
        <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label i18n>Invoice number</mat-label><input matInput [ngModel]="search()" (ngModelChange)="search.set($event); page.set(1)" data-testid="inv-search" /><mat-icon matSuffix>search</mat-icon></mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label i18n>Status</mat-label>
          <mat-select [ngModel]="status()" (ngModelChange)="status.set($event); page.set(1)" data-testid="inv-status"><mat-option value="" i18n>All</mat-option><mat-option value="PENDING" i18n>Open</mat-option><mat-option value="PAID" i18n>Paid</mat-option><mat-option value="CANCELLED" i18n>Void</mat-option><mat-option value="UNCOLLECTIBLE" i18n>Written off</mat-option></mat-select></mat-form-field>
      </div></mat-card-content></mat-card>
    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the invoices.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <mat-card appearance="outlined" class="overflow-x-auto"><table class="w-full min-w-[720px] text-sm" data-testid="inv-table">
        <thead class="text-left text-xs uppercase text-on-surface-variant"><tr><th class="p-3" i18n>Number</th><th class="p-3" i18n>Store</th><th class="p-3" i18n>Due</th><th class="p-3 text-right" i18n>Total</th><th class="p-3 text-right" i18n>Owing</th><th class="p-3" i18n>Status</th></tr></thead>
        <tbody>@for (i of res.value().rows; track i._id) {
          <tr class="border-t border-outline-variant hover:bg-surface-container-low"><td class="p-3"><a [routerLink]="[i._id]" class="font-medium text-primary">{{ i.invoiceNumber }}</a></td><td class="p-3">@if (store(i); as s) { <a [routerLink]="['../stores', s.id]" class="text-inherit hover:underline">{{ s.name }}</a> }</td><td class="p-3">{{ i.dueDate | date: 'mediumDate' : 'UTC' }}</td><td class="p-3 text-right tabular-nums">{{ i.total ?? i.amount | currency: i.currency }}</td><td class="p-3 text-right tabular-nums">{{ i.amountDue | currency: i.currency }}</td><td class="p-3"><app-status-pill kind="invoice" [value]="i.status" /></td></tr>
        } @empty { <tr><td colspan="6" class="p-8 text-center text-on-surface-variant" i18n>No invoices match.</td></tr> }</tbody></table></mat-card>
      <div class="mt-3 flex items-center justify-end gap-2 text-sm"><span class="text-on-surface-variant">{{ res.value().total }} <span i18n>invoices</span></span>
        <button mat-stroked-button [disabled]="page() <= 1" (click)="page.set(page() - 1)" i18n>Previous</button><button mat-stroked-button [disabled]="page() * 25 >= res.value().total" (click)="page.set(page() + 1)" i18n>Next</button></div>
    }
  `,
})
export class InvoicesPage {
  private readonly api = inject(PlatformBillingService);
  readonly search = signal('');
  readonly status = signal('');
  readonly page = signal(1);
  readonly res = rxResource({ params: () => ({ s: this.search(), st: this.status(), p: this.page() }), stream: ({ params }) => this.api.adminInvoices({ search: params.s || undefined, status: params.st || undefined, page: params.p, limit: 25 }) });
  store(i: { storeId?: string | { _id: string; name: string } }): { id: string; name: string } | null {
    const s = i.storeId;
    return s && typeof s === 'object' ? { id: s._id, name: s.name } : s ? { id: s, name: s } : null;
  }
}
