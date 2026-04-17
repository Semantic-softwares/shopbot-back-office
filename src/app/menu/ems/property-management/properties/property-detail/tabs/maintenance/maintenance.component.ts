import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NoRecordComponent } from '../../../../../../../shared/components/no-record/no-record.component';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { MaintenanceService } from '../../../../../../../shared/services/maintenance.service';
import {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceVendorRef,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '../../../../../../../shared/models/maintenance.model';
import { PropertyDetailComponent } from '../../property-detail.component';

@Component({
  selector: 'app-property-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
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
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
})
export class PropertyMaintenanceComponent {
  private readonly router = inject(Router);
  private readonly parent = inject(PropertyDetailComponent);
  private readonly storeStore = inject(StoreStore);
  private readonly maintenanceService = inject(MaintenanceService);

  readonly propertyId = this.parent.propertyId;
  readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');

  readonly page = signal<number>(1);
  readonly limit = signal<number>(20);
  readonly search = signal<string>('');
  readonly status = signal<MaintenanceStatus | ''>('');
  readonly priority = signal<MaintenancePriority | ''>('');

  readonly displayedColumns: string[] = [
    'requestNumber',
    'title',
    'vendor',
    'status',
    'priority',
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

  readonly requestsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      propertyId: this.propertyId(),
      page: this.page(),
      limit: this.limit(),
      search: this.search(),
      status: this.status(),
      priority: this.priority(),
    }),
    stream: ({ params }) =>
      this.maintenanceService.getAll(params.storeId, {
        propertyId: params.propertyId,
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        priority: params.priority,
      }),
  });

  readonly requests = computed<MaintenanceRequest[]>(
    () => this.requestsResource.value()?.data.items ?? [],
  );

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

  clearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.priority.set('');
    this.page.set(1);
  }

  goToDetails(id: string): void {
    this.router.navigate(['/menu/ems/maintenance/maintenances', id]);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/menu/ems/maintenance/maintenances', id, 'edit']);
  }

  goToCreate(): void {
    this.router.navigate(['/menu/ems/maintenance/maintenances/create'], {
      queryParams: { propertyId: this.propertyId() },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
  }
}
