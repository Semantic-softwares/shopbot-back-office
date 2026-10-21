import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ValidationErrorsDialogComponent } from '../../../../shared/components/validation-errors-dialog/validation-errors-dialog.component';
import { PoDraftBody, PurchaseOrder, PurchasingService } from '../../../../shared/services/purchasing.service';
import { ProductService } from '../../../../shared/services/product.service';
import { SuppliersService } from '../../../../shared/services/suppliers.service';
import { StoreStore } from '../../../../shared/stores/store.store';

interface Line { product: string; name: string; sku?: string; unit?: string; quantity: number; unitCost: number }
const ymd = (d: Date | null): string | null => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null);
const cents = (n: number) => Math.round((Number(n) || 0) * 100);

/**
 * Create a purchase order by hand, edit a draft, or amend one that was already sent (the amend route asks for a reason and the
 * supplier is told to expect a new revision). The totals shown are a preview; the server works out the real ones when it saves.
 */
@Component({
  selector: 'app-po-form',
  imports: [MatCardModule, MatTableModule, CurrencyPipe, FormsModule, RouterLink, PageHeaderComponent, MatAutocompleteModule, MatButtonModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header [title]="title()" [subtitle]="subtitle()">
      <ng-container actions>
        <button matButton routerLink="/menu/erp/inventory/purchasing"><mat-icon>close</mat-icon><ng-container i18n>Cancel</ng-container></button>
        <button matButton="filled" [disabled]="busy()" (click)="save()"><mat-icon>save</mat-icon>@if (amending()) {<ng-container i18n>Save amendment</ng-container>} @else {<ng-container i18n>Save draft</ng-container>}</button>
      </ng-container>
    </app-page-header>

    @if (existing.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    <div class="mx-auto flex max-w-5xl flex-col gap-5 p-4 pb-16 md:p-6">
      @if (error()) { <div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">{{ error() }}</div> }

      @if (amending()) {
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ng-container i18n>This order was already sent to the supplier. Your changes create a new revision and the old one is kept. You will need to send it again.</ng-container>
          <mat-form-field appearance="outline" class="mt-3 w-full" subscriptSizing="dynamic"><mat-label><ng-container i18n>Why is it being amended?</ng-container></mat-label><input matInput [ngModel]="reason()" (ngModelChange)="reason.set($event)" /></mat-form-field>
        </div>
      }

      <mat-card appearance="outlined"><mat-card-content class="!p-5">
        <h3 class="m-0 mb-3 text-base font-semibold"><ng-container i18n>Supplier and delivery</ng-container></h3>
        <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <mat-form-field appearance="outline">
            <mat-label><ng-container i18n>Supplier</ng-container></mat-label>
            <mat-select [value]="supplier()" (selectionChange)="supplier.set($event.value)" [disabled]="amending()">
              @for (s of suppliers(); track s._id) { <mat-option [value]="s._id">{{ s.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label><ng-container i18n>Expected delivery</ng-container></mat-label>
            <input matInput [matDatepicker]="dp" [ngModel]="expected()" (ngModelChange)="expected.set($event)" />
            <mat-datepicker-toggle matIconSuffix [for]="dp" /><mat-datepicker #dp />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic"><mat-label><ng-container i18n>Delivery instructions</ng-container></mat-label><textarea matInput rows="2" [ngModel]="instructions()" (ngModelChange)="instructions.set($event)"></textarea></mat-form-field>
      </mat-card-content></mat-card>

      <mat-card appearance="outlined"><mat-card-content class="!p-5">
        <h3 class="m-0 mb-3 text-base font-semibold"><ng-container i18n>Items</ng-container></h3>
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
          <mat-icon matPrefix class="ml-3 text-on-surface-variant">add_shopping_cart</mat-icon>
          <input matInput placeholder="Search a product to add" i18n-placeholder [matAutocomplete]="auto" [ngModel]="query()" (ngModelChange)="onQuery($event)" [disabled]="!supplier()" autocomplete="off" />
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="add($event.option.value)" [displayWith]="blank">
            @for (p of results(); track p._id) { <mat-option [value]="p">{{ p.name }} <span class="text-xs text-on-surface-variant">{{ p.sku }}</span></mat-option> }
          </mat-autocomplete>
          @if (!supplier()) { <mat-hint><ng-container i18n>Choose the supplier first.</ng-container></mat-hint> }
        </mat-form-field>

        @if (lines().length) {
          <div class="-mx-4 mt-4 overflow-x-auto">
            <table mat-table [dataSource]="lines()" class="w-full min-w-[640px]">
              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Product</ng-container></th>
                <td mat-cell *matCellDef="let l"><div class="font-medium">{{ l.name }}</div><div class="text-xs text-on-surface-variant">{{ l.sku }}@if (l.unit) { · {{ l.unit }} }</div></td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Quantity</ng-container></th>
                <td mat-cell *matCellDef="let l; let i = index"><mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-28"><input matInput type="number" min="0" step="any" class="!text-right tabular-nums" [ngModel]="l.quantity" (ngModelChange)="setLine(i, { quantity: +$event })" aria-label="Quantity" i18n-aria-label /></mat-form-field></td>
              </ng-container>
              <ng-container matColumnDef="cost">
                <th mat-header-cell *matHeaderCellDef><ng-container i18n>Unit cost</ng-container></th>
                <td mat-cell *matCellDef="let l; let i = index"><mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field w-28"><input matInput type="number" min="0" step="0.01" class="!text-right tabular-nums" [ngModel]="l.unitCost" (ngModelChange)="setLine(i, { unitCost: +$event })" aria-label="Unit cost" i18n-aria-label /></mat-form-field></td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Line total</ng-container></th>
                <td mat-cell *matCellDef="let l" class="text-right tabular-nums">{{ lineTotal(l) | currency: currency() : 'symbol' : '1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="remove">
                <th mat-header-cell *matHeaderCellDef class="!w-12"></th>
                <td mat-cell *matCellDef="let l; let i = index"><button matIconButton (click)="remove(i)" aria-label="Remove" i18n-aria-label><mat-icon>close</mat-icon></button></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let l; columns: columns"></tr>
            </table>
          </div>
        } @else {
          <p class="mt-4 text-sm text-on-surface-variant"><ng-container i18n>No items yet. Search above to add products.</ng-container></p>
        }
      </mat-card-content></mat-card>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <mat-card appearance="outlined"><mat-card-content class="!p-5">
          <h3 class="m-0 mb-3 text-base font-semibold"><ng-container i18n>Notes</ng-container></h3>
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic"><textarea matInput rows="4" [ngModel]="notes()" (ngModelChange)="notes.set($event)" aria-label="Notes" i18n-aria-label></textarea></mat-form-field>
        </mat-card-content></mat-card>
        <mat-card appearance="outlined"><mat-card-content class="!p-5">
          <h3 class="m-0 mb-3 text-base font-semibold"><ng-container i18n>Totals</ng-container></h3>
          <div class="flex flex-col gap-2 text-sm">
            <div class="flex justify-between"><span><ng-container i18n>Subtotal</ng-container></span><span class="tabular-nums">{{ subtotal() | currency: currency() : 'symbol' : '1.2-2' }}</span></div>
            <label class="flex items-center justify-between gap-3"><span><ng-container i18n>Discount</ng-container></span><input type="number" min="0" step="0.01" class="w-28 rounded-lg border border-outline-variant bg-transparent px-2 py-1 text-right tabular-nums" [ngModel]="discount()" (ngModelChange)="discount.set(+$event || 0)" /></label>
            <label class="flex items-center justify-between gap-3"><span><ng-container i18n>Shipping</ng-container></span><input type="number" min="0" step="0.01" class="w-28 rounded-lg border border-outline-variant bg-transparent px-2 py-1 text-right tabular-nums" [ngModel]="shipping()" (ngModelChange)="shipping.set(+$event || 0)" /></label>
            <label class="flex items-center justify-between gap-3"><span><ng-container i18n>Tax</ng-container></span><input type="number" min="0" step="0.01" class="w-28 rounded-lg border border-outline-variant bg-transparent px-2 py-1 text-right tabular-nums" [ngModel]="tax()" (ngModelChange)="tax.set(+$event || 0)" /></label>
            <div class="mt-1 flex justify-between border-t border-outline-variant/60 pt-2 text-base font-semibold"><span><ng-container i18n>Total</ng-container></span><span class="tabular-nums">{{ total() | currency: currency() : 'symbol' : '1.2-2' }}</span></div>
            <p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>The final totals are worked out when you save.</ng-container></p>
          </div>
        </mat-card-content></mat-card>
      </div>
    </div>`,
})
export class PoFormComponent {
  private readonly api = inject(PurchasingService);
  private readonly products = inject(ProductService);
  private readonly suppliersApi = inject(SuppliersService);
  private readonly storeStore = inject(StoreStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  readonly orderId = this.route.snapshot.paramMap.get('id');
  readonly amending = signal(this.route.snapshot.routeConfig?.path?.endsWith('amend') ?? false);
  readonly editing = !!this.orderId;
  readonly title = computed(() => (this.amending() ? $localize`Amend purchase order` : this.editing ? $localize`Edit draft order` : $localize`New purchase order`));
  readonly subtitle = computed(() => (this.amending() ? $localize`Changes make a new revision to send to the supplier.` : $localize`Orders do not change your stock until the goods are received.`));

  readonly supplier = signal('');
  readonly expected = signal<Date | null>(null);
  readonly instructions = signal('');
  readonly notes = signal('');
  readonly discount = signal(0);
  readonly shipping = signal(0);
  readonly tax = signal(0);
  readonly lines = signal<Line[]>([]);
  readonly reason = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly query = signal('');
  readonly results = signal<any[]>([]);
  readonly blank = () => '';
  readonly columns = ['product', 'quantity', 'cost', 'total', 'remove'];
  private readonly typed = new Subject<string>();

  private readonly suppliersRes = rxResource({ params: () => this.storeId(), stream: ({ params }) => (params ? this.suppliersApi.getSuppliersByStore(params) : of([])) });
  readonly suppliers = computed(() => (this.suppliersRes.hasValue() ? this.suppliersRes.value() : []));
  readonly existing = rxResource({ params: () => ({ s: this.storeId(), id: this.orderId }), stream: ({ params }) => (params.s && params.id ? this.api.get(params.s, params.id) : of(null)) });

  readonly lineTotal = (l: Line) => cents(l.quantity) / 100 * (Number(l.unitCost) || 0);
  readonly subtotal = computed(() => this.lines().reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * cents(l.unitCost)), 0) / 100);
  readonly total = computed(() => Math.max(0, this.subtotal() - this.discount() + this.shipping() + this.tax()));

  constructor() {
    effect(() => {
      const o = this.existing.hasValue() ? this.existing.value() : null;
      if (!o) return;
      this.supplier.set(o.supplier);
      this.expected.set(o.expectedDate ? new Date(o.expectedDate) : null);
      this.instructions.set(o.deliveryInstructions ?? '');
      this.notes.set(o.notes ?? '');
      this.discount.set(o.discount);
      this.shipping.set(o.shipping);
      this.tax.set(o.tax);
      this.lines.set(o.lines.map((l) => ({ product: l.product, name: l.name, sku: l.sku, unit: l.purchaseUnit, quantity: l.quantity, unitCost: l.unitCost })));
    });
    this.typed.pipe(debounceTime(250), distinctUntilChanged(), switchMap((q) => (q.trim().length >= 2 && this.storeId() ? this.products.searchForAutocomplete(this.storeId(), q.trim(), this.lines().map((l) => l.product)) : of([])))).subscribe((r) => this.results.set(r as any[]));
  }

  onQuery(v: unknown) { if (typeof v === 'string') { this.query.set(v); this.typed.next(v); } }

  /** Adds a product at this supplier's agreed cost when one is saved for it, otherwise the product's own cost. */
  add(p: any) {
    this.query.set('');
    this.results.set([]);
    this.api.links(this.storeId(), { product: p._id, supplier: this.supplier() }).subscribe({
      next: (links) => this.push(p, links[0]),
      error: () => this.push(p, undefined),
    });
  }
  private push(p: any, link: any) {
    if (this.lines().some((l) => l.product === p._id)) return;
    this.lines.update((ls) => [...ls, { product: p._id, name: p.name, sku: p.sku, unit: link?.purchaseUnit || p.units, quantity: link?.minOrderQty || 1, unitCost: link?.defaultCost ?? p.costPrice ?? 0 }]);
  }
  setLine(i: number, patch: Partial<Line>) { this.lines.update((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l))); }
  remove(i: number) { this.lines.update((ls) => ls.filter((_, k) => k !== i)); }

  private problems(): Record<string, { title: string; detail?: string }> {
    const p: Record<string, { title: string; detail?: string }> = {};
    if (!this.supplier()) p['supplier'] = { title: $localize`Supplier`, detail: $localize`Choose who you are ordering from.` };
    if (!this.lines().length) p['items'] = { title: $localize`Items`, detail: $localize`Add at least one product.` };
    this.lines().forEach((l, i) => {
      if (!(Number(l.quantity) > 0)) p[`line${i}q`] = { title: l.name, detail: $localize`The quantity must be more than zero.` };
      if (!(Number(l.unitCost) >= 0)) p[`line${i}c`] = { title: l.name, detail: $localize`The unit cost cannot be negative.` };
    });
    if (this.amending() && !this.reason().trim()) p['reason'] = { title: $localize`Reason`, detail: $localize`Say why the order is being amended.` };
    return p;
  }

  save() {
    const labels = this.problems();
    const bad = Object.keys(labels);
    if (bad.length) {
      this.dialog.open(ValidationErrorsDialogComponent, { width: '500px', data: { invalidControls: bad, labels, title: $localize`Check the order`, message: $localize`Fix the following before saving:` } });
      return;
    }
    const body: PoDraftBody = {
      supplier: this.supplier(),
      lines: this.lines().map((l) => ({ product: l.product, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })),
      expectedDate: ymd(this.expected()),
      deliveryInstructions: this.instructions(),
      notes: this.notes(),
      discount: this.discount(),
      shipping: this.shipping(),
      tax: this.tax(),
    };
    this.busy.set(true);
    this.error.set('');
    const s = this.storeId();
    const call = this.amending() ? this.api.amend(s, this.orderId!, { ...body, reason: this.reason().trim() }) : this.editing ? this.api.update(s, this.orderId!, body) : this.api.create(s, body);
    call.subscribe({
      next: (o: PurchaseOrder) => { this.snack.open($localize`Saved ${o.number}`, $localize`Close`, { duration: 3000 }); this.router.navigate(['/menu/erp/inventory/purchasing', o._id]); },
      error: (e) => { this.error.set(e?.error?.message || $localize`Could not save the order.`); this.busy.set(false); },
    });
  }
}
