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
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EMPTY } from 'rxjs';
import { EstateInvoiceService } from '../../../../../../../shared/services/estate-invoice.service';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { InvoiceActionsMenuComponent } from '../../../../../../../shared/components/invoice-actions-menu/invoice-actions-menu.component';
import { NoRecordComponent } from '../../../../../../../shared/components/no-record/no-record.component';
import {
  EstateInvoice,
  InvoiceStatus,
  InvoiceType,
  Property,
  Unit,
} from '../../../../../../../shared/models/estate.model';

@Component({
  selector: 'app-tenant-invoices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    InvoiceActionsMenuComponent,
    NoRecordComponent,
  ],
  templateUrl: './invoices.component.html',
})
export class TenantInvoicesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoiceService = inject(EstateInvoiceService);
  private readonly storeStore = inject(StoreStore);

  readonly displayedColumns: string[] = [
    'status',
    'dueDate',
    'category',
    'property',
    'total',
    'balance',
    'actions',
  ];

  private readonly tenantId = computed(() => {
    let current = this.route.snapshot;
    while (current) {
      const id = current.paramMap.get('id');
      if (id) return id;
      current = current.parent!;
    }
    return '';
  });

  readonly invoicesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      tenantId: this.tenantId(),
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.tenantId) return EMPTY;
      return this.invoiceService.getInvoices(params.storeId, {
        tenantId: params.tenantId,
        limit: 100,
        sortBy: 'dueDate',
        sortOrder: 'desc',
      });
    },
  });

  readonly invoices = computed(
    () => this.invoicesResource.value()?.data?.items || [],
  );

  readonly currency = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  viewInvoice(id: string): void {
    this.router.navigate(['/menu/ems/accounting/invoices', id]);
  }

  onActionCompleted(): void {
    this.invoicesResource.reload();
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

  propertyName(invoice: EstateInvoice): string {
    if (invoice.propertyId && typeof invoice.propertyId !== 'string') {
      return (invoice.propertyId as Property).name || '--';
    }
    return '--';
  }

  unitName(invoice: EstateInvoice): string | null {
    if (!invoice.unitId) return null;
    if (typeof invoice.unitId !== 'string') {
      return (invoice.unitId as Unit).name || null;
    }
    return null;
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '0.00';
    return new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
