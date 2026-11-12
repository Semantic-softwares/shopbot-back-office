import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryItem, InventoryUnit, apiMessage } from '../../../../shared/inventory/inventory.models';
import { StoreStore } from '../../../../shared/stores/store.store';

type Mode = 'none' | 'direct' | 'bom';
interface Row { itemId: string; text: string; quantity: number | null; unit: string }

/**
 * How selling this product affects stock, and (for "uses ingredients or components") what one portion uses up.
 * Works for a restaurant recipe and a manufacturer's parts list alike.
 */
@Component({
  selector: 'app-product-inventory',
  imports: [FormsModule, MatAutocompleteModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <mat-card appearance="outlined" data-testid="product-inventory">
      <mat-card-header class="!pb-2"><mat-card-title class="!text-base !font-medium"><ng-container i18n>Inventory tracking</ng-container></mat-card-title></mat-card-header>
      <mat-card-content class="flex flex-col gap-3">
        <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Choose what happens to stock when this product is sold.</ng-container></p>
        <mat-radio-group class="flex flex-col gap-1" [ngModel]="mode()" (ngModelChange)="setMode($event)" data-testid="tracking-mode">
          <mat-radio-button value="none"><b><ng-container i18n>Don't track stock</ng-container></b> <span class="text-sm text-on-surface-variant">— <ng-container i18n>for services and fees, such as a delivery charge</ng-container></span></mat-radio-button>
          <mat-radio-button value="direct"><b><ng-container i18n>Track this product's own stock</ng-container></b> <span class="text-sm text-on-surface-variant">— <ng-container i18n>for things you buy and sell as they are, such as a bottled drink</ng-container></span></mat-radio-button>
          <mat-radio-button value="bom"><b><ng-container i18n>It uses up ingredients or components</ng-container></b> <span class="text-sm text-on-surface-variant">— <ng-container i18n>for made-to-order items, such as a grilled fish or an assembled phone</ng-container></span></mat-radio-button>
        </mat-radio-group>

        @if (mode() === 'bom') {
          <div class="rounded-2xl border border-outline-variant/60 p-4" data-testid="bom-builder">
            <h3 class="m-0 text-sm font-semibold"><ng-container i18n>What one sale uses up</ng-container></h3>
            <p class="mt-1 mb-3 text-xs text-on-surface-variant"><ng-container i18n>List each ingredient or component and how much is used. Each sale takes these from your inventory automatically. If you make a batch, say how many portions it makes.</ng-container></p>
            <div class="mb-3 grid grid-cols-[1fr_9rem] gap-3 sm:max-w-md">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label><ng-container i18n>This list makes</ng-container></mat-label>
                <input matInput type="number" min="0" step="any" [ngModel]="output()" (ngModelChange)="output.set($event)" data-testid="bom-output" />
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label><ng-container i18n>Portions</ng-container></mat-label>
                <input matInput [ngModel]="outputUnit()" (ngModelChange)="outputUnit.set($event)" />
              </mat-form-field>
            </div>
            <div class="flex flex-col gap-2">
              @for (r of rows(); track $index) {
                <div class="grid grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto]" data-testid="bom-row">
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label><ng-container i18n>Item</ng-container></mat-label>
                    <input matInput [ngModel]="r.text" (ngModelChange)="typing(r, $event)" [matAutocomplete]="auto" autocomplete="off" data-testid="bom-item" />
                    <mat-autocomplete #auto="matAutocomplete" (optionSelected)="pick(r, $event.option.value)" [displayWith]="display">
                      @for (i of matches(r.text); track i._id) { <mat-option [value]="i._id">{{ i.name }} <span class="text-xs text-on-surface-variant">({{ i.baseUnit }})</span></mat-option> }
                    </mat-autocomplete>
                  </mat-form-field>
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label><ng-container i18n>Quantity</ng-container></mat-label>
                    <input matInput type="number" min="0" step="any" [ngModel]="r.quantity" (ngModelChange)="update(r, { quantity: $event })" data-testid="bom-qty" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label><ng-container i18n>Unit</ng-container></mat-label>
                    <mat-select [ngModel]="r.unit" (ngModelChange)="update(r, { unit: $event })" [disabled]="!r.itemId" data-testid="bom-unit">
                      @for (u of unitsFor(r.itemId); track u.code) { <mat-option [value]="u.code">{{ u.code }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button matIconButton type="button" (click)="remove($index)" aria-label="Remove" i18n-aria-label><mat-icon>close</mat-icon></button>
                </div>
              }
            </div>
            <button matButton type="button" class="mt-2" (click)="addRow()" data-testid="bom-add"><mat-icon>add</mat-icon><ng-container i18n>Add component</ng-container></button>
            @if (summary()) { <p class="mt-3 mb-0 rounded-xl bg-surface-container p-3 text-sm" data-testid="bom-summary">{{ summary() }}</p> }
            @if (!items().length) { <p class="mt-2 mb-0 text-sm text-amber-800"><ng-container i18n>You have no inventory items yet. Add them under Inventory → Inventory items first.</ng-container></p> }
          </div>
        }
        @if (error()) { <p class="m-0 text-sm text-red-700" role="alert">{{ error() }}</p> }
        <div><button matButton="filled" type="button" [disabled]="saving() || !canSave()" (click)="save()" data-testid="tracking-save"><ng-container i18n>Save inventory tracking</ng-container></button></div>
      </mat-card-content>
    </mat-card>`,
})
export class ProductInventoryComponent {
  productId = input.required<string>();
  productName = input<string>('');
  private api = inject(InventoryService);
  private stores = inject(StoreStore);
  private snack = inject(MatSnackBar);

  mode = signal<Mode>('direct'); output = signal<number | null>(1); outputUnit = signal($localize`portion`);
  rows = signal<Row[]>([]); items = signal<InventoryItem[]>([]); units = signal<InventoryUnit[]>([]);
  saving = signal(false); error = signal('');
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  /** The autocomplete's value is the item id; the box shows its name. */
  display = (id: string) => this.items().find((i) => i._id === id)?.name ?? id ?? '';

  validRows = computed(() => this.rows().filter((r) => r.itemId && (r.quantity ?? 0) > 0));
  canSave = computed(() => (this.mode() !== 'bom' ? true : this.validRows().length > 0 && (this.output() ?? 0) > 0));
  summary = computed(() => {
    if (this.mode() !== 'bom' || !this.validRows().length) return '';
    const parts = this.validRows().map((r) => `${r.quantity} ${r.unit} ${this.items().find((i) => i._id === r.itemId)?.name ?? ''}`);
    const n = this.output() ?? 1;
    return $localize`${n} ${this.outputUnit()} of ${this.productName() || 'this product'} uses ${parts.join(', ')}.`;
  });

  constructor() {
    effect(() => {
      const s = this.storeId(); const id = this.productId();
      if (!s || !id) return;
      void this.load(s, id);
    });
  }

  private async load(s: string, id: string) {
    try {
      const [t, items, units, bom] = await Promise.all([this.api.tracking(s, id), this.api.items(s, { limit: 200, active: 'true' }), this.api.units(s), this.api.bom(s, id)]);
      this.items.set(items.items); this.units.set(units); this.mode.set(t.mode);
      if (bom) {
        this.output.set(bom.outputQuantity); if (bom.outputUnit) this.outputUnit.set(bom.outputUnit);
        this.rows.set(bom.components.map((c: any) => ({ itemId: String(c.item?._id ?? c.item), text: c.item?.name ?? '', quantity: c.quantity, unit: c.unit })));
      } else if (!this.rows().length) this.addRow();
    } catch (e) { this.error.set(apiMessage(e)); }
  }

  setMode(m: Mode) { this.mode.set(m); if (m === 'bom' && !this.rows().length) this.addRow(); }
  addRow() { this.rows.update((r) => [...r, { itemId: '', text: '', quantity: null, unit: '' }]); }
  remove(i: number) { this.rows.update((r) => r.filter((_, x) => x !== i)); }
  update(row: Row, patch: Partial<Row>) { this.rows.update((r) => r.map((x) => (x === row ? { ...x, ...patch } : x))); }
  /** Typing clears the chosen item; picking from the list (which first echoes the item's id here) does not. */
  typing(row: Row, text: string) { if (this.items().some((i) => i._id === text)) return; this.update(row, { text, itemId: '' }); }
  matches(text: string) { const q = (text ?? '').toLowerCase(); return this.items().filter((i) => !q || i.name.toLowerCase().includes(q) || (i.sku ?? '').toLowerCase().includes(q)).slice(0, 30); }
  pick(row: Row, id: string) { const it = this.items().find((i) => i._id === id); if (it) this.update(row, { itemId: id, text: it.name, unit: it.baseUnit }); }
  unitsFor(itemId: string) { const it = this.items().find((i) => i._id === itemId); const d = this.units().find((u) => u.code === it?.baseUnit)?.dimension; return it ? this.units().filter((u) => u.dimension === d) : []; }

  async save() {
    const s = this.storeId(); const id = this.productId();
    this.saving.set(true); this.error.set('');
    try {
      if (this.mode() === 'bom') {
        await this.api.saveBom(s, id, { outputQuantity: Number(this.output()), outputUnit: this.outputUnit(), components: this.validRows().map((r) => ({ item: r.itemId, quantity: Number(r.quantity), unit: r.unit })) });
      }
      await this.api.setTracking(s, id, this.mode());
      this.snack.open($localize`Inventory tracking saved.`, undefined, { duration: 3000 });
    } catch (e) { this.error.set(apiMessage(e)); }
    this.saving.set(false);
  }
}
