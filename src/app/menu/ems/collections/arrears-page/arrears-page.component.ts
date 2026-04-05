import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { ArrearsApiService } from '../../../../shared/services/arrears-api.service';
import {
  ArrearsRow,
  ArrearsSummary,
  ArrearsAgingSummary,
  TopArrearsProperty,
  ArrearsQueryParams,
  SortByField,
  SortOrder,
} from '../../../../shared/models/arrears.model';
import { ArrearsSummaryCardsComponent } from '../../../../shared/components/arrears-summary-cards/arrears-summary-cards.component';
import { ArrearsAgingSummaryComponent } from '../../../../shared/components/arrears-aging-summary/arrears-aging-summary.component';
import { TopArrearsPropertiesComponent } from '../../../../shared/components/top-arrears-properties/top-arrears-properties.component';
import { ArrearsFiltersComponent } from '../../../../shared/components/arrears-filters/arrears-filters.component';
import { ArrearsTableComponent } from '../../../../shared/components/arrears-table/arrears-table.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../../shared/stores/store.store';

@Component({
  selector: 'app-arrears-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    ArrearsSummaryCardsComponent,
    ArrearsAgingSummaryComponent,
    TopArrearsPropertiesComponent,
    ArrearsFiltersComponent,
    ArrearsTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './arrears-page.component.html'
})
export class ArrearsPageComponent {
  private arrearsService = inject(ArrearsApiService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  private readonly reloadOnStoreChange = effect(() => {
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) {
      this.loadInitialData();
    }
  });

  // Signals
  protected summary = signal<ArrearsSummary | null>(null);
  protected agingSummary = signal<ArrearsAgingSummary | null>(null);
  protected topProperties = signal<TopArrearsProperty[]>([]);
  protected rows = signal<ArrearsRow[]>([]);

  protected totalItems = signal<number>(0);
  protected pageSize = signal<number>(20);
  protected currentPage = signal<number>(1);

  protected isPageLoading = signal<boolean>(true);
  protected isTableLoading = signal<boolean>(false);

  protected currentFilters = signal<Partial<ArrearsQueryParams>>({
    page: 1,
    limit: 20,
    sortBy: SortByField.OLDEST_INVOICE_DAYS,
    sortOrder: SortOrder.DESC,
  });

  /**
   * Load all initial data on page load
   */
  private loadInitialData(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.isPageLoading.set(true);

    // Load summary, aging, and top properties in parallel
    Promise.all([
      this.loadSummary(),
      this.loadAgingSummary(),
      this.loadTopProperties(),
      this.loadArrearsRows(),
    ])
      .catch((error) => {
        console.error('Error loading arrears data:', error);
        this.snackBar.open('Failed to load arrears data', 'Close', { duration: 5000 });
      })
      .finally(() => {
        this.isPageLoading.set(false);
      });
  }

  /**
   * Load summary data
   */
  private loadSummary(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.arrearsService.getArrearsSummary().subscribe({
        next: (data) => {
          this.summary.set(data);
          resolve();
        },
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Load aging summary
   */
  private loadAgingSummary(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.arrearsService.getArrearsAging().subscribe({
        next: (data) => {
          this.agingSummary.set(data);
          resolve();
        },
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Load top properties
   */
  private loadTopProperties(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.arrearsService.getTopArrearsProperties(5).subscribe({
        next: (data) => {
          this.topProperties.set(data);
          resolve();
        },
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Load arrears rows based on current filters
   */
  private loadArrearsRows(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isTableLoading.set(true);
      this.arrearsService.getArrearsRows(this.currentFilters()).subscribe({
        next: (data) => {
          this.rows.set(data.items);
          this.totalItems.set(data.meta.totalItems);
          this.currentPage.set(data.meta.page);
          this.pageSize.set(data.meta.limit);
          resolve();
        },
        error: (error) => reject(error),
        complete: () => {
          this.isTableLoading.set(false);
        },
      });
    });
  }

  /**
   * Handle filter changes from the filters component
   */
  onFiltersChange(filters: Partial<ArrearsQueryParams>): void {
    this.currentFilters.set({ ...filters, page: 1 });
    this.loadArrearsRows();
  }

  /**
   * Handle pagination changes
   */
  onPageChange(event: PageEvent): void {
    const newFilters = {
      ...this.currentFilters(),
      page: event.pageIndex + 1,
      limit: event.pageSize,
    };
    this.currentFilters.set(newFilters);
    this.loadArrearsRows();
  }

  /**
   * Handle table action execution
   */
  onActionExecuted(event: { action: string; row: ArrearsRow }): void {
    console.log(`Action executed: ${event.action}`, event.row);
    // Add any post-action logic here (notifications, analytics, etc.)
  }
}
