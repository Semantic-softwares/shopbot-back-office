import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import {
  LedgerEntryType,
  Lease,
  Property,
  Tenant,
} from '../../../../../shared/models/estate.model';
import { LeaseService } from '../../../../../shared/services/lease.service';
import { LedgerApiService } from '../../../../../shared/services/ledger-api.service';
import { EstatePropertyService } from '../../../../../shared/services/estate-property.service';
import { TenantService } from '../../../../../shared/services/tenant.service';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-ledger-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    NoRecordComponent,
    PageHeaderComponent,
  ],
  templateUrl: './ledger-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerListComponent {
  private readonly ledgerApiService = inject(LedgerApiService);
  private readonly tenantService = inject(TenantService);
  private readonly propertyService = inject(EstatePropertyService);
  private readonly leaseService = inject(LeaseService);
  private readonly storeStore = inject(StoreStore);

  readonly searchQuery = signal('');
  readonly tenantFilter = signal('');
  readonly propertyFilter = signal('');
  readonly leaseFilter = signal('');
  readonly typeFilter = signal('');
  readonly dateFrom = signal<Date | null>(null);
  readonly dateTo = signal<Date | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly displayedColumns: string[] = [
    'date',
    'type',
    'reference',
    'description',
    'debit',
    'credit',
    'balance',
  ];

  readonly typeOptions = [
    { value: '', label: 'All Types' },
    { value: LedgerEntryType.INVOICE, label: 'Invoice' },
    { value: LedgerEntryType.PAYMENT, label: 'Payment' },
    { value: LedgerEntryType.LATE_FEE, label: 'Late Fee' },
    { value: LedgerEntryType.VOID, label: 'Void' },
    { value: LedgerEntryType.REVERSAL, label: 'Reversal' },
  ];

  readonly tenantsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => {
      if (!params.storeId) return EMPTY;
      return this.tenantService.getTenants(params.storeId, { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' });
    },
  });

  readonly propertiesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => {
      if (!params.storeId) return EMPTY;
      return this.propertyService.getProperties(params.storeId, { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' });
    },
  });

  readonly leasesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      propertyId: this.propertyFilter(),
      tenantId: this.tenantFilter(),
    }),
    stream: ({ params }) => {
      if (!params.storeId) return EMPTY;
      return this.leaseService.getLeases(params.storeId, {
        limit: 200,
        propertyId: params.propertyId || undefined,
        tenantId: params.tenantId || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    },
  });

  readonly ledgerResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      tenantId: this.tenantFilter(),
      propertyId: this.propertyFilter(),
      leaseId: this.leaseFilter(),
      type: this.typeFilter(),
      search: this.searchQuery().trim(),
      dateFrom: this.serializeDateStart(this.dateFrom()),
      dateTo: this.serializeDateEnd(this.dateTo()),
    }),
    stream: ({ params }) => {
      if (!params.storeId) return EMPTY;
      return this.ledgerApiService.getGlobalLedger(params.storeId, {
        tenantId: params.tenantId || undefined,
        propertyId: params.propertyId || undefined,
        leaseId: params.leaseId || undefined,
        type: params.type || undefined,
        search: params.search || undefined,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
    },
  });

  readonly entries = computed(
    () => this.ledgerResource.value()?.data?.entries || [],
  );

  readonly pagedEntries = computed(() => {
    const all = this.entries();
    const start = this.pageIndex() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  readonly summary = computed(() => this.ledgerResource.value()?.data?.summary || {
    totalDebit: 0,
    totalCredit: 0,
    closingBalance: 0,
    entryCount: 0,
  });

  readonly tenants = computed(() => this.tenantsResource.value()?.data?.items || []);
  readonly properties = computed(() => this.propertiesResource.value()?.data?.items || []);
  readonly leases = computed(() => this.leasesResource.value()?.data?.items || []);

  readonly currency = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  onTenantChange(value: string): void {
    this.tenantFilter.set(value || '');
    this.leaseFilter.set('');
    this.resetPagination();
  }

  onPropertyChange(value: string): void {
    this.propertyFilter.set(value || '');
    this.leaseFilter.set('');
    this.resetPagination();
  }

  onLeaseChange(value: string): void {
    this.leaseFilter.set(value || '');
    this.resetPagination();
  }

  onTypeChange(value: string): void {
    this.typeFilter.set(value || '');
    this.resetPagination();
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value || '');
    this.resetPagination();
  }

  onDateRangeChange(start: Date | null, end: Date | null): void {
    this.dateFrom.set(start);
    this.dateTo.set(end);
    this.resetPagination();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.tenantFilter.set('');
    this.propertyFilter.set('');
    this.leaseFilter.set('');
    this.typeFilter.set('');
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.resetPagination();
  }

  tenantLabel(tenant: Tenant): string {
    if (tenant.isCompany && tenant.companyName) return tenant.companyName;
    return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '--';
  }

  propertyLabel(property: Property): string {
    return property.name || '--';
  }

  leaseLabel(lease: Lease): string {
    return lease.leaseNumber || lease._id || '--';
  }

  typeLabel(type: LedgerEntryType): string {
    switch (type) {
      case LedgerEntryType.INVOICE:
        return 'Invoice';
      case LedgerEntryType.PAYMENT:
        return 'Payment';
      case LedgerEntryType.LATE_FEE:
        return 'Late Fee';
      case LedgerEntryType.VOID:
        return 'Void';
      case LedgerEntryType.REVERSAL:
        return 'Reversal';
      default:
        return type;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  private serializeDateStart(date: Date | null): string | undefined {
    if (!date) return undefined;
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value.toISOString();
  }

  private serializeDateEnd(date: Date | null): string | undefined {
    if (!date) return undefined;
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value.toISOString();
  }

  private resetPagination(): void {
    this.pageIndex.set(0);
  }
}
