import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryLocation, InventoryUnit, ItemDetail, MOVEMENT_LABELS, STATUS_INFO, apiMessage } from '../../../../shared/inventory/inventory.models';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ItemDialogComponent } from './item-dialog.component';
import { StockOp, StockOpDialogComponent } from './stock-op-dialog.component';

/** One inventory item: stock by location, its low-stock levels, its history, and the products that use it. */
@Component({
  selector: 'app-inventory-item-detail',
  imports: [DatePipe, RouterLink, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatTableModule, MatIconModule, NoRecordComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header [title]="detail()?.item?.name ?? ''" [subtitle]="subtitle()">
      <ng-container actions>
        <a matButton routerLink="../"><mat-icon>arrow_back</mat-icon><ng-container i18n>All items</ng-container></a>
        <button matButton (click)="edit()"><mat-icon>edit</mat-icon><ng-container i18n>Edit</ng-container></button>
      </ng-container>
    </app-page-header>

    @if (error()) {
      <div class="m-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-900" role="alert">{{ error() }}</div>
    } @else if (detail(); as d) {
      <div class="flex flex-col gap-5 p-4 pb-16 md:p-6">
        <div class="flex flex-wrap gap-2" data-testid="item-actions">
          <button matButton="filled" (click)="op('add')" data-testid="act-add"><mat-icon>add</mat-icon><ng-container i18n>Add stock</ng-container></button>
          <button matButton="tonal" (click)="op('remove')" data-testid="act-remove"><mat-icon>remove</mat-icon><ng-container i18n>Remove stock</ng-container></button>
          <button matButton="tonal" (click)="op('wastage')"><mat-icon>delete_sweep</mat-icon><ng-container i18n>Record wastage</ng-container></button>
          <button matButton="tonal" (click)="op('adjust')" data-testid="act-adjust"><mat-icon>tune</mat-icon><ng-container i18n>Stock adjustment</ng-container></button>
          <button matButton="tonal" (click)="op('transfer')" data-testid="act-transfer"><mat-icon>swap_horiz</mat-icon><ng-container i18n>Transfer stock</ng-container></button>
        </div>

        <mat-card appearance="outlined">
          <mat-card-header class="!pb-2"><mat-card-title class="!text-base !font-medium"><ng-container i18n>Stock by location</ng-container> <span class="ml-2 text-sm font-normal text-on-surface-variant" data-testid="item-total">{{ d.total }} {{ d.item.baseUnit }} <ng-container i18n>in total</ng-container></span></mat-card-title></mat-card-header>
          <mat-card-content class="overflow-x-auto">
            <table mat-table [dataSource]="d.balances" class="w-full min-w-[680px]">
              <ng-container matColumnDef="location">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Location</ng-container></th>
                <td mat-cell *matCellDef="let b" [attr.data-testid]="'bal-' + b.name"><span class="font-medium">{{ b.name }}</span>@if (b.isDefault) { <span class="ml-2 text-xs text-on-surface-variant" i18n>Default</span> }</td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>In stock</ng-container></th>
                <td mat-cell *matCellDef="let b" class="!text-right font-semibold tabular-nums">{{ b.quantity }} {{ d.item.baseUnit }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Status</ng-container></th>
                <td mat-cell *matCellDef="let b"><mat-chip [class]="info(b.status).cls">{{ info(b.status).label }}</mat-chip></td>
              </ng-container>
              <ng-container matColumnDef="alert">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Warn at or below</ng-container></th>
                <td mat-cell *matCellDef="let b">
                  <div class="flex items-center gap-2 py-1">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
                      <input matInput type="number" min="0" step="any" [ngModel]="draft(b.location, b.threshold)" (ngModelChange)="setDraft(b.location, $event)" [attr.data-testid]="'thr-' + b.name" [attr.aria-label]="warnLabel" />
                      <span matTextSuffix>{{ d.item.baseUnit }}</span>
                    </mat-form-field>
                    <button matButton (click)="saveAlert(b.location, true)" [attr.data-testid]="'thr-save-' + b.name"><ng-container i18n>Save</ng-container></button>
                    @if (b.alertEnabled) { <button matButton (click)="saveAlert(b.location, false)"><ng-container i18n>Turn off</ng-container></button> }
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="balanceColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: balanceColumns"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        @if (d.boms.length) {
          <mat-card appearance="outlined">
            <mat-card-header class="!pb-2"><mat-card-title class="!text-base !font-medium"><ng-container i18n>Used by these products</ng-container></mat-card-title></mat-card-header>
            <mat-card-content><mat-chip-set>@for (b of d.boms; track b._id) { <mat-chip>{{ b.product?.name }}</mat-chip> }</mat-chip-set></mat-card-content>
          </mat-card>
        }

        <h2 class="m-0 text-base font-medium"><ng-container i18n>Movement history</ng-container></h2>
        @if (!d.movements.length) {
          <app-no-record icon="swap_vert" title="Nothing has moved yet." i18n-title message="Every addition, removal, transfer and sale that uses this item will be listed here." i18n-message></app-no-record>
        } @else {
          <mat-card appearance="outlined" class="overflow-x-auto">
            <table mat-table [dataSource]="d.movements" class="w-full min-w-[720px]" data-testid="movement-table">
              <ng-container matColumnDef="when">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>When</ng-container></th>
                <td mat-cell *matCellDef="let m" class="whitespace-nowrap">{{ m.createdAt | date: 'MMM d, HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="what">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>What</ng-container></th>
                <td mat-cell *matCellDef="let m">{{ label(m.type) }}@if (m.shortfallScaled) { <span class="ml-1 text-xs text-amber-700" i18n>(short)</span> }</td>
              </ng-container>
              <ng-container matColumnDef="where">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Where</ng-container></th>
                <td mat-cell *matCellDef="let m">{{ locationName(m.location) }}</td>
              </ng-container>
              <ng-container matColumnDef="change">
                <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Change</ng-container></th>
                <td mat-cell *matCellDef="let m" class="!text-right font-semibold tabular-nums" [class.text-green-700]="m.deltaScaled > 0" [class.text-red-700]="m.deltaScaled < 0">{{ m.deltaScaled > 0 ? '+' : '' }}{{ m.deltaScaled / 1000 }} {{ d.item.baseUnit }}</td>
              </ng-container>
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Balance</ng-container></th>
                <td mat-cell *matCellDef="let m" class="!text-right tabular-nums">{{ m.newScaled / 1000 }} {{ d.item.baseUnit }}</td>
              </ng-container>
              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Reason</ng-container></th>
                <td mat-cell *matCellDef="let m" class="text-on-surface-variant">{{ m.reason }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="movementColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: movementColumns"></tr>
            </table>
          </mat-card>
        }
      </div>
    }`,
})
export class InventoryItemDetailComponent {
  private api = inject(InventoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private stores = inject(StoreStore);

  balanceColumns = ['location', 'quantity', 'status', 'alert'];
  movementColumns = ['when', 'what', 'where', 'change', 'balance', 'reason'];
  warnLabel = $localize`Warn at or below`;
  detail = signal<ItemDetail | null>(null);
  error = signal('');
  locations = signal<InventoryLocation[]>([]);
  units = signal<InventoryUnit[]>([]);
  private drafts = signal<Record<string, number | null>>({});
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  subtitle = computed(() => { const i = this.detail()?.item; return i ? [i.sku, i.category, i.baseUnit].filter(Boolean).join(' · ') : ''; });
  info = (s: string) => STATUS_INFO[s as keyof typeof STATUS_INFO] ?? STATUS_INFO.in_stock;
  label = (t: string) => MOVEMENT_LABELS[t] ?? t;
  locationName = (id?: string) => this.locations().find((l) => l._id === id)?.name ?? '';

  constructor() {
    effect(() => { const s = this.storeId(); if (s) { void this.reload(); void this.api.locations(s).then((l) => this.locations.set(l)); void this.api.units(s).then((u) => this.units.set(u)); } });
  }

  draft(loc: string, current: number | null) { const d = this.drafts(); return loc in d ? d[loc] : current; }
  setDraft(loc: string, v: number | null) { this.drafts.update((d) => ({ ...d, [loc]: v })); }

  async reload() {
    this.error.set('');
    try { this.detail.set(await this.api.item(this.storeId(), this.route.snapshot.paramMap.get('id')!)); this.drafts.set({}); }
    catch (e) { this.error.set(apiMessage(e)); }
  }

  edit() {
    const d = this.detail(); if (!d) return;
    this.dialog.open(ItemDialogComponent, { width: '640px', maxWidth: '95vw', data: { storeId: this.storeId(), item: d.item, units: this.units() } }).afterClosed().subscribe((ok) => ok && this.reload());
  }

  op(mode: StockOp) {
    const d = this.detail(); if (!d) return;
    this.dialog.open(StockOpDialogComponent, { width: '480px', maxWidth: '95vw', data: { storeId: this.storeId(), mode, item: d.item, locations: this.locations(), units: this.units(), balances: d.balances.map((b) => ({ location: b.location, quantity: b.quantity })) } })
      .afterClosed().subscribe((ok) => ok && this.reload());
  }

  async saveAlert(location: string, enabled: boolean) {
    const d = this.detail(); if (!d) return;
    const value = this.draft(location, d.balances.find((b) => b.location === location)?.threshold ?? null);
    if (enabled && (value === null || value === undefined || Number(value) < 0)) { this.snack.open($localize`Enter the level to warn at.`, undefined, { duration: 3000 }); return; }
    try { await this.api.setAlert(this.storeId(), d.item._id, { location, threshold: Number(value ?? 0), unit: d.item.baseUnit, enabled }); this.snack.open($localize`Saved.`, undefined, { duration: 2500 }); await this.reload(); }
    catch (e) { this.snack.open(apiMessage(e), undefined, { duration: 4000 }); }
  }
}
