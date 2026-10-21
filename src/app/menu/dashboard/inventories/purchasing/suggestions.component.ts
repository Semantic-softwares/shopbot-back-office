import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PurchasingService, Suggestion } from '../../../../shared/services/purchasing.service';
import { StoreStore } from '../../../../shared/stores/store.store';

interface Pick { on: boolean; quantity: number; supplier: string; unitCost: number }

/**
 * Products at or below their low-stock level that have a reorder target. The quantity is what it takes to get back to the target,
 * less what is already on order from suppliers (orders still in draft do not count). Staff change the numbers, then the picked
 * items become one draft purchase order per supplier. Nothing is ordered and no stock changes until the order is sent and received.
 */
@Component({
  selector: 'app-po-suggestions',
  imports: [DecimalPipe, FormsModule, RouterLink, PageHeaderComponent, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule, MatTableModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Restocking suggestions" i18n-title subtitle="Products running low. Pick what to order; one draft order is made per supplier." i18n-subtitle>
      <ng-container actions>
        <button matButton routerLink="/menu/erp/inventory/purchasing"><mat-icon>arrow_back</mat-icon><ng-container i18n>Purchase orders</ng-container></button>
      </ng-container>
    </app-page-header>

    <div class="flex flex-col gap-4 p-4 pb-6 md:p-6">
      @if (res.isLoading() && !rows().length) { <mat-progress-bar mode="indeterminate" /> }

      @if (res.error()) {
        <div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-900" role="alert"><ng-container i18n>Could not load the suggestions.</ng-container> <button matButton (click)="res.reload()"><ng-container i18n>Try again</ng-container></button></div>
      } @else if (res.hasValue() && rows().length === 0) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-green-600">task_alt</mat-icon>
          <p class="m-0 font-medium"><ng-container i18n>Nothing needs reordering right now.</ng-container></p>
          <p class="m-0 max-w-md text-sm text-on-surface-variant"><ng-container i18n>A product shows here when its stock is at or below its low-stock level and it has a "reorder up to" quantity set on the product.</ng-container></p>
        </div>
      } @else {
        <mat-card appearance="outlined" class="overflow-x-auto max-sm:!hidden">
          <table mat-table [dataSource]="rows()" class="w-full min-w-[900px]">
            <ng-container matColumnDef="pick">
              <th mat-header-cell *matHeaderCellDef class="!w-12"><mat-checkbox [checked]="allOn()" [indeterminate]="someOn() && !allOn()" (change)="toggleAll($event.checked)" aria-label="Select all" i18n-aria-label /></th>
              <td mat-cell *matCellDef="let r"><mat-checkbox [checked]="picks()[r.product]?.on" (change)="patch(r.product, { on: $event.checked })" [attr.aria-label]="r.name" /></td>
            </ng-container>
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Product</ng-container></th>
              <td mat-cell *matCellDef="let r"><div class="font-medium">{{ r.name }}</div><div class="text-xs text-on-surface-variant">{{ r.sku }}</div></td>
            </ng-container>
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>In stock</ng-container></th>
              <td mat-cell *matCellDef="let r" class="text-right tabular-nums"><span class="font-medium text-red-700">{{ r.qty | number: '1.0-3' }}</span> <span class="text-xs text-on-surface-variant">{{ r.inventoryUnit }}</span><div class="text-xs text-on-surface-variant"><ng-container i18n>low at {{ r.criticalStockLevel }}</ng-container></div></td>
            </ng-container>
            <ng-container matColumnDef="incoming">
              <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>On order</ng-container></th>
              <td mat-cell *matCellDef="let r" class="text-right tabular-nums">{{ r.incoming | number: '1.0-3' }}</td>
            </ng-container>
            <ng-container matColumnDef="target">
              <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Reorder up to</ng-container></th>
              <td mat-cell *matCellDef="let r" class="text-right tabular-nums">{{ r.reorderTarget | number: '1.0-3' }}</td>
            </ng-container>
            <ng-container matColumnDef="supplier">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Supplier</ng-container></th>
              <td mat-cell *matCellDef="let r">
                @if (r.supplierOptions.length) {
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-52">
                    <mat-select [value]="picks()[r.product]?.supplier" (selectionChange)="patch(r.product, { supplier: $event.value })" aria-label="Supplier" i18n-aria-label>
                      @for (o of r.supplierOptions; track o.supplier) { <mat-option [value]="o.supplier">{{ o.name }}@if (o.preferred) { ★ }</mat-option> }
                    </mat-select>
                  </mat-form-field>
                } @else {
                  <span class="text-xs text-amber-800"><ng-container i18n>No supplier set for this product.</ng-container></span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Order qty</ng-container></th>
              <td mat-cell *matCellDef="let r" class="!py-2">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-28"><input matInput type="number" min="0" step="any" class="!text-right tabular-nums" [ngModel]="picks()[r.product]?.quantity" (ngModelChange)="patch(r.product, { quantity: +$event })" aria-label="Quantity" i18n-aria-label /><span matTextSuffix class="pr-2 text-xs text-on-surface-variant">{{ r.purchaseUnit }}</span></mat-form-field>
                @if (r.packSize > 1) { <div class="text-xs text-on-surface-variant">{{ r.packSize }} <ng-container i18n>each</ng-container></div> }
              </td>
            </ng-container>
            <ng-container matColumnDef="cost">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Unit cost</ng-container></th>
              <td mat-cell *matCellDef="let r"><mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-28"><input matInput type="number" min="0" step="0.01" class="!text-right tabular-nums" [ngModel]="picks()[r.product]?.unitCost" (ngModelChange)="patch(r.product, { unitCost: +$event })" aria-label="Unit cost" i18n-aria-label /></mat-form-field></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let r; columns: columns" [class.bg-amber-50]="r.needsSupplier && picks()[r.product]?.on && !picks()[r.product]?.supplier"></tr>
          </table>
        </mat-card>
        <div class="flex flex-col gap-3 sm:hidden">
          @for (r of rows(); track r.product) {
            @let p = picks()[r.product];
            <mat-card appearance="outlined"><mat-card-content class="!p-4">
              <div class="flex items-start gap-3">
                <mat-checkbox [checked]="p?.on" (change)="patch(r.product, { on: $event.checked })" [attr.aria-label]="r.name" />
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ r.name }}</div>
                  <div class="text-xs text-on-surface-variant"><ng-container i18n>{{ r.qty | number: '1.0-3' }} in stock, low at {{ r.criticalStockLevel }} · {{ r.incoming | number: '1.0-3' }} on order · up to {{ r.reorderTarget | number: '1.0-3' }}</ng-container></div>
                </div>
              </div>
              @if (r.supplierOptions.length) {
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field mt-3 w-full"><mat-label><ng-container i18n>Supplier</ng-container></mat-label>
                  <mat-select [value]="p?.supplier" (selectionChange)="patch(r.product, { supplier: $event.value })">@for (o of r.supplierOptions; track o.supplier) { <mat-option [value]="o.supplier">{{ o.name }}@if (o.preferred) { ★ }</mat-option> }</mat-select>
                </mat-form-field>
              } @else { <p class="mt-2 text-xs text-amber-800"><ng-container i18n>No supplier set for this product.</ng-container></p> }
              <div class="mt-3 grid grid-cols-2 gap-2">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-full"><mat-label><ng-container i18n>Order qty</ng-container> ({{ r.purchaseUnit }})</mat-label><input matInput type="number" min="0" step="any" class="!text-right tabular-nums" [ngModel]="p?.quantity" (ngModelChange)="patch(r.product, { quantity: +$event })" /></mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-full"><mat-label><ng-container i18n>Unit cost</ng-container></mat-label><input matInput type="number" min="0" step="0.01" class="!text-right tabular-nums" [ngModel]="p?.unitCost" (ngModelChange)="patch(r.product, { unitCost: +$event })" /></mat-form-field>
              </div>
            </mat-card-content></mat-card>
          }
        </div>
      }
    </div>

    @if (picked().length) {
      <div class="sticky bottom-0 z-20 border-t border-outline-variant/60 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur md:px-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="text-sm">
            <div class="font-semibold"><ng-container i18n>{{ picked().length }} item(s) → {{ supplierCount() }} order(s)</ng-container></div>
            @if (missingSupplier()) { <div class="text-amber-800"><ng-container i18n>Set a preferred supplier for every picked product first (Products → Suppliers & purchasing).</ng-container></div> }
            @if (error()) { <div class="text-red-700" role="alert">{{ error() }}</div> }
          </div>
          <button matButton="filled" [disabled]="busy() || missingSupplier() || badQuantity()" (click)="create()"><mat-icon>note_add</mat-icon> @if (busy()) {<ng-container i18n>Creating…</ng-container>} @else {<ng-container i18n>Create draft orders</ng-container>}</button>
        </div>
      </div>
    }`,
})
export class PoSuggestionsComponent {
  private readonly api = inject(PurchasingService);
  private readonly storeStore = inject(StoreStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');

  readonly res = rxResource({ params: () => this.storeId(), stream: ({ params }) => (params ? this.api.suggestions(params) : of({ rows: [] as Suggestion[] })) });
  readonly rows = computed(() => (this.res.hasValue() ? this.res.value().rows : []));
  private readonly edits = signal<Record<string, Partial<Pick>>>({});
  /** The server's suggestion with whatever the person has changed on top of it. */
  readonly picks = computed<Record<string, Pick>>(() => {
    const out: Record<string, Pick> = {};
    for (const r of this.rows()) out[r.product] = { on: !r.needsSupplier, quantity: r.suggestedQty, supplier: r.supplier ?? '', unitCost: r.unitCost, ...this.edits()[r.product] };
    return out;
  });
  readonly picked = computed(() => this.rows().filter((r) => this.picks()[r.product]?.on));
  readonly allOn = computed(() => this.rows().length > 0 && this.picked().length === this.rows().length);
  readonly someOn = computed(() => this.picked().length > 0);
  readonly missingSupplier = computed(() => this.picked().some((r) => !this.picks()[r.product].supplier));
  readonly badQuantity = computed(() => this.picked().some((r) => !(this.picks()[r.product].quantity > 0)));
  readonly supplierCount = computed(() => new Set(this.picked().map((r) => this.picks()[r.product].supplier)).size);
  readonly columns = ['pick', 'product', 'stock', 'incoming', 'target', 'supplier', 'quantity', 'cost'];
  readonly busy = signal(false);
  readonly error = signal('');

  patch(product: string, change: Partial<Pick>) { this.edits.update((e) => ({ ...e, [product]: { ...e[product], ...change } })); }
  toggleAll(on: boolean) { this.rows().forEach((r) => this.patch(r.product, { on })); }

  create() {
    this.busy.set(true);
    this.error.set('');
    const items = this.picked().map((r) => { const p = this.picks()[r.product]; return { product: r.product, quantity: p.quantity, supplier: p.supplier, unitCost: p.unitCost }; });
    this.api.fromSuggestions(this.storeId(), items).subscribe({
      next: ({ orders }) => {
        this.snack.open($localize`${orders.length} draft order(s) created`, $localize`Close`, { duration: 4000 });
        this.router.navigate(orders.length === 1 ? ['/menu/erp/inventory/purchasing', orders[0]._id] : ['/menu/erp/inventory/purchasing']);
      },
      error: (e) => { this.error.set(e?.error?.message || $localize`Could not create the orders.`); this.busy.set(false); },
    });
  }
}
