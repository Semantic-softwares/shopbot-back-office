import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { DIMENSION_LABELS, Dimension, InventoryItem, InventoryUnit, apiMessage } from '../../../../shared/inventory/inventory.models';

export interface ItemDialogData { storeId: string; item?: InventoryItem; units: InventoryUnit[] }

/** Create or edit an inventory item: anything the business keeps in stock and measures, from fish to circuit boards. */
@Component({
  selector: 'app-inventory-item-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ data.item ? editTitle : newTitle }}</h2>
    <mat-dialog-content class="!pt-2">
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Item name</ng-container></mat-label>
          <input matInput [ngModel]="name()" (ngModelChange)="name.set($event)" data-testid="item-name" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>SKU or item code</ng-container></mat-label>
          <input matInput [ngModel]="sku()" (ngModelChange)="sku.set($event)" data-testid="item-sku" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Category</ng-container></mat-label>
          <input matInput [ngModel]="category()" (ngModelChange)="category.set($event)" placeholder="e.g. Meat, Components" i18n-placeholder autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Stock unit</ng-container></mat-label>
          <mat-select [ngModel]="baseUnit()" (ngModelChange)="onBase($event)" [disabled]="!!data.item" data-testid="item-unit">
            @for (g of groups(); track g.dimension) {
              <mat-optgroup [label]="g.label">
                @for (u of g.units; track u.code) { <mat-option [value]="u.code">{{ u.label }} ({{ u.code }})</mat-option> }
              </mat-optgroup>
            }
          </mat-select>
          <mat-hint><ng-container i18n>What you count it in. It cannot change once stock exists.</ng-container></mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Default cost per stock unit</ng-container></mat-label>
          <input matInput type="number" min="0" step="any" [ngModel]="cost()" (ngModelChange)="cost.set($event)" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Bought in (optional)</ng-container></mat-label>
          <mat-select [ngModel]="purchaseUnit()" (ngModelChange)="purchaseUnit.set($event)">
            <mat-option value=""><ng-container i18n>Same as stock unit</ng-container></mat-option>
            @for (u of sameDimension(); track u.code) { <mat-option [value]="u.code">{{ u.label }} ({{ u.code }})</mat-option> }
            <mat-option value="__custom"><ng-container i18n>Box, carton or pack…</ng-container></mat-option>
          </mat-select>
        </mat-form-field>
        @if (purchaseUnit() === '__custom') {
          <mat-form-field appearance="outline">
            <mat-label><ng-container i18n>Name of the pack</ng-container></mat-label>
            <input matInput [ngModel]="customName()" (ngModelChange)="customName.set($event)" placeholder="box" autocomplete="off" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label><ng-container i18n>Stock units in one pack</ng-container></mat-label>
            <input matInput type="number" min="0" step="any" [ngModel]="factor()" (ngModelChange)="factor.set($event)" />
            <mat-hint><ng-container i18n>For example 12 if a box holds 12 pieces.</ng-container></mat-hint>
          </mat-form-field>
        }
      </div>

      <div class="mt-2 rounded-2xl border border-outline-variant/60 p-4">
        <mat-slide-toggle [ngModel]="alertOn()" (ngModelChange)="alertOn.set($event)" data-testid="item-alert-toggle"><ng-container i18n>Warn me when stock is low</ng-container></mat-slide-toggle>
        @if (alertOn()) {
          <div class="mt-3 grid grid-cols-2 gap-x-4">
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>Warn at or below</ng-container></mat-label>
              <input matInput type="number" min="0" step="any" [ngModel]="threshold()" (ngModelChange)="threshold.set($event)" data-testid="item-threshold" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>Unit</ng-container></mat-label>
              <mat-select [ngModel]="thresholdUnit()" (ngModelChange)="thresholdUnit.set($event)">
                @for (u of sameDimension(); track u.code) { <mat-option [value]="u.code">{{ u.label }} ({{ u.code }})</mat-option> }
              </mat-select>
            </mat-form-field>
          </div>
          <p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>Applies to every location. Administrators are told once when it is reached, and again only after it has been restocked. You can set a different level per location on the item page.</ng-container></p>
        }
      </div>
      @if (error()) { <p class="mt-3 text-sm text-red-700" role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="!valid() || saving()" (click)="save()" data-testid="item-save"><ng-container i18n>Save</ng-container></button>
    </mat-dialog-actions>`,
})
export class ItemDialogComponent implements OnInit {
  data = inject<ItemDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ItemDialogComponent>);
  private api = inject(InventoryService);
  private snack = inject(MatSnackBar);

  newTitle = $localize`New inventory item`;
  editTitle = $localize`Edit inventory item`;
  name = signal(''); sku = signal(''); category = signal(''); baseUnit = signal('g'); cost = signal<number | null>(0);
  purchaseUnit = signal(''); customName = signal(''); factor = signal<number | null>(null);
  alertOn = signal(false); threshold = signal<number | null>(null); thresholdUnit = signal('g');
  saving = signal(false); error = signal('');

  groups = computed(() => (['weight', 'volume', 'count', 'length'] as Dimension[]).map((d) => ({ dimension: d, label: DIMENSION_LABELS[d], units: this.data.units.filter((u) => u.dimension === d) })).filter((g) => g.units.length));
  sameDimension = computed(() => { const d = this.data.units.find((u) => u.code === this.baseUnit())?.dimension; return this.data.units.filter((u) => u.dimension === d); });
  valid = computed(() => this.name().trim().length > 0 && !!this.baseUnit() && (!this.alertOn() || (this.threshold() ?? -1) >= 0) && (this.purchaseUnit() !== '__custom' || (!!this.customName().trim() && (this.factor() ?? 0) > 0)));

  ngOnInit() {
    const i = this.data.item;
    if (!i) return;
    this.name.set(i.name); this.sku.set(i.sku ?? ''); this.category.set(i.category ?? ''); this.baseUnit.set(i.baseUnit); this.cost.set(i.defaultCost ?? 0);
    this.thresholdUnit.set(i.baseUnit);
    const knownUnit = this.data.units.some((u) => u.code === i.purchaseUnit);
    if (i.purchaseUnit && knownUnit) this.purchaseUnit.set(i.purchaseUnit);
    else if (i.purchaseUnit) { this.purchaseUnit.set('__custom'); this.customName.set(i.purchaseUnit); this.factor.set(i.purchaseToBaseFactor ?? null); }
    if (i.alertDefault?.enabled) { this.alertOn.set(true); this.threshold.set(i.alertDefault.thresholdScaled / 1000); }
  }

  onBase(code: string) { this.baseUnit.set(code); this.thresholdUnit.set(code); if (this.purchaseUnit() && this.purchaseUnit() !== '__custom') this.purchaseUnit.set(''); }

  async save() {
    this.saving.set(true); this.error.set('');
    const pu = this.purchaseUnit();
    const body: any = {
      name: this.name().trim(), sku: this.sku().trim() || undefined, category: this.category().trim() || undefined, baseUnit: this.baseUnit(), defaultCost: Number(this.cost() ?? 0),
      alertDefault: { enabled: this.alertOn(), threshold: this.alertOn() ? Number(this.threshold() ?? 0) : 0, unit: this.thresholdUnit() },
    };
    if (pu === '__custom') { body.purchaseUnit = this.customName().trim(); body.purchaseToBaseFactor = Number(this.factor()); }
    else if (pu) body.purchaseUnit = pu;
    try {
      const saved = this.data.item ? await this.api.updateItem(this.data.storeId, this.data.item._id, body) : await this.api.createItem(this.data.storeId, body);
      this.snack.open($localize`Saved.`, undefined, { duration: 2500 });
      this.ref.close(saved);
    } catch (e) { this.error.set(apiMessage(e)); this.saving.set(false); }
  }
}
