import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { StoreStore } from '../../../../shared/stores/store.store';
import { LeaseService } from '../../../../shared/services/lease.service';
import { EstatePropertyService } from '../../../../shared/services/estate-property.service';
import { TenantService } from '../../../../shared/services/tenant.service';
import { LeaseActionsMenuComponent } from '../../../../shared/components/lease-actions-menu/lease-actions-menu.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Lease, LeaseStatus, LeaseType, Property, Tenant, Unit } from '../../../../shared/models/estate.model';

@Component({
  selector: 'app-lease-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    LeaseActionsMenuComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-list.component.html',
})
export class LeaseListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private leaseService = inject(LeaseService);
  private propertyService = inject(EstatePropertyService);
  private tenantService = inject(TenantService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  private page = signal(1);
  private limit = signal(20);
  private sortField = signal<'property' | 'createdAt'>('createdAt');
  private sortDirection = signal<SortDirection>('desc');
  private propertyFilter = signal('');
  private statusFilter = signal('');
  private tenantFilter = signal('');
  private expiryFilter = signal('');

  readonly displayedColumns: string[] = [
    'status',
    'lease',
    'createdAt',
    'property',
    'tenant',
    'duration',
    'rent',
    'currency',
    'actions',
  ];

  readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: LeaseStatus.DRAFT, label: 'Draft' },
    { value: LeaseStatus.ACTIVE, label: 'Active' },
    { value: LeaseStatus.ENDED, label: 'Ended' },
    { value: LeaseStatus.TERMINATED, label: 'Terminated' },
    { value: LeaseStatus.CANCELLED, label: 'Cancelled' },
  ];

  readonly expiryOptions = [
    { value: '', label: 'All leases' },
    { value: 'expiringSoon', label: 'Expiring soon (30 days)' },
  ];

  leasesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      page: this.page(),
      limit: this.limit(),
    }),
    stream: ({ params }) =>
      this.leaseService.getLeases(params.storeId, {
        page: params.page,
        limit: params.limit,
      }),
  });

  propertiesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) =>
      this.propertyService.getProperties(params.storeId, {
        limit: 500,
      }),
  });

  tenantsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) =>
      this.tenantService.getTenants(params.storeId, { limit: 500 }),
  });

  leases = computed(() => this.leasesResource.value()?.data.items || []);
  properties = computed(() => this.propertiesResource.value()?.data.items || []);
  allTenants = computed(() => this.tenantsResource.value()?.data.items || []);

  private propertyMap = computed(() => {
    return new Map(this.properties().map((property) => [property._id, property]));
  });

  // Summary card computeds
  activeLeaseCount = computed(() => this.leases().filter((l) => l.status === LeaseStatus.ACTIVE).length);

  expiringLeaseCount = computed(() => {
    return this.leases().filter((lease) => this.isLeaseExpiringSoon(lease)).length;
  });

  scheduledLeaseCount = computed(() => {
    const now = new Date();
    return this.leases().filter((l) => {
      const start = new Date(l.startDate);
      return start > now && l.status === LeaseStatus.ACTIVE;
    }).length;
  });

  sortedLeases = computed(() => {
    const leases = [...this.leases()];
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return leases.sort((a, b) => {
      if (this.sortField() === 'createdAt') {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return (aTime - bTime) * direction;
      }

      const aValue = this.getSortValue(a, 'property');
      const bValue = this.getSortValue(b, 'property');
      return aValue.localeCompare(bValue) * direction;
    });
  });

  filteredLeases = computed(() => {
    const property = this.propertyFilter().toLowerCase();
    const status = this.statusFilter();
    const tenantId = this.tenantFilter();
    const expiry = this.expiryFilter();

    return this.sortedLeases().filter((lease) => {
      const propertyName = this.propertyName(lease).toLowerCase();
      const propertyMatch = !property || propertyName === property;
      const statusMatch = !status || lease.status === status;
      const tenantMatch = !tenantId || (lease.tenantIds || []).some((t) => {
        const id = typeof t === 'string' ? t : (t as Tenant)._id;
        return id === tenantId;
      });
      const expiryMatch = !expiry || (expiry === 'expiringSoon' && this.isLeaseExpiringSoon(lease));
      return propertyMatch && statusMatch && tenantMatch && expiryMatch;
    });
  });

  propertyFilterOptions = computed(() => {
    const names = this.properties().map((property) => property.name).filter((name) => !!name?.trim());
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  });

  tenantFilterOptions = computed(() => {
    return this.allTenants().map((t) => ({
      value: t._id,
      label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || t._id,
    }));
  });

  selectedPropertyFilter = computed(() => this.propertyFilter());
  selectedStatusFilter = computed(() => this.statusFilter());
  selectedTenantFilter = computed(() => this.tenantFilter());
  selectedExpiryFilter = computed(() => this.expiryFilter());

  createLease(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  viewLease(leaseId: string): void {
    this.router.navigate([leaseId], { relativeTo: this.route });
  }

  completeDraft(leaseId: string): void {
    this.router.navigate([leaseId, 'edit'], { relativeTo: this.route });
  }

  endLease(leaseId: string): void {
    this.router.navigate([leaseId, 'end'], { relativeTo: this.route });
  }

  deleteLease(leaseId: string): void {
    const confirmed = window.confirm('Delete this lease? This action cannot be undone.');
    if (!confirmed) return;

    this.leaseService.deleteLease(leaseId).subscribe({
      next: () => {
        this.snackBar.open('Lease deleted successfully', 'Close', { duration: 3000 });
        this.leasesResource.reload();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to delete lease', 'Close', {
          duration: 5000,
        });
      },
    });
  }

  onSortChange(sort: Sort): void {
    if (sort.active !== 'property' && sort.active !== 'createdAt') return;

    if (sort.active === 'createdAt') {
      this.sortField.set('createdAt');
      this.sortDirection.set(sort.direction || 'desc');
      return;
    }

    this.sortField.set('property');
    this.sortDirection.set(sort.direction || 'asc');
  }

  updatePropertyFilter(value: string): void {
    this.propertyFilter.set(value || '');
  }

  updateStatusFilter(value: string): void {
    this.statusFilter.set(value || '');
  }

  updateTenantFilter(value: string): void {
    this.tenantFilter.set(value || '');
  }

  updateExpiryFilter(value: string): void {
    this.expiryFilter.set(value || '');
  }

  clearFilters(): void {
    this.propertyFilter.set('');
    this.statusFilter.set('');
    this.tenantFilter.set('');
    this.expiryFilter.set('');
  }

  private isLeaseExpiringSoon(lease: Lease): boolean {
    if (lease.status !== LeaseStatus.ACTIVE || !lease.endDate) {
      return false;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysFromToday = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(lease.endDate);

    return endDate >= today && endDate <= thirtyDaysFromToday;
  }

  onLeaseChanged(): void {
    this.leasesResource.reload();
  }

  propertyName(lease: Lease): string {
    const property = this.resolveProperty(lease);
    return property?.name || '--';
  }

  propertyAndUnitName(lease: Lease): string {
    const property = this.resolveProperty(lease);
    const propName = property?.name || '--';
    const unit = lease.unitId;
    if (!unit) return propName;
    const unitName = typeof unit === 'string' ? null : (unit as Unit).name;
    return unitName ? `${propName}, ${unitName}` : propName;
  }

  tenantDisplay(lease: Lease): { primary: string; extra: number } {
    const tenants = lease.tenantIds || [];
    if (!tenants.length) return { primary: '--', extra: 0 };
    const first = tenants[0];
    const name = typeof first === 'string' ? first : `${(first as Tenant).firstName || ''} ${(first as Tenant).lastName || ''}`.trim() || '--';
    return { primary: name, extra: Math.max(0, tenants.length - 1) };
  }

  leaseDuration(lease: Lease): string {
    const start = lease.startDate ? new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--';
    if (lease.leaseType === LeaseType.MONTH_TO_MONTH) {
      return `${start} – Month-to-month`;
    }
    const end = lease.endDate ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--';
    return `${start} – ${end}`;
  }

  rentDisplay(lease: Lease): string {
    const rent = lease.leaseTransactions?.recurringRent;
    if (!rent?.enabled || !rent.totalAmount) return '—';
    const freq = this.frequencyAbbrev(rent.frequency);
    const currency = lease.currency || this.storeStore.selectedStore()?.currencyCode || 'USD';
    try {
      const formatted = new Intl.NumberFormat('en', { style: 'currency', currency }).format(rent.totalAmount);
      return `${formatted}/${freq}`;
    } catch {
      return `${currency} ${rent.totalAmount.toFixed(2)}/${freq}`;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case LeaseStatus.ACTIVE: return 'check_circle';
      case LeaseStatus.DRAFT: return 'edit_note';
      case LeaseStatus.ENDED: return 'event_available';
      case LeaseStatus.TERMINATED: return 'cancel';
      case LeaseStatus.CANCELLED: return 'block';
      default: return 'circle';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case LeaseStatus.ACTIVE: return 'text-green-600';
      case LeaseStatus.DRAFT: return 'text-gray-500';
      case LeaseStatus.ENDED: return 'text-blue-600';
      case LeaseStatus.TERMINATED: return 'text-red-600';
      case LeaseStatus.CANCELLED: return 'text-orange-500';
      default: return 'text-gray-400';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case LeaseStatus.ACTIVE: return 'bg-green-600! text-white!';
      case LeaseStatus.DRAFT: return 'bg-gray-500! text-white!';
      case LeaseStatus.ENDED: return 'bg-blue-600! text-white!';
      case LeaseStatus.TERMINATED: return 'bg-red-600! text-white!';
      case LeaseStatus.CANCELLED: return 'bg-orange-500! text-white!';
      default: return 'bg-gray-400! text-white!';
    }
  }

  private frequencyAbbrev(freq?: string): string {
    const map: Record<string, string> = {
      DAILY: 'd', WEEKLY: 'w', BI_WEEKLY: '2w', MONTHLY: 'm',
      BI_MONTHLY: '2m', QUARTERLY: 'q', SEMI_ANNUAL: '6m', ANNUAL: 'y',
    };
    return map[freq || ''] || 'm';
  }

  private getSortValue(lease: Lease, _field: 'property'): string {
    return this.propertyName(lease).toLowerCase();
  }

  private resolveProperty(lease: Lease): Property | null {
    if (typeof lease.propertyId !== 'string') {
      return lease.propertyId;
    }

    return this.propertyMap().get(lease.propertyId) || null;
  }
}
