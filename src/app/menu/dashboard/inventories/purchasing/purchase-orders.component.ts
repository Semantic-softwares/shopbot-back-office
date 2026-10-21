import { MatCardModule } from '@angular/material/card';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PO_STATUSES, PO_STATUS_LABELS, PO_STATUS_TONES, PurchaseOrder, PurchaseOrderStatus, PurchasingService } from '../../../../shared/services/purchasing.service';
import { RolesService } from '../../../../shared/services/roles.service';
import { SuppliersService } from '../../../../shared/services/suppliers.service';
import { StoreStore } from '../../../../shared/stores/store.store';

const ymd = (d: Date | null): string => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');

/** Every purchase order, filterable by supplier, status, number and order date. */
@Component({
  selector: 'app-purchase-orders',
  imports: [MatCardModule, CurrencyPipe, DatePipe, DecimalPipe, FormsModule, RouterLink, PageHeaderComponent, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatTableModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Purchase orders" i18n-title subtitle="What you have ordered from suppliers, and what has arrived." i18n-subtitle>
      <ng-container actions>
        <button matIconButton (click)="reload()" [disabled]="loading()" aria-label="Refresh" i18n-aria-label matTooltip="Refresh" i18n-matTooltip><mat-icon [class.animate-spin]="loading()">refresh</mat-icon></button>
        <button matButton="outlined" routerLink="/menu/erp/inventory/purchasing/outstanding"><mat-icon>pending_actions</mat-icon><ng-container i18n>Outstanding</ng-container></button>
        @if (canCreate()) {
          <button matButton="outlined" routerLink="/menu/erp/inventory/purchasing/suggestions"><mat-icon>auto_awesome</mat-icon><ng-container i18n>Restocking suggestions</ng-container></button>
          <button matButton="filled" routerLink="/menu/erp/inventory/purchasing/new"><mat-icon>add</mat-icon><ng-container i18n>New order</ng-container></button>
        }
      </ng-container>
    </app-page-header>

    <div class="flex flex-col gap-4 p-4 pb-16 md:p-6">
      <div class="flex flex-wrap items-start gap-3">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-56">
          <mat-icon matPrefix class="ml-3 text-on-surface-variant">search</mat-icon>
          <input matInput placeholder="Order number" i18n-placeholder [ngModel]="number()" (ngModelChange)="onNumber($event)" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-56">
          <mat-label><ng-container i18n>Supplier</ng-container></mat-label>
          <mat-select [value]="supplier()" (selectionChange)="supplier.set($event.value); page.set(1)">
            <mat-option value="all"><ng-container i18n>All suppliers</ng-container></mat-option>
            @for (s of suppliers(); track s._id) { <mat-option [value]="s._id">{{ s.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-56">
          <mat-label><ng-container i18n>Status</ng-container></mat-label>
          <mat-select [value]="status()" (selectionChange)="status.set($event.value); page.set(1)">
            <mat-option value="all"><ng-container i18n>All statuses</ng-container></mat-option>
            @for (s of statuses; track s) { <mat-option [value]="s">{{ statusLabel(s) }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-64">
          <mat-label><ng-container i18n>Ordered between</ng-container></mat-label>
          <mat-date-range-input [rangePicker]="rp">
            <input matStartDate placeholder="From" i18n-placeholder [value]="from()" (dateChange)="from.set($event.value); page.set(1)" />
            <input matEndDate placeholder="To" i18n-placeholder [value]="to()" (dateChange)="to.set($event.value); page.set(1)" />
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="rp" />
          <mat-date-range-picker #rp />
        </mat-form-field>
      </div>

      @if (loading() && !data()) { <mat-progress-bar mode="indeterminate" /> }

      @if (failed()) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">error</mat-icon>
          <p class="m-0 font-semibold"><ng-container i18n>Could not load the purchase orders.</ng-container></p>
          <button matButton="filled" (click)="reload()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else if (data()) {
        @if (rows().length === 0) {
          <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
            <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">shopping_bag</mat-icon>
            <p class="m-0 font-medium"><ng-container i18n>No purchase orders here yet.</ng-container></p>
            <p class="m-0 max-w-md text-sm text-on-surface-variant"><ng-container i18n>Create an order from your low-stock products, or start one by hand.</ng-container></p>
            @if (canCreate()) { <button matButton="filled" routerLink="/menu/erp/inventory/purchasing/new"><ng-container i18n>New order</ng-container></button> }
          </div>
        } @else {
          <mat-card appearance="outlined" class="overflow-x-auto">
            <table mat-table [dataSource]="rows()" class="w-full min-w-[820px]">
              <ng-container matColumnDef="number">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Order</ng-container></th>
                <td mat-cell *matCellDef="let o"><div class="font-semibold">{{ o.number }}</div><div class="text-xs text-on-surface-variant">{{ o.createdAt | date: 'mediumDate' }}</div></td>
              </ng-container>
              <ng-container matColumnDef="supplier">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Supplier</ng-container></th>
                <td mat-cell *matCellDef="let o">{{ o.supplierName }}</td>
              </ng-container>
              <ng-container matColumnDef="expected">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Expected</ng-container></th>
                <td mat-cell *matCellDef="let o" class="whitespace-nowrap text-sm">{{ o.expectedDate ? (o.expectedDate | date: 'mediumDate') : '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Received</ng-container></th>
                <td mat-cell *matCellDef="let o" class="min-w-32">
                  @if (o.status === 'DRAFT') { <span class="text-sm text-on-surface-variant">—</span> } @else {
                    <div class="text-sm tabular-nums">{{ o.acceptedQty | number: '1.0-3' }} / {{ o.orderedQty | number: '1.0-3' }}</div>
                    <div class="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-surface-container-high"><div class="h-full rounded-full bg-green-600" [style.width.%]="pct(o)"></div></div>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Total</ng-container></th>
                <td mat-cell *matCellDef="let o" class="whitespace-nowrap text-right tabular-nums">{{ o.total | currency: (o.currency || currency()) : 'symbol' : '1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Status</ng-container></th>
                <td mat-cell *matCellDef="let o"><span class="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(o.status)">{{ statusLabel(o.status) }}</span></td>
              </ng-container>
              <ng-container matColumnDef="go">
                <th mat-header-cell *matHeaderCellDef class="!w-10"></th>
                <td mat-cell *matCellDef="let o"><mat-icon class="text-on-surface-variant">chevron_right</mat-icon></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let o; columns: columns" class="cursor-pointer hover:bg-surface-container-low" (click)="open(o)" tabindex="0" (keyup.enter)="open(o)"></tr>
            </table>
          </mat-card>
          <mat-paginator [length]="data()!.total" [pageSize]="pageSize" [pageIndex]="page() - 1" [hidePageSize]="true" (page)="onPage($event)" />
        }
      }
    </div>`,
})
export class PurchaseOrdersComponent {
  private readonly api = inject(PurchasingService);
  private readonly storeStore = inject(StoreStore);
  private readonly suppliersApi = inject(SuppliersService);
  private readonly router = inject(Router);
  private readonly roles = inject(RolesService);

  readonly statuses = PO_STATUSES;
  readonly statusLabel = (s: PurchaseOrderStatus) => PO_STATUS_LABELS[s]();
  readonly tone = (s: PurchaseOrderStatus) => PO_STATUS_TONES[s];
  readonly columns = ['number', 'supplier', 'expected', 'progress', 'total', 'status', 'go'];
  readonly pageSize = 20;

  readonly number = signal('');
  readonly debounced = signal('');
  readonly supplier = signal('all');
  readonly status = signal('all');
  readonly from = signal<Date | null>(null);
  readonly to = signal<Date | null>(null);
  readonly page = signal(1);
  private readonly refresh = signal(0);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  readonly canCreate = computed(() => this.roles.isAdmin() || this.roles.hasAny(['erp.purchasing.create']));

  private readonly suppliersRes = rxResource({ params: () => this.storeId(), stream: ({ params }) => (params ? this.suppliersApi.getSuppliersByStore(params) : of([])) });
  readonly suppliers = computed(() => (this.suppliersRes.hasValue() ? this.suppliersRes.value() : []));

  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), n: this.debounced(), supplier: this.supplier(), status: this.status(), from: ymd(this.from()), to: ymd(this.to()), page: this.page(), r: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.list(params.id, { number: params.n, supplier: params.supplier, status: params.status, from: params.from, to: params.to, page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed<PurchaseOrder[]>(() => this.data()?.rows ?? []);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  private timer: ReturnType<typeof setTimeout> | undefined;
  onNumber(v: string) { this.number.set(v); clearTimeout(this.timer); this.timer = setTimeout(() => { this.debounced.set(v.trim()); this.page.set(1); }, 300); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }
  pct(o: PurchaseOrder) { const t = o.orderedQty || 0; return t ? Math.min(100, Math.round(((o.acceptedQty || 0) / t) * 100)) : 0; }
  open(o: PurchaseOrder) { this.router.navigate(['/menu/erp/inventory/purchasing', o._id]); }
}
