import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AssignVendorDialogComponent } from '../../../../../shared/components/assign-vendor-dialog/assign-vendor-dialog.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceService } from '../../../../../shared/services/maintenance.service';
import { MaintenanceCategoryService } from '../../../../../shared/services/maintenance-category.service';
import {
  CATEGORY_LABEL,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceVendorRef,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '../../../../../shared/models/maintenance.model';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
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
    NoRecordComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-list.component.html',
})
export class MaintenanceListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly categoryService = inject(MaintenanceCategoryService);
  private readonly storeStore = inject(StoreStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly page = signal<number>(1);
  readonly limit = signal<number>(20);
  readonly search = signal<string>('');
  readonly status = signal<MaintenanceStatus | ''>('');
  readonly priority = signal<MaintenancePriority | ''>('');
  readonly category = signal<string>('');;

  readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');

  readonly displayedColumns: string[] = [
    'requestNumber',
    'title',
    'property',
    'vendor',
    'status',
    'priority',
    'category',
    'cost',
    'createdAt',
    'actions',
  ];

  readonly statusOptions = [
    { value: '', label: 'All statuses' },
    ...Object.values(MaintenanceStatus).map((value) => ({
      value,
      label: STATUS_LABEL[value],
    })),
  ];

  readonly priorityOptions = [
    { value: '', label: 'All priorities' },
    ...Object.values(MaintenancePriority).map((value) => ({
      value,
      label: PRIORITY_LABEL[value],
    })),
  ];

  readonly categoriesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) =>
      params.storeId ? this.categoryService.getAllActive(params.storeId) : of(undefined),
  });

  readonly categoryOptions = computed(() => {
    const categories = this.categoriesResource.value();
    const data = categories?.data;
    if (data && data.length > 0) {
      return [
        { value: '', label: 'All categories' },
        ...data.map((c: { name: string }) => ({ value: c.name, label: c.name })),
      ];
    }
    return [
      { value: '', label: 'All categories' },
      ...Object.values(MaintenanceCategory).map((value) => ({
        value,
        label: CATEGORY_LABEL[value],
      })),
    ];
  });

  readonly summaryResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) => this.maintenanceService.getSummary(params.storeId),
  });

  readonly requestsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      page: this.page(),
      limit: this.limit(),
      search: this.search(),
      status: this.status(),
      priority: this.priority(),
      category: this.category(),
    }),
    stream: ({ params }) =>
      this.maintenanceService.getAll(params.storeId, {
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        priority: params.priority,
        category: params.category,
      }),
  });

  readonly requests = computed<MaintenanceRequest[]>(
    () => this.requestsResource.value()?.data.items ?? [],
  );

  readonly summary = computed(() => this.summaryResource.value()?.data);

  readonly pagination = computed(
    () =>
      this.requestsResource.value()?.data.meta ?? {
        totalItems: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
  );

  getStatusLabel(status: MaintenanceStatus): string {
    return STATUS_LABEL[status];
  }

  getPriorityLabel(priority: MaintenancePriority): string {
    return PRIORITY_LABEL[priority];
  }

  getCategoryLabel(category: string): string {
    return CATEGORY_LABEL[category as MaintenanceCategory] ?? category;
  }

  getPropertyName(request: MaintenanceRequest): string {
    const property = request.propertyId;
    if (typeof property === 'string') return property;
    return property?.name ?? '-';
  }

  getVendorName(ref: MaintenanceVendorRef | string | null | undefined): string {
    if (!ref) return '-';
    if (typeof ref === 'string') return ref;
    return ref.name ?? ref.email ?? ref._id;
  }

  getPartsLaborTotal(request: MaintenanceRequest): number {
    if (!request.partsAndLabor || request.partsAndLabor.length === 0) return 0;
    return request.partsAndLabor.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  viewInvoice(invoiceId: string): void {
    this.router.navigate(['/menu/ems/accounting/invoices', invoiceId]);
  }

  onSearch(value: string): void {
    this.search.set(value.trim());
    this.page.set(1);
  }

  onStatusChange(value: MaintenanceStatus | ''): void {
    this.status.set(value);
    this.page.set(1);
  }

  onPriorityChange(value: MaintenancePriority | ''): void {
    this.priority.set(value);
    this.page.set(1);
  }

  onCategoryChange(value: string): void {
    this.category.set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.priority.set('');
    this.category.set('');
    this.page.set(1);
  }

  goToCreate(): void {
    this.router.navigate(['/menu/ems/maintenance/maintenances/create']);
  }

  goToDetails(id: string): void {
    this.router.navigate(['/menu/ems/maintenance/maintenances', id]);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/menu/ems/maintenance/maintenances', id, 'edit']);
  }

  onDelete(id: string): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Maintenance Request',
        message: 'Are you sure you want to delete this maintenance request? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.maintenanceService.delete(storeId, id).subscribe({
        next: () => {
          this.snackBar.open('Maintenance request deleted', 'Close', { duration: 3000 });
          this.requestsResource.reload();
          this.summaryResource.reload();
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to delete maintenance request';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
  }

  assignVendor(request: MaintenanceRequest): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(AssignVendorDialogComponent, {
      width: '520px',
      data: {
        storeId,
        requestId: request._id,
        currentVendorId: request.vendorId ?? undefined,
        requestTitle: request.title,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.requestsResource.reload();
      }
    });
  }
}
