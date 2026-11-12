import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryItem, InventoryLocation, InventoryUnit, STATUS_INFO, apiMessage } from '../../../../shared/inventory/inventory.models';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ItemDialogComponent } from './item-dialog.component';
import { StockOp, StockOpDialogComponent } from './stock-op-dialog.component';

/** The list of everything the business keeps in stock: ingredients, components, materials. Separate from the products on the POS menu. */
@Component({
  selector: 'app-inventory-items',
  imports: [RouterLink, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatTableModule, NoRecordComponent, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatPaginatorModule, MatProgressSpinnerModule, MatSelectModule, MatSlideToggleModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Inventory items" i18n-title subtitle="Ingredients, components and materials you keep in stock. Link them to products with a bill of materials so sales use them up automatically." i18n-subtitle>
      <ng-container actions>
        <button matIconButton (click)="load()" aria-label="Refresh" i18n-aria-label><mat-icon [class.animate-spin]="loading()">refresh</mat-icon></button>
        <button matButton="filled" (click)="openItem()" data-testid="add-item"><mat-icon>add</mat-icon><ng-container i18n>Add item</ng-container></button>
      </ng-container>
    </app-page-header>

    <div class="flex flex-col gap-4 p-4 pb-16 md:p-6">
      <div class="flex flex-wrap items-center gap-3">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-72">
          <mat-icon matPrefix class="ml-3 text-on-surface-variant">search</mat-icon>
          <input matInput [ngModel]="search()" (ngModelChange)="onSearch($event)" placeholder="Search by name or SKU" i18n-placeholder autocomplete="off" data-testid="items-search" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-48">
          <mat-label><ng-container i18n>Location</ng-container></mat-label>
          <mat-select [ngModel]="location()" (ngModelChange)="location.set($event); page.set(1); load()" data-testid="items-location">
            <mat-option value=""><ng-container i18n>All locations</ng-container></mat-option>
            @for (l of locations(); track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-44">
          <mat-label><ng-container i18n>Sort by</ng-container></mat-label>
          <mat-select [ngModel]="sort()" (ngModelChange)="sort.set($event); load()">
            <mat-option value="name"><ng-container i18n>Name (A–Z)</ng-container></mat-option>
            <mat-option value="-name"><ng-container i18n>Name (Z–A)</ng-container></mat-option>
            <mat-option value="quantity"><ng-container i18n>Least stock</ng-container></mat-option>
            <mat-option value="-quantity"><ng-container i18n>Most stock</ng-container></mat-option>
            <mat-option value="category"><ng-container i18n>Category</ng-container></mat-option>
          </mat-select>
        </mat-form-field>
        <mat-slide-toggle [ngModel]="lowOnly()" (ngModelChange)="lowOnly.set($event); page.set(1); load()" data-testid="items-low"><ng-container i18n>Low or out of stock only</ng-container></mat-slide-toggle>
      </div>

      @if (error()) {
        <div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-900" role="alert">{{ error() }} <button matButton (click)="load()"><ng-container i18n>Try again</ng-container></button></div>
      } @else if (loading() && !rows().length) {
        <div class="flex min-h-[260px] items-center justify-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!rows().length) {
        <app-no-record icon="inventory" title="No inventory items found" i18n-title message="Add the things you use up or sell by weight, volume or count, such as fish, oil or screens." i18n-message>
          <button matButton="filled" (click)="openItem()"><ng-container i18n>Add an item</ng-container></button>
        </app-no-record>
      } @else {
        <mat-card appearance="outlined" class="overflow-x-auto">
          <table mat-table [dataSource]="rows()" class="w-full min-w-[820px]" data-testid="items-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Item</ng-container></th>
              <td mat-cell *matCellDef="let r"><a [routerLink]="['./', r._id]" class="font-semibold text-primary no-underline hover:underline" data-testid="item-link">{{ r.name }}</a>@if (r.sku) { <div class="text-xs text-on-surface-variant">{{ r.sku }}</div> }</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Category</ng-container></th>
              <td mat-cell *matCellDef="let r">{{ r.category }}</td>
            </ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>In stock</ng-container></th>
              <td mat-cell *matCellDef="let r" class="!text-right font-semibold tabular-nums">{{ r.quantity }} <span class="font-normal text-on-surface-variant">{{ r.baseUnit }}</span></td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Status</ng-container></th>
              <td mat-cell *matCellDef="let r"><mat-chip [class]="info(r.status!).cls">{{ info(r.status!).label }}</mat-chip>@if (r.active === false) { <span class="ml-2 text-xs text-on-surface-variant" i18n>Inactive</span> }</td>
            </ng-container>
            <ng-container matColumnDef="threshold">
              <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Warn at</ng-container></th>
              <td mat-cell *matCellDef="let r" class="!text-right tabular-nums">@if (r.threshold !== null && r.threshold !== undefined) { {{ r.threshold }} {{ r.baseUnit }} } @else { <span class="text-on-surface-variant">—</span> }</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r" class="!text-right">
                <button matIconButton [matMenuTriggerFor]="menu" aria-label="Actions" i18n-aria-label><mat-icon>more_vert</mat-icon></button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="op('add', r)"><mat-icon>add</mat-icon><span i18n>Add stock</span></button>
                  <button mat-menu-item (click)="op('remove', r)"><mat-icon>remove</mat-icon><span i18n>Remove stock</span></button>
                  <button mat-menu-item (click)="op('wastage', r)"><mat-icon>delete_sweep</mat-icon><span i18n>Record wastage</span></button>
                  <button mat-menu-item (click)="op('adjust', r)"><mat-icon>tune</mat-icon><span i18n>Stock adjustment</span></button>
                  <button mat-menu-item (click)="op('transfer', r)"><mat-icon>swap_horiz</mat-icon><span i18n>Transfer stock</span></button>
                  <button mat-menu-item (click)="openItem(r)"><mat-icon>edit</mat-icon><span i18n>Edit item</span></button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns" [class.opacity-60]="row.active === false"></tr>
          </table>
        </mat-card>
        <mat-paginator [length]="total()" [pageSize]="limit" [pageIndex]="page() - 1" [hidePageSize]="true" (page)="onPage($event)"></mat-paginator>
      }
    </div>`,
})
export class InventoryItemsComponent {
  private api = inject(InventoryService);
  private dialog = inject(MatDialog);
  private stores = inject(StoreStore);

  columns = ['name', 'category', 'quantity', 'status', 'threshold', 'actions'];
  limit = 25;
  rows = signal<InventoryItem[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(false);
  error = signal('');
  search = signal(''); location = signal(''); sort = signal('name'); lowOnly = signal(false);
  locations = signal<InventoryLocation[]>([]);
  units = signal<InventoryUnit[]>([]);
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  info = (s: string) => STATUS_INFO[s as keyof typeof STATUS_INFO] ?? STATUS_INFO.in_stock;
  private timer?: any;

  constructor() {
    effect(() => {
      const id = this.storeId();
      if (!id) return;
      void Promise.all([this.api.locations(id), this.api.units(id)]).then(([l, u]) => { this.locations.set(l); this.units.set(u); }).catch(() => undefined);
      this.load();
    });
  }

  onSearch(v: string) { this.search.set(v); clearTimeout(this.timer); this.timer = setTimeout(() => { this.page.set(1); this.load(); }, 300); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); this.load(); }

  async load() {
    const s = this.storeId(); if (!s) return;
    this.loading.set(true); this.error.set('');
    try {
      const r = await this.api.items(s, { search: this.search(), location: this.location(), low: this.lowOnly() ? 'true' : '', sort: this.sort(), page: this.page(), limit: this.limit });
      this.rows.set(r.items); this.total.set(r.total);
    } catch (e) { this.error.set(apiMessage(e)); }
    this.loading.set(false);
  }

  openItem(item?: InventoryItem) {
    this.dialog.open(ItemDialogComponent, { width: '640px', maxWidth: '95vw', data: { storeId: this.storeId(), item, units: this.units() } }).afterClosed().subscribe((ok) => ok && this.load());
  }

  async op(mode: StockOp, item: InventoryItem) {
    const detail = await this.api.item(this.storeId(), item._id).catch(() => null);
    this.dialog.open(StockOpDialogComponent, { width: '480px', maxWidth: '95vw', data: { storeId: this.storeId(), mode, item, locations: this.locations(), units: this.units(), balances: detail?.balances.map((b) => ({ location: b.location, quantity: b.quantity })) } })
      .afterClosed().subscribe((ok) => ok && this.load());
  }
}
