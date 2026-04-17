import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MaintenanceVendorCreateDialogComponent } from '../../../../../shared/components/maintenance-vendor-create-dialog/maintenance-vendor-create-dialog.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceVendorService } from '../../../../../shared/services/maintenance-vendor.service';
import { MaintenanceCategoryService } from '../../../../../shared/services/maintenance-category.service';
import { MaintenanceVendor } from '../../../../../shared/models/maintenance-vendor.model';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    NoRecordComponent,
  ],
  templateUrl: './vendor-list.component.html',
})
export class VendorListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private vendorService = inject(MaintenanceVendorService);
  private categoryService = inject(MaintenanceCategoryService);
  private storeStore = inject(StoreStore);

  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  searchFilter = signal<string>('');
  activeFilter = signal<string>('');
  categoryFilter = signal<string>('');

  filterForm = this.fb.group({
    search: [''],
    isActive: [''],
    category: [''],
  });

  displayedColumns = ['profileImage', 'name', 'contact', 'category', 'status', 'actions'];

  activeOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  readonly categoriesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) =>
      params.storeId ? this.categoryService.getAllActive(params.storeId) : of(undefined),
  });

  readonly categoryOptions = computed(() => {
    const data = this.categoriesResource.value()?.data;
    return [
      { value: '', label: 'All Categories' },
      ...(data?.map((c: { name: string }) => ({ value: c.name, label: c.name })) ?? []),
    ];
  });

  private filterParams = computed(() => ({
    storeId: this.storeStore.selectedStore()?._id || '',
    search: this.searchFilter(),
    isActive: this.activeFilter(),
    category: this.categoryFilter(),
    page: this.currentPage(),
    limit: this.pageSize(),
  }));

  vendorsResource = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) => {
      if (!params.storeId) return of(undefined);
      return this.vendorService.getAll(params.storeId, {
        search: params.search,
        isActive: params.isActive,
        category: params.category,
        page: params.page,
        limit: params.limit,
      });
    },
  });

  vendors = computed<MaintenanceVendor[]>(
    () => this.vendorsResource?.value()?.data?.items ?? [],
  );

  totalVendors = computed(() => this.vendorsResource.value()?.data?.meta?.totalItems ?? 0);

  pagination = computed(
    () =>
      this.vendorsResource?.value()?.data?.meta ?? {
        totalItems: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
  );

  constructor() {
    this.filterForm.valueChanges
    .pipe(
        debounceTime(300),
        distinctUntilChanged()
    ).subscribe((values) => {
        this.currentPage.set(1);
        this.searchFilter.set(values.search || '');
        this.activeFilter.set(values.isActive || '');
        this.categoryFilter.set(values.category || '');
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', isActive: '', category: '' });
  }

  goToCreate(): void {
    const ref = this.dialog.open(MaintenanceVendorCreateDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.vendorsResource.reload();
    });
  }

  goToDetail(vendor: MaintenanceVendor): void {
    this.router.navigate([vendor._id], { relativeTo: this.route });
  }

  goToEdit(vendor: MaintenanceVendor): void {
    this.router.navigate([vendor._id, 'edit'], { relativeTo: this.route });
  }

  onDelete(vendor: MaintenanceVendor): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Vendor',
        message: `Are you sure you want to delete vendor "${vendor.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.vendorService.delete(storeId, vendor._id).subscribe({
        next: () => {
          this.snackBar.open('Vendor deleted', 'Close', { duration: 3000 });
          this.vendorsResource.reload();
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to delete vendor';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
    });
  }
}
