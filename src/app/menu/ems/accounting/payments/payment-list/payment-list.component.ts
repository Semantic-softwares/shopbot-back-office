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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogResult } from '../../../../hms/front-desk/reservations/pin-authorization-dialog/pin-authorization-dialog.component';
import { EstatePaymentService } from '../../../../../shared/services/estate-payment.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { RolesService } from '../../../../../shared/services/roles.service';
import {
  EstatePayment,
  EstatePaymentMethod,
  PaymentStatus,
  Property,
  Tenant,
} from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    NoRecordComponent,
    PageHeaderComponent,
  ],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(EstatePaymentService);
  private readonly storeStore = inject(StoreStore);
  private readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly searchQuery = signal('');
  readonly methodFilter = signal<string>('');
  readonly statusFilter = signal<string>('');
  readonly flowFilter = signal<string>('');
  readonly isAdmin = computed(() => this.rolesService.isAdmin());
  readonly displayedColumns = computed(() => {
    const cols = [
      'paymentNumber',
      'paymentDate',
      'method',
      'status',
      'flow',
      'payer',
      'payee',
      'amount',
      'balance',
    ];
    if (this.isAdmin()) {
      cols.push('actions');
    }
    return cols;
  });

  readonly paymentsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) => this.paymentService.listPayments(params.storeId),
  });

  readonly payments = computed(
    () => this.paymentsResource.value()?.data?.items || [],
  );

  readonly currencyCode = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  readonly methodOptions = computed(() => [
    { value: '', label: 'All Methods' },
    { value: EstatePaymentMethod.CASH, label: this.methodLabel(EstatePaymentMethod.CASH) },
    { value: EstatePaymentMethod.BANK_TRANSFER, label: this.methodLabel(EstatePaymentMethod.BANK_TRANSFER) },
    { value: EstatePaymentMethod.CARD, label: this.methodLabel(EstatePaymentMethod.CARD) },
    { value: EstatePaymentMethod.ONLINE, label: this.methodLabel(EstatePaymentMethod.ONLINE) },
    { value: EstatePaymentMethod.OTHER, label: this.methodLabel(EstatePaymentMethod.OTHER) },
  ]);

  readonly statusOptions = computed(() => [
    { value: '', label: 'All Statuses' },
    { value: PaymentStatus.UNALLOCATED, label: this.statusLabel(PaymentStatus.UNALLOCATED) },
    {
      value: PaymentStatus.PARTIALLY_ALLOCATED,
      label: this.statusLabel(PaymentStatus.PARTIALLY_ALLOCATED),
    },
    { value: PaymentStatus.COMPLETED, label: this.statusLabel(PaymentStatus.COMPLETED) },
    { value: PaymentStatus.REVERSED, label: this.statusLabel(PaymentStatus.REVERSED) },
  ]);

  readonly flowOptions = [
    { value: '', label: 'All Flows' },
    { value: 'INCOME', label: 'Inflow' },
    { value: 'EXPENSE', label: 'Outflow' },
    { value: 'MIXED', label: 'Mixed' },
    { value: 'UNSET', label: 'Not identified' },
  ];

  readonly filteredPayments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const method = this.methodFilter();
    const status = this.statusFilter();
    const flow = this.flowFilter();

    return this.payments().filter((payment) => {
      const paymentNumber = payment.paymentNumber?.toLowerCase() || '';
      const note = payment.note?.toLowerCase() || '';
      const reference = payment.reference?.toLowerCase() || '';
      const payer = this.payerName(payment).toLowerCase();
      const payee = this.payeeName(payment).toLowerCase();
      const property = this.propertyName(payment).toLowerCase();
      const queryMatch =
        !query ||
        paymentNumber.includes(query) ||
        note.includes(query) ||
        reference.includes(query) ||
        payer.includes(query) ||
        payee.includes(query) ||
        property.includes(query);

      const methodMatch = !method || payment.paymentMethod === method;
      const statusMatch = !status || payment.status === status;
      const paymentFlow = payment.financialSide || 'UNSET';
      const flowMatch = !flow || paymentFlow === flow;

      return queryMatch && methodMatch && statusMatch && flowMatch;
    });
  });

  readonly totals = computed(() => {
    return this.filteredPayments().reduce(
      (acc, payment) => {
        acc.total += payment.totalAmount || 0;
        acc.allocated += payment.allocatedAmount || 0;
        acc.unallocated += payment.unallocatedAmount || 0;
        return acc;
      },
      { total: 0, allocated: 0, unallocated: 0 },
    );
  });

  viewPayment(id: string): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value || '');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  updateMethodFilter(value: string): void {
    this.methodFilter.set(value || '');
  }

  updateStatusFilter(value: string): void {
    this.statusFilter.set(value || '');
  }

  updateFlowFilter(value: string): void {
    this.flowFilter.set(value || '');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.methodFilter.set('');
    this.statusFilter.set('');
    this.flowFilter.set('');
  }

  formatCurrency(amount: number, currency = this.currencyCode()): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }

  statusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.UNALLOCATED:
        return 'Unallocated';
      case PaymentStatus.PARTIALLY_ALLOCATED:
        return 'Partially Allocated';
      case PaymentStatus.COMPLETED:
        return 'Completed';
      case PaymentStatus.REVERSED:
        return 'Reversed';
      default:
        return status;
    }
  }

  statusChipClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case PaymentStatus.PARTIALLY_ALLOCATED:
        return 'bg-blue-100 text-blue-700';
      case PaymentStatus.UNALLOCATED:
        return 'bg-yellow-100 text-yellow-700';
      case PaymentStatus.REVERSED:
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
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

  payerName(payment: EstatePayment): string {
    if (payment.financialSide === 'EXPENSE') {
      return this.storeStore.selectedStore()?.name || 'Company';
    }

    const tenantRef = payment.tenantId || payment.tenantIds?.[0];
    if (!tenantRef) return '--';
    if (typeof tenantRef === 'string') return tenantRef;
    const tenant = tenantRef as Tenant;
    return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '--';
  }

  payeeName(payment: EstatePayment): string {
    if (payment.financialSide === 'INCOME') {
      return this.storeStore.selectedStore()?.name || 'Company';
    }

    const tenantRef = payment.tenantId || payment.tenantIds?.[0];
    if (!tenantRef) return '--';
    if (typeof tenantRef === 'string') return tenantRef;
    const tenant = tenantRef as Tenant;
    return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '--';
  }

  propertyName(payment: EstatePayment): string {
    if (typeof payment.propertyId === 'string') return payment.propertyId;
    return (payment.propertyId as Property)?.name || '--';
  }

  flowLabel(payment: EstatePayment): string {
    if (payment.financialSide === 'INCOME') {
      return 'Inflow';
    }
    if (payment.financialSide === 'EXPENSE') {
      return 'Outflow';
    }
    if (payment.financialSide === 'MIXED') {
      return 'Mixed';
    }
    return 'Not identified';
  }

  flowChipClass(payment: EstatePayment): string {
    if (payment.financialSide === 'INCOME') {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (payment.financialSide === 'EXPENSE') {
      return 'bg-red-100 text-red-700';
    }
    if (payment.financialSide === 'MIXED') {
      return 'bg-amber-100 text-amber-700';
    }
    return 'bg-gray-100 text-gray-600';
  }

  deletePayment(event: MouseEvent, payment: EstatePayment): void {
    event.stopPropagation();

    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Payment',
        message: `Are you sure you want to delete payment ${payment.paymentNumber}? This action cannot be undone.`,
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
          actionDescription: `delete payment ${payment.paymentNumber}`,
          reservationId: '',
        },
      });

      pinRef.afterClosed().subscribe((result: PinAuthorizationDialogResult) => {
        if (!result?.authorized) return;

        this.paymentService.deletePayment(payment._id).subscribe({
          next: () => {
            this.snackBar.open('Payment deleted successfully', 'Close', { duration: 3000 });
            this.paymentsResource.reload();
          },
          error: (err) => {
            this.snackBar.open(
              err?.error?.message || 'Failed to delete payment',
              'Close',
              { duration: 5000 },
            );
          },
        });
      });
    });
  }
}
