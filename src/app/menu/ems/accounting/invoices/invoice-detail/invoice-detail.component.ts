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
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { EstateInvoiceService } from '../../../../../shared/services/estate-invoice.service';
import { EstatePaymentService } from '../../../../../shared/services/estate-payment.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { InvoiceActionsMenuComponent } from '../../../../../shared/components/invoice-actions-menu/invoice-actions-menu.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import {
  EstatePayment,
  EstateInvoice,
  InvoiceStatus,
  InvoiceType,
  Property,
  Tenant,
  Unit,
} from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    PageHeaderComponent,
    InvoiceActionsMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-detail.component.html',
})
export class InvoiceDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(EstateInvoiceService);
  private paymentService = inject(EstatePaymentService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  private invoiceId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  readonly exportingPdf = signal(false);

  invoiceResource = rxResource({
    params: () => ({ id: this.invoiceId() }),
    stream: ({ params }) => this.invoiceService.getInvoiceById(params.id),
  });

  invoice = computed<EstateInvoice | null>(
    () => this.invoiceResource.value()?.data || null,
  );

  readonly paymentProgress = computed(() => {
    const inv = this.invoice();
    if (!inv || !inv.amount) return 0;
    return Math.min(100, Math.max(0, (inv.amountPaid / inv.amount) * 100));
  });

  readonly paymentActivityColumns: string[] = [
    'date',
    'status',
    'method',
    'amount',
    'payer',
    'description',
  ];

  readonly paymentActivities = computed(() => {
    const records = this.paymentsForInvoiceResource.value()?.data || [];
    if (!records.length) return [];

    return records.map((record) => {
      const payment = record.payment;
      return {
        date: record.allocationDate || payment.paymentDate,
        status: this.paymentStatusLabel(payment.status),
        statusClass: this.paymentStatusClass(payment.status),
        method: this.paymentMethodLabel(payment.paymentMethod),
        amount: record.allocatedAmount,
        payer: this.paymentPayerName(payment),
        description: payment.note || payment.paymentNumber,
      };
    });
  });

  readonly paymentsForInvoiceResource = rxResource({
    params: () => ({
      invoiceId: this.invoice()?._id || '',
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) => {
      if (!params.invoiceId || !params.storeId) {
        return of({ success: true, data: [] });
      }
      return this.paymentService.getPaymentsForInvoice(params.invoiceId, params.storeId);
    },
  });

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  onActionCompleted(event: 'paid' | 'voided' | 'unvoided' | 'deleted'): void {
    if (event === 'deleted') {
      this.goBack();
    } else {
      this.invoiceResource.reload();
      this.paymentsForInvoiceResource.reload();
    }
  }

  async exportInvoiceToPDF(): Promise<void> {
    const invoice = this.invoice();
    if (!invoice) return;

    this.exportingPdf.set(true);
    try {
      const pdfBlob = await this.invoiceService
        .exportInvoiceToPDF(invoice._id)
        .toPromise();

      if (pdfBlob) {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to export invoice PDF';
      this.snackBar.open(message, 'Close', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.exportingPdf.set(false);
    }
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
        return 'Partially Paid';
      case InvoiceStatus.OVERDUE:
        return 'Overdue';
      case InvoiceStatus.VOID:
        return 'Void';
      default:
        return status;
    }
  }

  statusChipClass(status: string): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-600! text-white!';
      case InvoiceStatus.UNPAID:
        return 'bg-yellow-500! text-white!';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'bg-blue-500! text-white!';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-600! text-white!';
      case InvoiceStatus.VOID:
        return 'bg-gray-400! text-white!';
      default:
        return 'bg-gray-400! text-white!';
    }
  }

  categoryLabel(type: string): string {
    switch (type) {
      case InvoiceType.RENT:
        return 'Rent';
      case InvoiceType.DEPOSIT:
        return 'Deposit';
      case InvoiceType.RECURRING_CHARGE:
        return 'Recurring Charge';
      case InvoiceType.ONE_TIME_CHARGE:
        return 'One-time Charge';
      case InvoiceType.LATE_FEE:
        return 'Late Fee';
      default:
        return type;
    }
  }

  sourceLabel(source: string): string {
    switch (source) {
      case 'LEASE_CREATION':
        return 'Lease Creation';
      case 'SCHEDULER':
        return 'Scheduler';
      case 'MANUAL':
        return 'Manual';
      default:
        return source;
    }
  }

  propertyName(invoice: EstateInvoice): string {
    if (typeof invoice.propertyId !== 'string') {
      return (invoice.propertyId as Property).name || '--';
    }
    return invoice.propertyId || '--';
  }

  unitName(invoice: EstateInvoice): string | null {
    if (!invoice.unitId) return null;
    if (typeof invoice.unitId !== 'string') {
      return (invoice.unitId as Unit).name || null;
    }
    return null;
  }

  tenantNames(invoice: EstateInvoice): string[] {
    const ids = invoice.tenantId
      ? [invoice.tenantId]
      : invoice.tenantIds || [];
    return ids.map((ref) => {
      if (typeof ref !== 'string') {
        const t = ref as Tenant;
        return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '--';
      }
      return ref;
    });
  }

  primaryPayerName(invoice: EstateInvoice): string {
    if (invoice.categorySide === 'EXPENSE') {
      return this.storeStore.selectedStore()?.name || 'Company';
    }
    return this.tenantNames(invoice)[0] || '--';
  }

  primaryPayeeName(invoice: EstateInvoice): string {
    if (invoice.categorySide === 'EXPENSE') {
      return this.tenantNames(invoice)[0] || '--';
    }
    return this.storeStore.selectedStore()?.name || 'Company';
  }

  initiatorName(invoice: EstateInvoice): string {
    if (!invoice.createdBy) {
      return '--';
    }

    if (typeof invoice.createdBy === 'string') {
      return invoice.createdBy;
    }

    return invoice.createdBy.name || invoice.createdBy.email || '--';
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
      return 'bg-red-100! text-red-700!';
    }
    if (invoice.categorySide === 'INCOME') {
      return 'bg-emerald-100! text-emerald-700!';
    }
    return 'bg-gray-100! text-gray-600!';
  }

  tenantInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '--';
  }

  amountLeft(invoice: EstateInvoice): number {
    return Math.max(invoice.balance || 0, 0);
  }

  transactionId(invoice: EstateInvoice): string {
    const metadataId = invoice.metadata?.['transactionId'];
    if (typeof metadataId === 'string' && metadataId.trim()) {
      return metadataId;
    }

    return invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase();
  }

  typeSummary(invoice: EstateInvoice): string {
    const category = this.categoryLabel(invoice.type);
    const cadence = invoice.billingPeriodStart && invoice.billingPeriodEnd
      ? 'Recurring'
      : 'One time';
    return `${category} / ${cadence}`;
  }

  paymentStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Success';
      case 'PARTIALLY_ALLOCATED':
        return 'Partial';
      case 'REVERSED':
        return 'Reversed';
      default:
        return 'Pending';
    }
  }

  paymentStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-700';
      case 'PARTIALLY_ALLOCATED':
        return 'text-blue-700';
      case 'REVERSED':
        return 'text-gray-500';
      default:
        return 'text-yellow-700';
    }
  }

  hasPaymentActivity(): boolean {
    return this.paymentActivities().length > 0;
  }

  paymentMethodLabel(value: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
    }
    return 'N/A';
  }

  paymentPayerName(payment: EstatePayment): string {
    const invoice = this.invoice();
    if (invoice?.categorySide === 'EXPENSE') {
      return this.storeStore.selectedStore()?.name || 'Company';
    }

    const tenantRef = payment.tenantId || payment.tenantIds?.[0];
    if (!tenantRef) return '--';
    if (typeof tenantRef === 'string') return '--';
    const t = tenantRef as Tenant;
    return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '--';
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
