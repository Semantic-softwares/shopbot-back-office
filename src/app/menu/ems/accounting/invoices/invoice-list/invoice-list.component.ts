import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { EstateInvoiceService } from '../../../../../shared/services/estate-invoice.service';
import { EstatePropertyService } from '../../../../../shared/services/estate-property.service';
import { TenantService } from '../../../../../shared/services/tenant.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { InvoiceActionsMenuComponent } from '../../../../../shared/components/invoice-actions-menu/invoice-actions-menu.component';
import {
  EstateInvoice,
  InvoiceStatus,
  InvoiceType,
  Property,
  Tenant,
  Unit,
} from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    InvoiceActionsMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invoiceService = inject(EstateInvoiceService);
  private propertyService = inject(EstatePropertyService);
  private tenantService = inject(TenantService);
  private storeStore = inject(StoreStore);

  private page = signal<number>(1);
  private limit = signal<number>(50);
  private sortField = signal<string>('createdAt');
  private sortDirection = signal<SortDirection>('desc');

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('');
  readonly typeFilter = signal<string>('');
  readonly flowFilter = signal<string>('');
  readonly propertyFilter = signal<string>('');
  readonly tenantFilter = signal<string>('');

  readonly displayedColumns: string[] = [
    'status',
    'dueDate',
    'category',
    'property',
    'payer',
    'payee',
    'total',
    'balance',
    'actions',
  ];

  readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: InvoiceStatus.UNPAID, label: 'Unpaid' },
    { value: InvoiceStatus.PARTIALLY_PAID, label: 'Partially Paid' },
    { value: InvoiceStatus.PAID, label: 'Paid' },
    { value: InvoiceStatus.OVERDUE, label: 'Overdue' },
    { value: InvoiceStatus.VOID, label: 'Void' },
  ];

  readonly typeOptions = [
    { value: '', label: 'All Categories' },
    { value: InvoiceType.RENT, label: 'Rent' },
    { value: InvoiceType.DEPOSIT, label: 'Deposit' },
    { value: InvoiceType.RECURRING_CHARGE, label: 'Recurring Charge' },
    { value: InvoiceType.ONE_TIME_CHARGE, label: 'One-time Charge' },
    { value: InvoiceType.LATE_FEE, label: 'Late Fee' },
  ];

  readonly flowOptions = [
    { value: '', label: 'All Flows' },
    { value: 'INCOME', label: 'Income' },
    { value: 'EXPENSE', label: 'Outflow' },
  ];

  // ── Resources ─────────────────────────────────────────────────────

  invoicesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      page: this.page(),
      limit: this.limit(),
      sortBy: this.sortField(),
      sortOrder: this.sortDirection() || 'desc',
    }),
    stream: ({ params }) =>
      this.invoiceService.getInvoices(params.storeId, {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder as 'asc' | 'desc',
      }),
  });

  summaryResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) => this.invoiceService.getSummary(params.storeId),
  });

  propertiesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) =>
      this.propertyService.getProperties(params.storeId, { limit: 500 }),
  });

  tenantsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) =>
      this.tenantService.getTenants(params.storeId, { limit: 500 }),
  });

  // ── Computed values ───────────────────────────────────────────────

  invoices = computed(
    () => this.invoicesResource.value()?.data?.items || [],
  );

  summary = computed(
    () =>
      this.summaryResource.value()?.data || {
        outstanding: 0,
        paid: 0,
        overdue: 0,
      },
  );

  properties = computed(
    () => this.propertiesResource.value()?.data?.items || [],
  );

  allTenants = computed(
    () => this.tenantsResource.value()?.data?.items || [],
  );

  private propertyMap = computed(
    () => new Map(this.properties().map((p) => [p._id, p])),
  );

  private tenantMap = computed(
    () => new Map(this.allTenants().map((t) => [t._id, t])),
  );

  propertyFilterOptions = computed(() => {
    const names = this.properties()
      .map((p) => ({ value: p._id, label: p.name }))
      .filter((p) => !!p.label?.trim());
    return names.sort((a, b) => a.label.localeCompare(b.label));
  });

  tenantFilterOptions = computed(() => {
    return this.allTenants().map((t) => ({
      value: t._id,
      label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || t._id,
    }));
  });

  filteredInvoices = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();
    const flow = this.flowFilter();
    const propId = this.propertyFilter();
    const tenantId = this.tenantFilter();

    return this.invoices().filter((inv) => {
      const searchMatch =
        !search ||
        inv.invoiceNumber?.toLowerCase().includes(search) ||
        inv.title?.toLowerCase().includes(search) ||
        this.payerName(inv).toLowerCase().includes(search) ||
        this.payeeName(inv).toLowerCase().includes(search) ||
        this.propertyName(inv).toLowerCase().includes(search);
      const statusMatch = !status || inv.status === status;
      const typeMatch = !type || inv.type === type;
      const flowMatch = !flow || inv.categorySide === flow;
      const propMatch =
        !propId || this.resolvePropertyId(inv) === propId;
      const tenantMatch =
        !tenantId || this.invoiceMatchesTenant(inv, tenantId);
      return searchMatch && statusMatch && typeMatch && flowMatch && propMatch && tenantMatch;
    });
  });

  /** Group invoices by month/year for display headers */
  groupedInvoices = computed(() => {
    const invoices = this.filteredInvoices();
    const groups: { label: string; key: string; invoices: EstateInvoice[] }[] =
      [];
    const groupMap = new Map<string, EstateInvoice[]>();

    for (const inv of invoices) {
      const date = new Date(inv.createdAt || inv.issueDate || inv.dueDate);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
        groups.push({ label, key, invoices: groupMap.get(key)! });
      }
      groupMap.get(key)!.push(inv);
    }

    return groups;
  });

  currency = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  // ── Actions ───────────────────────────────────────────────────────

  viewInvoice(id: string): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active || 'createdAt');
    this.sortDirection.set(sort.direction || 'desc');
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value || '');
  }

  updateStatusFilter(value: string): void {
    this.statusFilter.set(value || '');
  }

  updateTypeFilter(value: string): void {
    this.typeFilter.set(value || '');
  }

  updateFlowFilter(value: string): void {
    this.flowFilter.set(value || '');
  }

  updatePropertyFilter(value: string): void {
    this.propertyFilter.set(value || '');
  }

  updateTenantFilter(value: string): void {
    this.tenantFilter.set(value || '');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.flowFilter.set('');
    this.propertyFilter.set('');
    this.tenantFilter.set('');
  }

  onActionCompleted(): void {
    this.invoicesResource.reload();
    this.summaryResource.reload();
  }

  // ── Display helpers ───────────────────────────────────────────────

  statusDot(status: string): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-500';
      case InvoiceStatus.UNPAID:
        return 'bg-yellow-500';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'bg-blue-500';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-500';
      case InvoiceStatus.VOID:
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'Paid';
      case InvoiceStatus.UNPAID:
        return 'Unpaid';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'Partial';
      case InvoiceStatus.OVERDUE:
        return 'Overdue';
      case InvoiceStatus.VOID:
        return 'Void';
      default:
        return status;
    }
  }

  categoryLabel(type: string): string {
    switch (type) {
      case InvoiceType.RENT:
        return 'Rent';
      case InvoiceType.DEPOSIT:
        return 'Deposit';
      case InvoiceType.RECURRING_CHARGE:
        return 'Recurring';
      case InvoiceType.ONE_TIME_CHARGE:
        return 'One-time';
      case InvoiceType.LATE_FEE:
        return 'Late Fee';
      default:
        return type;
    }
  }

  flowLabel(invoice: EstateInvoice): string {
    if (invoice.categorySide === 'EXPENSE') {
      return 'Outflow';
    }
    if (invoice.categorySide === 'INCOME') {
      return 'Inflow';
    }
    return 'Not identified';
  }

  flowChipClass(invoice: EstateInvoice): string {
    if (invoice.categorySide === 'EXPENSE') {
      return 'bg-red-100 text-red-700';
    }
    if (invoice.categorySide === 'INCOME') {
      return 'bg-emerald-100 text-emerald-700';
    }
    return 'bg-gray-100 text-gray-600';
  }

  isRecurring(type: string): boolean {
    return (
      type === InvoiceType.RENT || type === InvoiceType.RECURRING_CHARGE
    );
  }

  propertyName(invoice: EstateInvoice): string {
    if (typeof invoice.propertyId !== 'string') {
      return (invoice.propertyId as Property).name || '--';
    }
    return this.propertyMap().get(invoice.propertyId)?.name || '--';
  }

  unitName(invoice: EstateInvoice): string | null {
    if (!invoice.unitId) return null;
    if (typeof invoice.unitId !== 'string') {
      return (invoice.unitId as Unit).name || null;
    }
    return null;
  }

  private primaryTenantName(invoice: EstateInvoice): string {
    const tenantRef = invoice.tenantId || invoice.tenantIds?.[0];
    if (!tenantRef) return '--';
    if (typeof tenantRef !== 'string') {
      const t = tenantRef as Tenant;
      return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '--';
    }
    const t = this.tenantMap().get(tenantRef);
    if (!t) return '--';
    return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '--';
  }

  payerName(invoice: EstateInvoice): string {
    if (invoice.categorySide === 'EXPENSE') {
      return this.storeStore.selectedStore()?.name || 'Company';
    }
    return this.primaryTenantName(invoice);
  }

  payeeName(invoice: EstateInvoice): string {
    if (invoice.categorySide === 'EXPENSE') {
      return this.primaryTenantName(invoice);
    }
    return this.storeStore.selectedStore()?.name || 'Company';
  }

  extraTenants(invoice: EstateInvoice): number {
    if (invoice.tenantId) return 0;
    return Math.max(0, (invoice.tenantIds?.length || 0) - 1);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private resolvePropertyId(invoice: EstateInvoice): string {
    if (typeof invoice.propertyId === 'string') return invoice.propertyId;
    return (invoice.propertyId as Property)?._id || '';
  }

  private invoiceMatchesTenant(invoice: EstateInvoice, tenantId: string): boolean {
    if (invoice.tenantId) {
      const id = typeof invoice.tenantId === 'string'
        ? invoice.tenantId
        : (invoice.tenantId as Tenant)._id;
      return id === tenantId;
    }
    return (invoice.tenantIds || []).some((ref) => {
      const id = typeof ref === 'string' ? ref : (ref as Tenant)._id;
      return id === tenantId;
    });
  }
}
