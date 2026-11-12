import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryService } from '../../../../shared/inventory/inventory.service';
import { InventoryLocation, MOVEMENT_LABELS, STATUS_INFO, apiMessage } from '../../../../shared/inventory/inventory.models';
import { ReportExportService } from '../../../../shared/services/report-export.service';
import { StoreStore } from '../../../../shared/stores/store.store';

interface Col { key: string; label: string; kind?: 'text' | 'number' | 'datetime' | 'status' | 'type' }
const REPORTS: { id: string; name: string; cols: Col[]; dates: boolean }[] = [
  { id: 'summary', name: $localize`Inventory summary`, dates: false, cols: [{ key: 'item', label: $localize`Item` }, { key: 'location', label: $localize`Location` }, { key: 'quantity', label: $localize`Available`, kind: 'number' }, { key: 'unit', label: $localize`Unit` }, { key: 'status', label: $localize`Status`, kind: 'status' }, { key: 'threshold', label: $localize`Alert threshold`, kind: 'number' }] },
  { id: 'movements', name: $localize`Stock movements`, dates: true, cols: [{ key: 'at', label: $localize`When`, kind: 'datetime' }, { key: 'item', label: $localize`Item` }, { key: 'location', label: $localize`Location` }, { key: 'type', label: $localize`Type`, kind: 'type' }, { key: 'change', label: $localize`Change`, kind: 'number' }, { key: 'unit', label: $localize`Unit` }, { key: 'after', label: $localize`Balance`, kind: 'number' }, { key: 'sourceType', label: $localize`Source` }, { key: 'by', label: $localize`By` }] },
  { id: 'consumption', name: $localize`Component consumption`, dates: true, cols: [{ key: 'at', label: $localize`When`, kind: 'datetime' }, { key: 'item', label: $localize`Component` }, { key: 'location', label: $localize`Location` }, { key: 'change', label: $localize`Change`, kind: 'number' }, { key: 'unit', label: $localize`Unit` }, { key: 'sourceId', label: $localize`Order` }, { key: 'bomVersion', label: $localize`BOM version`, kind: 'number' }, { key: 'shortfall', label: $localize`Shortfall`, kind: 'number' }] },
  { id: 'low-stock', name: $localize`Low stock`, dates: false, cols: [{ key: 'item', label: $localize`Item` }, { key: 'location', label: $localize`Location` }, { key: 'quantity', label: $localize`Current`, kind: 'number' }, { key: 'unit', label: $localize`Unit` }, { key: 'threshold', label: $localize`Threshold`, kind: 'number' }, { key: 'status', label: $localize`Status`, kind: 'status' }] },
  { id: 'manual-adjustments', name: $localize`Manual adjustments`, dates: true, cols: [{ key: 'at', label: $localize`When`, kind: 'datetime' }, { key: 'item', label: $localize`Item` }, { key: 'location', label: $localize`Location` }, { key: 'type', label: $localize`Type`, kind: 'type' }, { key: 'change', label: $localize`Change`, kind: 'number' }, { key: 'unit', label: $localize`Unit` }, { key: 'reason', label: $localize`Reason` }, { key: 'by', label: $localize`By` }] },
  { id: 'product-bom', name: $localize`Product bill of materials`, dates: false, cols: [{ key: 'product', label: $localize`Product` }, { key: 'version', label: $localize`Version`, kind: 'number' }, { key: 'outputQuantity', label: $localize`Makes`, kind: 'number' }, { key: 'componentsText', label: $localize`Components` }, { key: 'estimatedCost', label: $localize`Estimated cost`, kind: 'number' }] },
];

/** The six inventory reports. Everything is read from balances and the ledger, so a report can never disagree with the stock. */
@Component({
  selector: 'app-inventory-reports',
  imports: [DatePipe, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatTableModule, NoRecordComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Inventory reports" i18n-title subtitle="What is in stock, what moved, what sales used, and what needs restocking." i18n-subtitle>
      <ng-container actions>
        <button matButton [matMenuTriggerFor]="exp" [disabled]="!rows().length"><mat-icon>download</mat-icon><ng-container i18n>Export</ng-container></button>
        <mat-menu #exp="matMenu"><button mat-menu-item (click)="export('xlsx')">Excel</button><button mat-menu-item (click)="export('csv')">CSV</button><button mat-menu-item (click)="export('pdf')">PDF</button></mat-menu>
      </ng-container>
    </app-page-header>
    <div class="flex flex-col gap-4 p-4 pb-16 md:p-6">
      <div class="flex flex-wrap items-center gap-3">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-64">
          <mat-label><ng-container i18n>Report</ng-container></mat-label>
          <mat-select [ngModel]="reportId()" (ngModelChange)="reportId.set($event); run()" data-testid="report-select">
            @for (r of reports; track r.id) { <mat-option [value]="r.id">{{ r.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-48">
          <mat-label><ng-container i18n>Location</ng-container></mat-label>
          <mat-select [ngModel]="location()" (ngModelChange)="location.set($event); run()">
            <mat-option value=""><ng-container i18n>All locations</ng-container></mat-option>
            @for (l of locations(); track l._id) { <mat-option [value]="l._id">{{ l.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        @if (current().dates) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label><ng-container i18n>From</ng-container></mat-label><input matInput type="date" [ngModel]="from()" (ngModelChange)="from.set($event); run()" /></mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label><ng-container i18n>To</ng-container></mat-label><input matInput type="date" [ngModel]="to()" (ngModelChange)="to.set($event); run()" /></mat-form-field>
        }
      </div>
      @if (error()) { <div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-900" role="alert">{{ error() }}</div> }
      @else {
        @if (!rows().length) {
          <app-no-record icon="query_stats" title="Nothing to show for this report." i18n-title message="Try another report, location or date range." i18n-message></app-no-record>
        } @else {
          <mat-card appearance="outlined" class="overflow-x-auto">
            <table mat-table [dataSource]="rows()" class="w-full min-w-[760px]" data-testid="report-table">
              @for (c of current().cols; track c.key) {
                <ng-container [matColumnDef]="c.key">
                  <th mat-header-cell *matHeaderCellDef [class.!text-right]="c.kind === 'number'">{{ c.label }}</th>
                  <td mat-cell *matCellDef="let r" [class.!text-right]="c.kind === 'number'" [class.tabular-nums]="c.kind === 'number'">
                    @switch (c.kind) {
                      @case ('datetime') { {{ r[c.key] | date: 'MMM d, y HH:mm' }} }
                      @case ('status') { <mat-chip [class]="statusInfo(r[c.key]).cls">{{ statusInfo(r[c.key]).label }}</mat-chip> }
                      @case ('type') { {{ typeLabel(r[c.key]) }} }
                      @default { {{ r[c.key] ?? '' }} }
                    }
                  </td>
                </ng-container>
              }
              <tr mat-header-row *matHeaderRowDef="columnKeys()"></tr>
              <tr mat-row *matRowDef="let row; columns: columnKeys()"></tr>
            </table>
          </mat-card>
        }
      }
    </div>`,
})
export class InventoryReportsComponent {
  private api = inject(InventoryService);
  private stores = inject(StoreStore);
  private exporter = inject(ReportExportService);
  reports = REPORTS;
  reportId = signal('summary'); location = signal(''); from = signal(''); to = signal('');
  rows = signal<any[]>([]); error = signal(''); locations = signal<InventoryLocation[]>([]);
  storeId = computed(() => this.stores.selectedStore()?._id ?? '');
  current = computed(() => REPORTS.find((r) => r.id === this.reportId())!);
  columnKeys = computed(() => this.current().cols.map((c) => c.key));
  statusInfo = (s: string) => STATUS_INFO[s as keyof typeof STATUS_INFO] ?? STATUS_INFO.in_stock;
  typeLabel = (t: string) => MOVEMENT_LABELS[t] ?? t;
  constructor() { effect(() => { const s = this.storeId(); if (s) { void this.api.locations(s).then((l) => this.locations.set(l)); void this.run(); } }); }

  async run() {
    const s = this.storeId(); if (!s) return;
    this.error.set('');
    try {
      const r = await this.api.report(s, this.reportId(), { location: this.location(), from: this.from(), to: this.to() ? `${this.to()}T23:59:59` : '', limit: 200 });
      this.rows.set((r.rows ?? []).map((x: any) => (this.reportId() === 'product-bom' ? { ...x, componentsText: x.components.map((c: any) => `${c.item} ${c.quantity} ${c.unit}`).join(', ') } : x)));
    } catch (e) { this.error.set(apiMessage(e)); this.rows.set([]); }
  }

  export(format: 'xlsx' | 'csv' | 'pdf') {
    const cols = this.current().cols;
    this.exporter.export(format, {
      title: this.current().name, storeName: this.stores.selectedStore()?.name ?? '', filename: `inventory-${this.reportId()}`, landscape: true,
      columns: cols.map((c) => ({ key: c.key, label: c.label, type: c.kind === 'number' ? 'number' as const : c.kind === 'datetime' ? 'datetime' as const : 'text' as const })),
      rows: this.rows().map((r) => Object.fromEntries(cols.map((c) => [c.key, c.kind === 'type' ? this.typeLabel(r[c.key]) : c.kind === 'status' ? this.statusInfo(r[c.key]).label : r[c.key]]))),
    });
  }
}
