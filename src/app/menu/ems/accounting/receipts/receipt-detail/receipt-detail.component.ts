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
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ReceiptApiService } from '../../../../../shared/services/receipt-api.service';
import {
  EstatePaymentMethod,
  PaymentStatus,
  Receipt,
  Tenant,
} from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-receipt-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    PageHeaderComponent,
  ],
  templateUrl: './receipt-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly receiptApiService = inject(ReceiptApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id') || '');
  readonly displayedColumns = ['invoiceNumber', 'allocatedAmount'];
  readonly exportingPdf = signal(false);

  readonly receiptResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.receiptApiService.getReceiptById(params.id),
  });

  readonly receipt = computed<Receipt | null>(
    () => this.receiptResource.value()?.data || null,
  );

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  async printReceipt(): Promise<void> {
    const receipt = this.receipt();
    if (!receipt) return;

    this.exportingPdf.set(true);
    try {
      const pdfBlob = await this.receiptApiService
        .exportReceiptToPDF(receipt._id)
        .toPromise();

      if (pdfBlob) {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${receipt.receiptNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to export receipt PDF';
      this.snackBar.open(message, 'Close', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.exportingPdf.set(false);
    }
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

  isRefundedReceipt(receipt: Receipt): boolean {
    if (!receipt?.paymentId || typeof receipt.paymentId === 'string') {
      return false;
    }

    return receipt.paymentId.status === PaymentStatus.REVERSED;
  }

  amountLabel(receipt: Receipt): string {
    return this.isRefundedReceipt(receipt) ? 'Amount Sent' : 'Amount Received';
  }

  amountClass(receipt: Receipt): string {
    return this.isRefundedReceipt(receipt)
      ? 'border-red-100 bg-red-50/40'
      : 'border-emerald-100 bg-emerald-50/40';
  }

  amountLabelClass(receipt: Receipt): string {
    return this.isRefundedReceipt(receipt)
      ? 'text-red-700'
      : 'text-emerald-700';
  }

  amountValueClass(receipt: Receipt): string {
    return this.isRefundedReceipt(receipt)
      ? 'text-red-800'
      : 'text-emerald-800';
  }

  formatCurrency(amount: number, currency = 'NGN'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }
}
