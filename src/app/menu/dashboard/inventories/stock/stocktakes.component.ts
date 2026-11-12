import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryItem, InventoryLocation, Stocktake, apiMessage } from '../../../../shared/inventory/inventory.models';
import { StoreStore } from '../../../../shared/stores/store.store';

/** Stocktakes: count what is really on the shelf, compare, and approve the differences as adjustments. */
@Component({
  selector: 'app-stocktakes',
  imports: [DatePipe, RouterLink, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTableModule, NoRecordComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Stocktakes" i18n-title subtitle="Count the stock in a location and approve the differences. Each difference becomes an auditable adjustment." i18n-subtitle></app-page-header>
    <div class="flex flex-col gap-5 p-4 pb-16 md:p-6">
      <mat-card appearance="outlined"><mat-card-content class="flex flex-wrap items-center gap-3 !py-4">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-64">
          <mat-label><ng-container i18n>Location to count</ng-container></mat-label>
          <mat-select [ngModel]="location()" (ngModelChange)="location.set($event)" data-testid="st-location">
            @for (l of locations(); track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <button matButton="filled" [disabled]="!location() || starting()" (click)="start()" data-testid="st-start"><mat-icon>add</mat-icon><ng-container i18n>Start a stocktake</ng-container></button>
        @if (error()) { <span class="text-sm text-red-700" role="alert">{{ error() }}</span> }
      </mat-card-content></mat-card>
      @if (!list().length) {
        <app-no-record icon="fact_check" title="No stocktakes yet." i18n-title message="Start one to count what is really in a location." i18n-message></app-no-record>
      } @else {
        <mat-card appearance="outlined" class="overflow-x-auto">
          <table mat-table [dataSource]="list()" class="w-full min-w-[560px]">
            <ng-container matColumnDef="started"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Started</ng-container></th><td mat-cell *matCellDef="let s">{{ s.createdAt | date: 'MMM d, y HH:mm' }}</td></ng-container>
            <ng-container matColumnDef="location"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Location</ng-container></th><td mat-cell *matCellDef="let s">{{ s.location?.name }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Status</ng-container></th><td mat-cell *matCellDef="let s"><mat-chip>{{ statusLabel(s.status) }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="open"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let s" class="!text-right"><a matButton [routerLink]="['./', s._id]"><ng-container i18n>Open</ng-container></a></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="listColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: listColumns"></tr>
          </table>
        </mat-card>
      }
    </div>`,
})
export class StocktakesComponent {
  private api = inject(InventoryService);
  private stores = inject(StoreStore);
  private router = inject(Router);
  listColumns = ['started', 'location', 'status', 'open'];
  list = signal<Stocktake[]>([]); locations = signal<InventoryLocation[]>([]); location = signal(''); error = signal(''); starting = signal(false);
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  statusLabel = (s: string) => ({ draft: $localize`Counting`, approving: $localize`Approving`, approved: $localize`Approved`, cancelled: $localize`Cancelled` } as Record<string, string>)[s] ?? s;
  constructor() {
    effect(() => { const s = this.storeId(); if (!s) return; void this.api.locations(s).then((l) => { this.locations.set(l); if (!this.location()) this.location.set(l.find((x) => x.isDefault)?._id ?? l[0]?._id ?? ''); }); void this.api.stocktakes(s).then((l) => this.list.set(l)).catch((e) => this.error.set(apiMessage(e))); });
  }
  async start() {
    this.starting.set(true); this.error.set('');
    try { const st = await this.api.startStocktake(this.storeId(), this.location()); void this.router.navigate(['/menu/erp/inventory/stocktakes', st._id]); }
    catch (e) { this.error.set(apiMessage(e)); this.starting.set(false); }
  }
}

/** Counting screen: type what you find; empty rows are left alone. */
@Component({
  selector: 'app-stocktake-detail',
  imports: [RouterLink, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header [title]="title()" subtitle="Enter the quantity you counted for each item. Leave an item empty if you did not count it." i18n-subtitle>
      <ng-container actions><a matButton routerLink="../"><mat-icon>arrow_back</mat-icon><ng-container i18n>All stocktakes</ng-container></a></ng-container>
    </app-page-header>
    @if (st(); as s) {
      <div class="flex flex-col gap-4 p-4 pb-16 md:p-6">
        <mat-card appearance="outlined" class="overflow-x-auto">
          <table mat-table [dataSource]="s.lines" class="w-full min-w-[640px]" data-testid="count-table">
            <ng-container matColumnDef="item"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Item</ng-container></th><td mat-cell *matCellDef="let l" class="font-medium">{{ name(l.item) }}</td></ng-container>
            <ng-container matColumnDef="system"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>System says</ng-container></th><td mat-cell *matCellDef="let l" class="!text-right tabular-nums">{{ l.systemScaled / 1000 }} {{ unit(l.item) }}</td></ng-container>
            <ng-container matColumnDef="counted">
              <th mat-header-cell *matHeaderCellDef><ng-container i18n>Counted</ng-container></th>
              <td mat-cell *matCellDef="let l">
                @if (s.status === 'draft') {
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-36">
                    <input matInput type="number" min="0" step="any" [ngModel]="counted(l)" (ngModelChange)="setCount(l.item, $event)" [attr.data-testid]="'count-' + name(l.item)" [attr.aria-label]="countedLabel" />
                    <span matTextSuffix>{{ unit(l.item) }}</span>
                  </mat-form-field>
                } @else { {{ l.countedScaled === null ? '—' : l.countedScaled / 1000 }} }
              </td>
            </ng-container>
            <ng-container matColumnDef="difference"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Difference</ng-container></th><td mat-cell *matCellDef="let l" class="!text-right font-semibold tabular-nums" [class.text-red-700]="diff(l) < 0" [class.text-green-700]="diff(l) > 0">{{ diffText(l) }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="countColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: countColumns"></tr>
          </table>
        </mat-card>
        @if (error()) { <p class="text-sm text-red-700" role="alert">{{ error() }}</p> }
        @if (s.status === 'draft') {
          <div class="flex flex-wrap gap-2">
            <button matButton="filled" [disabled]="busy()" (click)="approve()" data-testid="st-approve"><ng-container i18n>Save counts and approve</ng-container></button>
            <button matButton [disabled]="busy()" (click)="save()"><ng-container i18n>Save counts</ng-container></button>
            <button matButton [disabled]="busy()" (click)="cancel()"><ng-container i18n>Cancel stocktake</ng-container></button>
          </div>
        }
      </div>
    }`,
})
export class StocktakeDetailComponent {
  private api = inject(InventoryService);
  private stores = inject(StoreStore);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  countColumns = ['item', 'system', 'counted', 'difference'];
  countedLabel = $localize`Counted`;
  st = signal<Stocktake | null>(null); items = signal<InventoryItem[]>([]); error = signal(''); busy = signal(false);
  private typed = signal<Record<string, number | null>>({});
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  title = computed(() => $localize`Stocktake` + (this.st()?.location?.name ? ` · ${this.st()!.location.name}` : ''));
  name = (id: string) => this.items().find((i) => i._id === id)?.name ?? '';
  unit = (id: string) => this.items().find((i) => i._id === id)?.baseUnit ?? '';
  constructor() { effect(() => { if (this.storeId()) void this.load(); }); }
  async load() {
    const s = this.storeId();
    try { const [st, items] = await Promise.all([this.api.stocktake(s, this.route.snapshot.paramMap.get('id')!), this.api.items(s, { limit: 200 })]); this.st.set(st); this.items.set(items.items); } catch (e) { this.error.set(apiMessage(e)); }
  }
  counted(l: { item: string; countedScaled: number | null }) { const t = this.typed(); return l.item in t ? t[l.item] : (l.countedScaled === null ? null : l.countedScaled / 1000); }
  setCount(item: string, v: number | null) { this.typed.update((t) => ({ ...t, [item]: v })); }
  diff(l: { item: string; systemScaled: number; countedScaled: number | null }) { const c = this.counted(l); return c === null || c === undefined || (c as any) === '' ? 0 : Number(c) - l.systemScaled / 1000; }
  diffText(l: any) { const c = this.counted(l); if (c === null || c === undefined || (c as any) === '') return '—'; const d = this.diff(l); return `${d > 0 ? '+' : ''}${Math.round(d * 1000) / 1000}`; }
  private payload() { return Object.entries(this.typed()).filter(([, v]) => v !== null && v !== undefined && (v as any) !== '').map(([item, counted]) => ({ item, counted: Number(counted), unit: this.unit(item) })); }
  async save() { this.busy.set(true); this.error.set(''); try { const p = this.payload(); if (p.length) this.st.set(await this.api.saveCounts(this.storeId(), this.st()!._id, p)); this.typed.set({}); this.snack.open($localize`Counts saved.`, undefined, { duration: 2500 }); } catch (e) { this.error.set(apiMessage(e)); } this.busy.set(false); }
  async approve() {
    this.busy.set(true); this.error.set('');
    try { const p = this.payload(); if (p.length) await this.api.saveCounts(this.storeId(), this.st()!._id, p); const r = await this.api.approveStocktake(this.storeId(), this.st()!._id); this.st.set(r.stocktake); this.typed.set({}); this.snack.open($localize`Stocktake approved. ${r.applied} adjustments recorded.`, undefined, { duration: 4000 }); }
    catch (e) { this.error.set(apiMessage(e)); }
    this.busy.set(false);
  }
  async cancel() { this.busy.set(true); try { this.st.set(await this.api.cancelStocktake(this.storeId(), this.st()!._id)); } catch (e) { this.error.set(apiMessage(e)); } this.busy.set(false); }
}
