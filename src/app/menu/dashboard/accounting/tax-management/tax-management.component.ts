import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { AccountingTaxService } from '../../../../shared/services/accounting-tax.service';
import { RolesService } from '../../../../shared/services/roles.service';
import { Tax, TaxView } from '../../../../shared/models/tax.model';
import { StoreStore } from '../../../../shared/stores/store.store';
import { TaxConfigService } from '../../../../shared/tax/tax-config.service';
import { TaxDialogComponent } from './tax-dialog.component';

@Component({
  selector: 'app-tax-management',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    NoRecordComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Tax Management" i18n-title subtitle="The taxes your products can use" i18n-subtitle>
      @if (canManage()) {
        <button matButton="filled" color="primary" actions (click)="add()" data-testid="add-tax"><ng-container i18n>Add Tax</ng-container></button>
      }
    </app-page-header>

    @if (loading()) {
      <div class="flex justify-center py-16"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (error()) {
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error() }}</div>
    } @else if (view(); as v) {
      @if (!v.settings.taxesEnabled) {
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-4" data-testid="tax-not-set-up">
          <ng-container i18n>Tax management is not set up for this store, so sales are still priced the way they always were.</ng-container>
          <a class="underline font-medium ml-1" routerLink="/menu/admin/tax-settings" i18n>Set it up in Administrative Settings</a>
        </div>
      }

      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <mat-form-field appearance="outline" class="w-full max-w-xs">
          <mat-label i18n>Search</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="search.set($event); page.set(0)" placeholder="Search..." i18n-placeholder data-testid="tax-search" />
        </mat-form-field>

        @if (!filtered().length) {
          <app-no-record icon="percent" title="No taxes" i18n-title message="No taxes match your search." i18n-message></app-no-record>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="pageRows()" class="w-full" data-testid="tax-table">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef i18n>Tax Code</th>
                <td mat-cell *matCellDef="let t">{{ t.mraTaxCode || t.code || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef i18n>Tax Name</th>
                <td mat-cell *matCellDef="let t">
                  {{ t.name }}
                  @if (v.settings.defaultTaxId === t._id) { <span class="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700" i18n>Default</span> }
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef i18n>Description</th>
                <td mat-cell *matCellDef="let t">{{ t.description || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="treatment">
                <th mat-header-cell *matHeaderCellDef i18n>Treatment</th>
                <td mat-cell *matCellDef="let t">
                  @switch (t.kind) {
                    @case ('zero_rated') { <ng-container i18n>Zero-rated</ng-container> }
                    @case ('exempt') { <ng-container i18n>Exempt</ng-container> }
                    @default { <ng-container i18n>Standard</ng-container> }
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="rate">
                <th mat-header-cell *matHeaderCellDef i18n>Tax Percentage</th>
                <td mat-cell *matCellDef="let t" class="tabular-nums">{{ t.rate }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef i18n>Status</th>
                <td mat-cell *matCellDef="let t">
                  <span class="rounded px-2 py-0.5 text-xs" [class]="t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                    @if (t.isActive) { <ng-container i18n>Active</ng-container> } @else { <ng-container i18n>Inactive</ng-container> }
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef i18n>Actions</th>
                <td mat-cell *matCellDef="let t">
                  @if (canManage()) {
                    <button mat-stroked-button class="!min-w-0 !px-2" (click)="edit(t)" aria-label="Edit tax" i18n-aria-label matTooltip="Edit" i18n-matTooltip [attr.data-testid]="'edit-' + t.name"><mat-icon>edit</mat-icon></button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
          <mat-paginator [length]="filtered().length" [pageSize]="pageSize()" [pageIndex]="page()" [pageSizeOptions]="[10, 25, 50]" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        }
      </div>
    }
  `,
})
export class TaxManagementComponent {
  private readonly api = inject(AccountingTaxService);
  private readonly storeStore = inject(StoreStore);
  private readonly roles = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly taxConfig = inject(TaxConfigService);

  protected readonly columns = ['code', 'name', 'description', 'treatment', 'rate', 'status', 'actions'];
  protected readonly view = signal<TaxView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly canManage = computed(() => this.roles.isAdmin() || this.roles.hasAny(['erp.accounting.manage']));
  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const taxes = this.view()?.taxes ?? [];
    return q ? taxes.filter((t) => [t.name, t.code, t.mraTaxCode, t.description].some((x) => String(x ?? '').toLowerCase().includes(q))) : taxes;
  });
  protected readonly pageRows = computed(() => this.filtered().slice(this.page() * this.pageSize(), (this.page() + 1) * this.pageSize()));

  constructor() {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      if (storeId) untracked(() => this.load(storeId));
    });
  }

  private load(storeId: string): void {
    this.loading.set(true);
    this.api.view(storeId).subscribe({
      next: (v) => {
        this.view.set(v);
        this.error.set(null);
        this.loading.set(false);
        this.taxConfig.apply(v);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? $localize`Something went wrong. Please try again.`);
        this.loading.set(false);
      },
    });
  }

  protected onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  protected add(): void {
    this.open();
  }

  protected edit(tax: Tax): void {
    this.open(tax);
  }

  private open(tax?: Tax): void {
    const storeId = this.storeStore.selectedStore()!._id;
    this.dialog
      .open(TaxDialogComponent, { width: '560px', data: { storeId, tax } })
      .afterClosed()
      .subscribe((saved?: Tax) => {
        if (saved) this.load(storeId);
      });
  }
}
