import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryItem, InventoryLocation, InventoryUnit, apiMessage } from '../../../../shared/inventory/inventory.models';

export type StockOp = 'add' | 'remove' | 'wastage' | 'adjust' | 'transfer';
export interface StockOpData { storeId: string; mode: StockOp; item: InventoryItem; locations: InventoryLocation[]; units: InventoryUnit[]; location?: string; balances?: { location: string; quantity: number }[] }

/** One dialog for every manual stock action. Each one records why, and none of them can overwrite a balance without a trace. */
@Component({
  selector: 'app-stock-op-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ title() }}</h2>
    <mat-dialog-content class="!pt-2">
      <p class="mb-3 text-sm text-on-surface-variant">{{ data.item.name }}</p>
      @if (data.mode === 'transfer') {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>From</ng-container></mat-label>
          <mat-select [ngModel]="location()" (ngModelChange)="location.set($event)" data-testid="op-from">
            @for (l of data.locations; track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
          </mat-select>
          @if (current() !== null) { <mat-hint><ng-container i18n>Available: {{ current() }} {{ data.item.baseUnit }}</ng-container></mat-hint> }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>To</ng-container></mat-label>
          <mat-select [ngModel]="to()" (ngModelChange)="to.set($event)" data-testid="op-to">
            @for (l of otherLocations(); track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
      } @else {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Location</ng-container></mat-label>
          <mat-select [ngModel]="location()" (ngModelChange)="location.set($event)" data-testid="op-location">
            @for (l of data.locations; track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
          </mat-select>
          @if (current() !== null) { <mat-hint><ng-container i18n>Now: {{ current() }} {{ data.item.baseUnit }}</ng-container></mat-hint> }
        </mat-form-field>
      }
      <div class="grid grid-cols-[1fr_9rem] gap-x-3">
        <mat-form-field appearance="outline">
          <mat-label>{{ data.mode === 'adjust' ? countedLabel : quantityLabel }}</mat-label>
          <input matInput type="number" min="0" step="any" [ngModel]="quantity()" (ngModelChange)="quantity.set($event)" data-testid="op-quantity" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Unit</ng-container></mat-label>
          <mat-select [ngModel]="unit()" (ngModelChange)="unit.set($event)" data-testid="op-unit">
            @for (u of sameDimension(); track u.code) { <mat-option [value]="u.code">{{ u.code }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>
      @if (data.mode !== 'add') {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Reason</ng-container> @if (data.mode !== 'transfer') { * }</mat-label>
          <mat-select [ngModel]="preset()" (ngModelChange)="preset.set($event)" data-testid="op-reason">
            @for (r of reasons(); track r) { <mat-option [value]="r">{{ r }}</mat-option> }
          </mat-select>
        </mat-form-field>
        @if (preset() === otherReason) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label><ng-container i18n>Describe the reason</ng-container></mat-label>
            <input matInput [ngModel]="custom()" (ngModelChange)="custom.set($event)" data-testid="op-reason-text" autocomplete="off" />
          </mat-form-field>
        }
      } @else {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Why is stock being added? (optional)</ng-container></mat-label>
          <mat-select [ngModel]="preset()" (ngModelChange)="preset.set($event)">
            @for (r of reasons(); track r) { <mat-option [value]="r">{{ r }}</mat-option> }
          </mat-select>
        </mat-form-field>
      }
      @if (error()) { <p class="mt-1 text-sm text-red-700" role="alert" data-testid="op-error">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="!valid() || saving()" (click)="save()" data-testid="op-save">{{ confirmLabel() }}</button>
    </mat-dialog-actions>`,
})
export class StockOpDialogComponent implements OnInit {
  data = inject<StockOpData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<StockOpDialogComponent>);
  private api = inject(InventoryService);
  private snack = inject(MatSnackBar);

  quantityLabel = $localize`Quantity`;
  countedLabel = $localize`Counted quantity`;
  otherReason = $localize`Other`;
  location = signal(''); to = signal(''); quantity = signal<number | null>(null); unit = signal(''); preset = signal(''); custom = signal('');
  saving = signal(false); error = signal('');

  sameDimension = computed(() => { const d = this.data.units.find((u) => u.code === this.data.item.baseUnit)?.dimension; return this.data.units.filter((u) => u.dimension === d); });
  otherLocations = computed(() => this.data.locations.filter((l) => l._id !== this.location()));
  current = computed(() => { const b = this.data.balances?.find((x) => x.location === this.location()); return this.data.balances ? (b?.quantity ?? 0) : null; });
  title = computed(() => ({ add: $localize`Add stock`, remove: $localize`Remove stock`, wastage: $localize`Record wastage`, adjust: $localize`Stock adjustment`, transfer: $localize`Transfer stock` })[this.data.mode]);
  confirmLabel = computed(() => ({ add: $localize`Add`, remove: $localize`Remove`, wastage: $localize`Record`, adjust: $localize`Adjust`, transfer: $localize`Transfer` })[this.data.mode]);
  reasons = computed(() => {
    switch (this.data.mode) {
      case 'add': return [$localize`Opening stock`, $localize`Stock received`, $localize`Manual stock entry`, this.otherReason];
      case 'remove': return [$localize`Manual consumption`, $localize`Preparation`, $localize`Internal use`, $localize`Damaged stock`, this.otherReason];
      case 'wastage': return [$localize`Spoiled`, $localize`Expired`, $localize`Damaged`, $localize`Unusable`, this.otherReason];
      case 'adjust': return [$localize`Physical count differs`, $localize`Correcting a mistake`, $localize`Lost or missing`, this.otherReason];
      default: return [$localize`Needed at the destination`, this.otherReason];
    }
  });
  reasonText = computed(() => (this.preset() === this.otherReason ? this.custom().trim() : this.preset()));
  valid = computed(() => {
    const q = this.quantity();
    if (q === null || q === undefined || Number.isNaN(Number(q)) || (this.data.mode === 'adjust' ? Number(q) < 0 : Number(q) <= 0)) return false;
    if (!this.location() || !this.unit()) return false;
    if (this.data.mode === 'transfer' && (!this.to() || this.to() === this.location())) return false;
    if (['remove', 'wastage', 'adjust'].includes(this.data.mode) && !this.reasonText()) return false;
    return true;
  });

  ngOnInit() {
    this.unit.set(this.data.item.baseUnit);
    this.location.set(this.data.location ?? this.data.locations.find((l) => l.isDefault)?._id ?? this.data.locations[0]?._id ?? '');
  }

  async save() {
    this.saving.set(true); this.error.set('');
    const s = this.data.storeId; const item = this.data.item._id; const q = Number(this.quantity()); const unit = this.unit(); const reason = this.reasonText() || undefined;
    try {
      switch (this.data.mode) {
        case 'add': case 'remove': case 'wastage': await this.api.stock(s, this.data.mode, { item, location: this.location(), quantity: q, unit, reason }); break;
        case 'adjust': await this.api.adjust(s, { item, location: this.location(), counted: q, unit, reason }); break;
        case 'transfer': await this.api.transfer(s, { item, from: this.location(), to: this.to(), quantity: q, unit, reason }); break;
      }
      this.snack.open($localize`Stock updated.`, undefined, { duration: 2500 });
      this.ref.close(true);
    } catch (e: any) {
      this.error.set(e?.error?.code === 'INSUFFICIENT_STOCK' ? $localize`There is not enough stock for that.` : apiMessage(e));
      this.saving.set(false);
    }
  }
}
