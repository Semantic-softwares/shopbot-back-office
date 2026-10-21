import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PurchasingService } from '../../../../shared/services/purchasing.service';
import { StoreStore } from '../../../../shared/stores/store.store';

/**
 * What is still to come. Drafts, sent, confirmed and part-received are kept apart on purpose: none of it is on the shelf, and an
 * order only the supplier has confirmed is not the same as goods that arrived.
 */
@Component({
  selector: 'app-po-outstanding',
  imports: [MatCardModule, MatTableModule, CurrencyPipe, DecimalPipe, RouterLink, PageHeaderComponent, MatButtonModule, MatIconModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Outstanding purchases" i18n-title subtitle="Orders still waiting on a supplier. None of this is in stock yet." i18n-subtitle>
      <ng-container actions><button matButton routerLink="/menu/erp/inventory/purchasing"><mat-icon>arrow_back</mat-icon><ng-container i18n>Purchase orders</ng-container></button></ng-container>
    </app-page-header>
    <div class="flex flex-col gap-5 p-4 pb-16 md:p-6">
      @if (res.isLoading() && !data()) { <mat-progress-bar mode="indeterminate" /> }
      @if (res.error()) { <div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-900" role="alert"><ng-container i18n>Could not load this.</ng-container> <button matButton (click)="res.reload()"><ng-container i18n>Try again</ng-container></button></div> }
      @if (data(); as d) {
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          @for (c of cards(); track c.key) {
            <mat-card appearance="outlined"><mat-card-content class="!p-4">
              <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-on-surface-variant"><span class="inline-block h-2 w-2 rounded-full" [class]="c.dot"></span>{{ c.label }}</div>
              <div class="mt-1 text-3xl font-semibold tabular-nums">{{ c.count }}</div>
              <div class="text-xs text-on-surface-variant tabular-nums">{{ c.total | currency: currency() : 'symbol' : '1.0-0' }}</div>
              <div class="mt-1 text-xs text-on-surface-variant">{{ c.hint }}</div>
            </mat-card-content></mat-card>
          }
        </div>

        <mat-card appearance="outlined"><mat-card-content class="!p-5">
          <h3 class="m-0 mb-3 text-base font-semibold"><ng-container i18n>Still expected, by supplier and product</ng-container></h3>
          @if (!d.lines.length) { <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Nothing is outstanding. Orders in draft are not listed because they have not been sent.</ng-container></p> }
          @else {
          <div class="-mx-4 overflow-x-auto">
            <table mat-table [dataSource]="d.lines" class="w-full min-w-[640px]">
              <ng-container matColumnDef="supplier"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Supplier</ng-container></th><td mat-cell *matCellDef="let l">{{ l.supplierName }}</td></ng-container>
              <ng-container matColumnDef="product"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Product</ng-container></th><td mat-cell *matCellDef="let l"><span class="font-medium">{{ l.name }}</span> <span class="text-xs text-on-surface-variant">{{ l.unit }}</span></td></ng-container>
              <ng-container matColumnDef="sent"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Awaiting confirmation</ng-container></th><td mat-cell *matCellDef="let l" class="text-right tabular-nums">{{ l.sentQty ? (l.sentQty | number: '1.0-3') : '—' }}</td></ng-container>
              <ng-container matColumnDef="confirmed"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Confirmed</ng-container></th><td mat-cell *matCellDef="let l" class="text-right tabular-nums">{{ l.confirmedQty ? (l.confirmedQty | number: '1.0-3') : '—' }}</td></ng-container>
              <ng-container matColumnDef="partial"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Rest of part-received</ng-container></th><td mat-cell *matCellDef="let l" class="text-right tabular-nums">{{ l.partialQty ? (l.partialQty | number: '1.0-3') : '—' }}</td></ng-container>
              <ng-container matColumnDef="orders"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Orders</ng-container></th><td mat-cell *matCellDef="let l" class="text-xs text-on-surface-variant">{{ l.orders.join(', ') }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let l; columns: columns"></tr>
            </table>
          </div>
          }
        </mat-card-content></mat-card>
      }
    </div>`,
})
export class PoOutstandingComponent {
  readonly columns = ['supplier', 'product', 'sent', 'confirmed', 'partial', 'orders'];
  private readonly api = inject(PurchasingService);
  private readonly storeStore = inject(StoreStore);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  readonly res = rxResource({ params: () => this.storeId(), stream: ({ params }) => (params ? this.api.outstanding(params) : of(null)) });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly cards = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { key: 'draft', label: $localize`Drafts`, hint: $localize`Not sent yet`, dot: 'bg-gray-400', ...d.draft },
      { key: 'sent', label: $localize`Sent`, hint: $localize`Waiting for the supplier to confirm`, dot: 'bg-blue-500', ...d.sent },
      { key: 'confirmed', label: $localize`Confirmed`, hint: $localize`Waiting for delivery`, dot: 'bg-indigo-500', ...d.confirmed },
      { key: 'partial', label: $localize`Part received`, hint: $localize`Some arrived, the rest is due`, dot: 'bg-amber-500', ...d.partiallyReceived },
    ];
  });
}
