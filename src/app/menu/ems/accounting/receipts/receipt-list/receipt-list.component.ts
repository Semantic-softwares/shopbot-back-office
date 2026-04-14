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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogResult } from '../../../../hms/front-desk/reservations/pin-authorization-dialog/pin-authorization-dialog.component';
import { ReceiptApiService } from '../../../../../shared/services/receipt-api.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { RolesService } from '../../../../../shared/services/roles.service';
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
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
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
  private readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly searchQuery = signal('');
  readonly tenantFilter = signal('');
  readonly methodFilter = signal('');
  readonly isAdmin = computed(() => this.rolesService.isAdmin());
  readonly displayedColumns = computed(() => {
    const cols = [
      'receiptNumber',
      'receiptDate',
      'method',
      'tenant',
      'amount',
    ];
    if (this.isAdmin()) {
      cols.push('actions');
    }
    return cols;
  });

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

  deleteReceipt(event: MouseEvent, receipt: Receipt): void {
    event.stopPropagation();

    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Receipt',
        message: `Are you sure you want to delete receipt ${receipt.receiptNumber}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const storeId = this.storeStore.selectedStore()?._id;
      if (!storeId) return;

      const pinRef = this.dialog.open(PinAuthorizationDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          storeId,
          actionDescription: `delete receipt ${receipt.receiptNumber}`,
          reservationId: '',
        },
      });

      pinRef.afterClosed().subscribe((result: PinAuthorizationDialogResult) => {
        if (!result?.authorized) return;

        this.receiptApiService.deleteReceipt(receipt._id).subscribe({
          next: () => {
            this.snackBar.open('Receipt deleted successfully', 'Close', { duration: 3000 });
            this.receiptsResource.reload();
          },
          error: (err) => {
            this.snackBar.open(
              err?.error?.message || 'Failed to delete receipt',
              'Close',
              { duration: 5000 },
            );
          },
        });
      });
    });
  }
}
