import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ArrearsRow } from '../../models/arrears.model';
import { NoRecordComponent } from '../no-record/no-record.component';
import { StoreStore } from '../../stores/store.store';

@Component({
  selector: 'app-arrears-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    NoRecordComponent,
    CurrencyPipe,
  ],
  templateUrl: './arrears-table.component.html',
})
export class ArrearsTableComponent {
  @Input() rows: ArrearsRow[] = [];
  @Input() totalItems = 0;
  @Input() pageSize = 20;
  @Input() currentPage = 1;
  @Input() isLoading = false;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() actionExecuted = new EventEmitter<{ action: string; row: ArrearsRow }>();

  private router = inject(Router);
  private readonly storeStore = inject(StoreStore);

  protected readonly displayedColumns = [
    'tenant',
    'property',
    'totalOverdue',
    'days',
    'aging',
    'invoices',
    'status',
    'actions',
  ];
  protected readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');

  getSeverityBadgeClass(days: number): string {
    if (days <= 30) return 'bg-blue-100 text-blue-800';
    if (days <= 60) return 'bg-orange-100 text-orange-800';
    if (days <= 90) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  getStatusClass(status: string): string {
    const baseClass = '!cursor-default';
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return `${baseClass} !bg-green-100 !text-green-800`;
      case 'ENDED':
        return `${baseClass} !bg-gray-100 !text-gray-800`;
      case 'TERMINATED':
        return `${baseClass} !bg-red-100 !text-red-800`;
      default:
        return `${baseClass} !bg-gray-100 !text-gray-800`;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  viewInvoices(row: ArrearsRow): void {
    this.router.navigate(['/menu/ems/invoicing/invoices'], {
      queryParams: { leaseId: row.leaseId },
    });
    this.actionExecuted.emit({ action: 'viewInvoices', row });
  }

  viewLedger(row: ArrearsRow): void {
    this.router.navigate(['/menu/ems/invoicing/ledger'], {
      queryParams: { leaseId: row.leaseId },
    });
    this.actionExecuted.emit({ action: 'viewLedger', row });
  }

  recordPayment(row: ArrearsRow): void {
    this.router.navigate(['/menu/ems/invoicing/payments/new'], {
      queryParams: { leaseId: row.leaseId },
    });
    this.actionExecuted.emit({ action: 'recordPayment', row });
  }

  applyDeposit(row: ArrearsRow): void {
    this.router.navigate(['/menu/ems/invoicing/deposits/new'], {
      queryParams: { leaseId: row.leaseId },
    });
    this.actionExecuted.emit({ action: 'applyDeposit', row });
  }

  endLease(row: ArrearsRow): void {
    this.router.navigate(['/menu/ems/leases', row.leaseId, 'closeout']);
    this.actionExecuted.emit({ action: 'endLease', row });
  }
}
