import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryLocation, InventorySettings, apiMessage } from '../../../../shared/inventory/inventory.models';
import { StoreStore } from '../../../../shared/stores/store.store';

/** Where stock is kept, and how sales use it. */
@Component({
  selector: 'app-inventory-locations',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatTableModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Inventory locations" i18n-title subtitle="The places that hold stock, such as the main store, the kitchen or a warehouse. Move stock between them with a transfer." i18n-subtitle></app-page-header>
    <div class="flex flex-col gap-5 p-4 pb-16 md:p-6">
      <mat-card appearance="outlined" class="overflow-x-auto">
        <table mat-table [dataSource]="locations()" class="w-full min-w-[560px]" data-testid="locations-list">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef><ng-container i18n>Location</ng-container></th>
            <td mat-cell *matCellDef="let l">
              @if (editing() === l._id) {
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-64"><input matInput [ngModel]="draft()" (ngModelChange)="draft.set($event)" [attr.aria-label]="nameLabel" /></mat-form-field>
              } @else { <span class="font-medium" [class.opacity-50]="l.active === false">{{ l.name }}</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef><ng-container i18n>Status</ng-container></th>
            <td mat-cell *matCellDef="let l">@if (l.isDefault) { <mat-chip i18n>Default</mat-chip> } @else if (l.active === false) { <mat-chip i18n>Off</mat-chip> }</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let l" class="!text-right whitespace-nowrap">
              @if (editing() === l._id) {
                <button matButton="filled" (click)="rename(l)"><ng-container i18n>Save</ng-container></button>
                <button matButton (click)="editing.set('')"><ng-container i18n>Cancel</ng-container></button>
              } @else {
                <button matButton (click)="editing.set(l._id); draft.set(l.name)"><ng-container i18n>Rename</ng-container></button>
                @if (!l.isDefault) { <button matButton (click)="toggle(l)">{{ l.active === false ? turnOn : turnOff }}</button> }
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-card-content class="flex items-center gap-2 !pt-4">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
            <mat-label><ng-container i18n>New location name</ng-container></mat-label>
            <input matInput [ngModel]="newName()" (ngModelChange)="newName.set($event)" (keydown.enter)="add()" placeholder="Kitchen" data-testid="new-location" autocomplete="off" />
          </mat-form-field>
          <button matButton="filled" [disabled]="!newName().trim()" (click)="add()" data-testid="add-location"><ng-container i18n>Add location</ng-container></button>
        </mat-card-content>
        @if (error()) { <p class="m-0 px-4 pb-4 text-sm text-red-700" role="alert">{{ error() }}</p> }
      </mat-card>

      @if (settings(); as s) {
        <mat-card appearance="outlined"><mat-card-header class="!pb-2"><mat-card-title class="!text-base !font-medium"><ng-container i18n>How sales use stock</ng-container></mat-card-title></mat-card-header><mat-card-content>
          <p class="mt-0 mb-4 text-sm text-on-surface-variant"><ng-container i18n>Products set to use a bill of materials take their ingredients or components from one location each time they are sold.</ng-container></p>
          <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>Take stock from</ng-container></mat-label>
              <mat-select [ngModel]="s.consumptionLocation" (ngModelChange)="save({ consumptionLocation: $event })" data-testid="consumption-location">
                @for (l of activeLocations(); track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label><ng-container i18n>If there is not enough stock</ng-container></mat-label>
              <mat-select [ngModel]="s.insufficientStockPolicy" (ngModelChange)="save({ insufficientStockPolicy: $event })" data-testid="stock-policy">
                <mat-option value="allow"><ng-container i18n>Let the sale go through and warn me</ng-container></mat-option>
                <mat-option value="block"><ng-container i18n>Stop the sale unless a manager overrides</ng-container></mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content></mat-card>
      }
    </div>`,
})
export class InventoryLocationsComponent {
  private api = inject(InventoryService);
  private snack = inject(MatSnackBar);
  private stores = inject(StoreStore);
  nameLabel = $localize`Location name`;
  turnOn = $localize`Turn on`;
  turnOff = $localize`Turn off`;
  columns = ['name', 'status', 'actions'];
  locations = signal<InventoryLocation[]>([]);
  settings = signal<InventorySettings | null>(null);
  editing = signal(''); draft = signal(''); newName = signal(''); error = signal('');
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  activeLocations = computed(() => this.locations().filter((l) => l.active !== false));

  constructor() { effect(() => { if (this.storeId()) void this.load(); }); }

  async load() {
    const s = this.storeId();
    try { const [l, st] = await Promise.all([this.api.locations(s), this.api.settings(s)]); this.locations.set(l); this.settings.set(st); } catch (e) { this.error.set(apiMessage(e)); }
  }
  async add() { try { await this.api.addLocation(this.storeId(), { name: this.newName().trim() }); this.newName.set(''); this.error.set(''); await this.load(); } catch (e) { this.error.set(apiMessage(e)); } }
  async rename(l: InventoryLocation) { try { await this.api.editLocation(this.storeId(), l._id, { name: this.draft() }); this.editing.set(''); this.error.set(''); await this.load(); } catch (e) { this.error.set(apiMessage(e)); } }
  async toggle(l: InventoryLocation) { try { await this.api.editLocation(this.storeId(), l._id, { active: l.active === false }); this.error.set(''); await this.load(); } catch (e) { this.error.set(apiMessage(e)); } }
  async save(patch: Partial<InventorySettings>) {
    try { this.settings.set(await this.api.saveSettings(this.storeId(), patch)); this.snack.open($localize`Saved.`, undefined, { duration: 2500 }); }
    catch (e) { this.snack.open(apiMessage(e), undefined, { duration: 4000 }); }
  }
}
