import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EstateInvoiceService } from '../../../../../../shared/services/estate-invoice.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import {
  EstateInvoice,
  InvoiceStatus,
  InvoiceType,
  Tenant,
} from '../../../../../../shared/models/estate.model';

@Component({
  selector: 'app-lease-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-billing.component.html',
  styleUrl: './lease-billing.component.scss',
})
export class LeaseBillingComponent {
  private route = inject(ActivatedRoute);
  private invoiceService = inject(EstateInvoiceService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  private leaseId = computed(
    () => this.route.parent?.snapshot.paramMap.get('id') || '',
  );

  readonly generating = signal<boolean>(false);

  readonly displayedColumns: string[] = [
    'status',
    'title',
    'dueDate',
    'type',
    'tenant',
    'amount',
    'balance',
  ];

  invoicesResource = rxResource({
    params: () => ({
      leaseId: this.leaseId(),
    }),
    stream: ({ params }) =>
      this.invoiceService.getLeaseInvoices(params.leaseId, {
        limit: 200,
        sortBy: 'dueDate',
        sortOrder: 'asc',
      }),
  });

  invoices = computed<EstateInvoice[]>(
    () => this.invoicesResource.value()?.data?.items || [],
  );

  totalAmount = computed(() =>
    this.invoices().reduce((sum, inv) => sum + inv.amount, 0),
  );

  totalBalance = computed(() =>
    this.invoices().reduce((sum, inv) => sum + inv.balance, 0),
  );

  generateMissing(): void {
    const leaseId = this.leaseId();
    const storeId = this.storeStore.selectedStore()?._id;
    if (!leaseId || !storeId) return;

    this.generating.set(true);
    this.invoiceService.generateMissingInvoices(leaseId, storeId).subscribe({
      next: (res) => {
        const count = (res as any).data?.count ?? 0;
        this.snackBar.open(
          count > 0 ? `${count} invoice(s) generated` : 'No new invoices to generate',
          'OK',
          { duration: 3000 },
        );
        this.invoicesResource.reload();
        this.generating.set(false);
      },
      error: (err) => {
        this.snackBar.open('Failed to generate invoices', 'OK', { duration: 4000 });
        this.generating.set(false);
      },
    });
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

  isRecurring(type: string): boolean {
    return type === InvoiceType.RENT || type === InvoiceType.RECURRING_CHARGE;
  }

  tenantName(invoice: EstateInvoice): string {
    const ref = invoice.tenantId || invoice.tenantIds?.[0];
    if (!ref) return '--';
    if (typeof ref !== 'string') {
      const t = ref as Tenant;
      return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '--';
    }
    return ref;
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
