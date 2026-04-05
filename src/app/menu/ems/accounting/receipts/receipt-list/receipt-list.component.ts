import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { ReceiptApiService } from '../../../../../shared/services/receipt-api.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import {
  EstatePaymentMethod,
  Receipt,
  Tenant,
} from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-receipt-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    NoRecordComponent,
    PageHeaderComponent,
  ],
  templateUrl: './receipt-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly receiptApiService = inject(ReceiptApiService);
  private readonly storeStore = inject(StoreStore);

  readonly searchQuery = signal('');
  readonly tenantFilter = signal('');
  readonly methodFilter = signal('');
  readonly displayedColumns = [
    'receiptNumber',
    'receiptDate',
    'method',
    'tenant',
    'amount',
  ];

  readonly receiptsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) => this.receiptApiService.getReceipts(params.storeId),
  });

  readonly receipts = computed(() => this.receiptsResource.value()?.data?.items || []);

  readonly currencyCode = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  readonly tenantFilterOptions = computed(() => {
    const options = this.receipts()
      .map((receipt) => {
        const tenantRef = receipt.tenantId || receipt.tenantIds?.[0];
        if (!tenantRef) return null;

        if (typeof tenantRef === 'string') {
          return { value: tenantRef, label: tenantRef };
        }

        const tenant = tenantRef as Tenant;
        const label = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '--';
        return { value: tenant._id, label };
      })
      .filter((item): item is { value: string; label: string } => !!item);

    const unique = new Map<string, string>();
    for (const option of options) {
      if (!unique.has(option.value)) {
        unique.set(option.value, option.label);
      }
    }

    return Array.from(unique.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly methodOptions = [
    { value: '', label: 'All Methods' },
    { value: EstatePaymentMethod.CASH, label: 'Cash' },
    { value: EstatePaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
    { value: EstatePaymentMethod.CARD, label: 'Card' },
    { value: EstatePaymentMethod.ONLINE, label: 'Online' },
    { value: EstatePaymentMethod.OTHER, label: 'Other' },
  ];

  readonly filteredReceipts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const tenantId = this.tenantFilter();
    const paymentMethod = this.methodFilter();

    return this.receipts().filter((receipt) => {
      const receiptNumber = receipt.receiptNumber?.toLowerCase() || '';
      const tenantName = this.tenantName(receipt).toLowerCase();
      const queryMatch =
        !query ||
        receiptNumber.includes(query) ||
        tenantName.includes(query);

      const tenantRef = receipt.tenantId || receipt.tenantIds?.[0];
      const receiptTenantId =
        !tenantRef || typeof tenantRef === 'string'
          ? tenantRef || ''
          : (tenantRef as Tenant)._id;
      const tenantMatch = !tenantId || receiptTenantId === tenantId;
      const methodMatch = !paymentMethod || receipt.paymentMethod === paymentMethod;

      return queryMatch && tenantMatch && methodMatch;
    });
  });

  readonly totalAmount = computed(() =>
    this.filteredReceipts().reduce(
      (acc, receipt) => acc + (receipt.amountReceived || 0),
      0,
    ),
  );

  viewReceipt(id: string): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value || '');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.tenantFilter.set('');
    this.methodFilter.set('');
  }

  updateTenantFilter(value: string): void {
    this.tenantFilter.set(value || '');
  }

  updateMethodFilter(value: string): void {
    this.methodFilter.set(value || '');
  }

  tenantName(receipt: Receipt): string {
    const tenantRef = receipt.tenantId || receipt.tenantIds?.[0];
    if (!tenantRef) return '--';
    if (typeof tenantRef === 'string') return tenantRef;
    const tenant = tenantRef as Tenant;
    return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '--';
  }

  methodLabel(method: EstatePaymentMethod): string {
    switch (method) {
      case EstatePaymentMethod.BANK_TRANSFER:
        return 'Bank Transfer';
      default:
        return method
          .split('_')
          .map((part: string) => part.charAt(0) + part.slice(1).toLowerCase())
          .join(' ');
    }
  }

  formatCurrency(amount: number, currency = this.currencyCode()): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }
}
