import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { EstatePaymentService } from '../../../../../shared/services/estate-payment.service';
import {
  EstateInvoice,
  EstatePayment,
  EstatePaymentMethod,
  PaymentAllocation,
  PaymentStatus,
  Property,
  Tenant,
  Unit,
} from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './payment-detail.component.html',
  styleUrl: './payment-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(EstatePaymentService);

  private readonly paymentId = computed(
    () => this.route.snapshot.paramMap.get('id') || '',
  );

  readonly paymentResource = rxResource({
    params: () => ({ id: this.paymentId() }),
    stream: ({ params }) => this.paymentService.getPaymentById(params.id),
  });

  readonly payment = computed<EstatePayment | null>(
    () => this.paymentResource.value()?.data || null,
  );

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  formatCurrency(amount: number, currency = 'NGN'): string {
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
        return 'bg-green-600! text-white!';
      case PaymentStatus.PARTIALLY_ALLOCATED:
        return 'bg-blue-500! text-white!';
      case PaymentStatus.UNALLOCATED:
        return 'bg-yellow-500! text-white!';
      case PaymentStatus.REVERSED:
        return 'bg-gray-400! text-white!';
      default:
        return 'bg-gray-400! text-white!';
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

  unitName(payment: EstatePayment): string | null {
    if (!payment.unitId) return null;
    if (typeof payment.unitId === 'string') return payment.unitId;
    return (payment.unitId as Unit)?.name || null;
  }

  allocationInvoiceNumber(allocation: PaymentAllocation): string {
    if (typeof allocation.invoiceId === 'string') return allocation.invoiceId;
    return (allocation.invoiceId as EstateInvoice)?.invoiceNumber || '--';
  }

  allocationInvoiceTitle(allocation: PaymentAllocation): string {
    if (typeof allocation.invoiceId === 'string') return allocation.invoiceId;
    return (allocation.invoiceId as EstateInvoice)?.title || '--';
  }
}
