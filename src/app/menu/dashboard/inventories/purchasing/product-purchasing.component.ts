import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductSupplierLink, PurchasingService } from '../../../../shared/services/purchasing.service';
import { RolesService } from '../../../../shared/services/roles.service';
import { SuppliersService } from '../../../../shared/services/suppliers.service';
import { StoreStore } from '../../../../shared/stores/store.store';

interface Draft { supplier: string; supplierSku: string; purchaseUnit: string; packSize: number; defaultCost: number; minOrderQty: number | null; leadTimeDays: number | null; preferred: boolean }
const blank = (): Draft => ({ supplier: '', supplierSku: '', purchaseUnit: '', packSize: 1, defaultCost: 0, minOrderQty: null, leadTimeDays: null, preferred: false });

/**
 * Who sells this product and on what terms: their code, the cost we normally pay, how they pack it (a carton of 24), and which
 * supplier is preferred. Purchase cost here is separate from the selling price. Shown when editing an existing product.
 */
@Component({
  selector: 'app-product-purchasing',
  imports: [CurrencyPipe, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <mat-card appearance="outlined">
      <mat-card-header class="!pb-2"><mat-card-title class="!text-base !font-medium"><ng-container i18n>Suppliers & purchasing</ng-container></mat-card-title></mat-card-header>
      <mat-card-content class="!pt-4">
        @if (!links().length && !editing()) { <p class="mt-0 text-sm text-on-surface-variant"><ng-container i18n>No supplier is set for this product yet. Add one so it can be put on purchase orders.</ng-container></p> }
        <div class="flex flex-col gap-3">
          @for (l of links(); track l._id) {
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 p-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 font-medium">{{ l.supplier?.name }} @if (l.preferred) { <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-900"><ng-container i18n>Preferred</ng-container></span> }</div>
                <div class="text-xs text-on-surface-variant">
                  @if (l.supplierSku) { <ng-container i18n>code {{ l.supplierSku }}</ng-container> · }
                  {{ l.defaultCost | currency: currency() : 'symbol' : '1.2-2' }} / {{ l.purchaseUnit }}@if ((l.packSize || 1) > 1) { · <ng-container i18n>{{ l.packSize }} per {{ l.purchaseUnit }}</ng-container> }@if (l.minOrderQty) { · <ng-container i18n>min {{ l.minOrderQty }}</ng-container> }
                </div>
              </div>
              @if (canEdit()) {
                <div class="flex gap-1">
                  <button matIconButton type="button" (click)="edit(l)" aria-label="Edit" i18n-aria-label><mat-icon>edit</mat-icon></button>
                  <button matIconButton type="button" (click)="remove(l)" aria-label="Remove" i18n-aria-label><mat-icon>delete</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>

        @if (editing()) {
          <div class="mt-4 grid grid-cols-1 items-start gap-x-3 gap-y-4 rounded-2xl bg-surface-container p-4 sm:grid-cols-2">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Supplier</ng-container></mat-label>
              <mat-select [value]="draft().supplier" (selectionChange)="set({ supplier: $event.value })">
                @for (s of suppliers(); track s._id) { <mat-option [value]="s._id">{{ s.name }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Supplier code</ng-container></mat-label><input matInput [ngModel]="draft().supplierSku" (ngModelChange)="set({ supplierSku: $event })" [ngModelOptions]="{ standalone: true }" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Purchase unit</ng-container></mat-label><input matInput placeholder="carton, case…" i18n-placeholder [ngModel]="draft().purchaseUnit" (ngModelChange)="set({ purchaseUnit: $event })" [ngModelOptions]="{ standalone: true }" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Units per purchase unit</ng-container></mat-label><input matInput type="number" min="0.001" step="any" [ngModel]="draft().packSize" (ngModelChange)="set({ packSize: +$event })" [ngModelOptions]="{ standalone: true }" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Cost per purchase unit</ng-container></mat-label><input matInput type="number" min="0" step="0.01" [ngModel]="draft().defaultCost" (ngModelChange)="set({ defaultCost: +$event })" [ngModelOptions]="{ standalone: true }" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Minimum order qty</ng-container></mat-label><input matInput type="number" min="0" step="any" [ngModel]="draft().minOrderQty" (ngModelChange)="set({ minOrderQty: $event === '' || $event === null ? null : +$event })" [ngModelOptions]="{ standalone: true }" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full"><mat-label><ng-container i18n>Lead time (days)</ng-container></mat-label><input matInput type="number" min="0" [ngModel]="draft().leadTimeDays" (ngModelChange)="set({ leadTimeDays: $event === '' || $event === null ? null : +$event })" [ngModelOptions]="{ standalone: true }" /></mat-form-field>
            <label class="flex items-center gap-2 self-center text-sm"><input type="checkbox" [ngModel]="draft().preferred" (ngModelChange)="set({ preferred: $event })" [ngModelOptions]="{ standalone: true }" /><ng-container i18n>Preferred supplier for this product</ng-container></label>
            @if (error()) { <p class="col-span-full text-sm text-red-700" role="alert">{{ error() }}</p> }
            <div class="col-span-full mt-2 flex justify-end gap-2">
              <button matButton type="button" (click)="editing.set(false)"><ng-container i18n>Cancel</ng-container></button>
              <button matButton="filled" type="button" [disabled]="busy() || !draft().supplier" (click)="save()"><ng-container i18n>Save supplier terms</ng-container></button>
            </div>
          </div>
        } @else if (canEdit()) {
          <button matButton="outlined" type="button" class="mt-3" (click)="add()"><mat-icon>add</mat-icon><ng-container i18n>Add a supplier</ng-container></button>
        }
      </mat-card-content>
    </mat-card>`,
})
export class ProductPurchasingComponent {
  readonly productId = input.required<string>();
  private readonly api = inject(PurchasingService);
  private readonly storeStore = inject(StoreStore);
  private readonly suppliersApi = inject(SuppliersService);
  private readonly roles = inject(RolesService);
  private readonly snack = inject(MatSnackBar);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  readonly canEdit = computed(() => this.roles.isAdmin() || this.roles.hasAny(['erp.purchasing.create']));
  private readonly refresh = signal(0);
  readonly editing = signal(false);
  readonly draft = signal<Draft>(blank());
  readonly busy = signal(false);
  readonly error = signal('');

  private readonly res = rxResource({ params: () => ({ s: this.storeId(), p: this.productId(), r: this.refresh() }), stream: ({ params }) => (params.s && params.p ? this.api.links(params.s, { product: params.p }) : of([] as ProductSupplierLink[])) });
  readonly links = computed(() => (this.res.hasValue() ? this.res.value() : []));
  private readonly suppliersRes = rxResource({ params: () => this.storeId(), stream: ({ params }) => (params ? this.suppliersApi.getSuppliersByStore(params) : of([])) });
  readonly suppliers = computed(() => (this.suppliersRes.hasValue() ? this.suppliersRes.value() : []));

  set(p: Partial<Draft>) { this.draft.update((d) => ({ ...d, ...p })); }
  add() { this.draft.set({ ...blank(), preferred: this.links().length === 0 }); this.error.set(''); this.editing.set(true); }
  edit(l: ProductSupplierLink) {
    this.draft.set({ supplier: l.supplier?._id ?? '', supplierSku: l.supplierSku ?? '', purchaseUnit: l.purchaseUnit ?? '', packSize: l.packSize ?? 1, defaultCost: l.defaultCost ?? 0, minOrderQty: l.minOrderQty ?? null, leadTimeDays: l.leadTimeDays ?? null, preferred: !!l.preferred });
    this.error.set('');
    this.editing.set(true);
  }
  save() {
    this.busy.set(true);
    this.error.set('');
    const d = this.draft();
    this.api.saveLink(this.storeId(), { product: this.productId(), ...d }).subscribe({
      next: () => { this.busy.set(false); this.editing.set(false); this.refresh.update((n) => n + 1); this.snack.open($localize`Supplier terms saved`, $localize`Close`, { duration: 2500 }); },
      error: (e) => { this.error.set(e?.error?.message || $localize`Could not save.`); this.busy.set(false); },
    });
  }
  remove(l: ProductSupplierLink) {
    this.api.removeLink(this.storeId(), l._id).subscribe({ next: () => this.refresh.update((n) => n + 1), error: (e) => this.snack.open(e?.error?.message || $localize`Could not remove.`, $localize`Close`, { duration: 3000 }) });
  }
}
