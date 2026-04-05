import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LeaseDetailPageComponent } from '../../lease-detail-page.component';
import {
  BillingFrequency,
  DepositConfig,
  LateFeeType,
  OtherLeaseTransaction,
} from '../../../../../../shared/models/estate.model';

@Component({
  selector: 'app-lease-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './lease-transactions.component.html',
})
export class LeaseTransactionsComponent {
  private parent = inject(LeaseDetailPageComponent);
  lease = this.parent.lease;

  readonly rentColumns: string[] = ['status', 'firstInvoice', 'category', 'nextInvoice', 'totalSchedule'];
  readonly depositColumns: string[] = ['status', 'invoiceDate', 'category', 'totalAmount'];
  readonly otherColumns: string[] = ['status', 'firstInvoice', 'category', 'nextInvoice', 'totalSchedule', 'actions'];

  readonly rentDataSource = computed(() => {
    const rent = this.lease()?.leaseTransactions?.recurringRent;
    if (!rent?.enabled) return [];
    return [rent];
  });

  readonly depositDataSource = computed(() => {
    return this.lease()?.leaseTransactions?.deposits ?? [];
  });

  readonly otherDataSource = computed(() => {
    return this.lease()?.leaseTransactions?.otherTransactions ?? [];
  });

  readonly lateFeeSettings = computed(() => {
    return this.lease()?.leaseTransactions?.lateFeeSettings;
  });

  readonly extraFeesCount = computed(() => {
    const settings = this.lateFeeSettings();
    if (!settings?.enabled) return 0;
    let count = 0;
    if (settings.oneTimeLateFee?.enabled) count++;
    if (settings.dailyLateFee?.enabled) count++;
    return count;
  });

  frequencyLabel(freq?: BillingFrequency | null): string {
    const labels: Record<string, string> = {
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly',
    };
    return freq ? labels[freq] ?? freq : '—';
  }

  frequencyAbbrev(freq?: BillingFrequency | null): string {
    const abbrevs: Record<string, string> = {
      WEEKLY: '/wk',
      BIWEEKLY: '/2wk',
      MONTHLY: '/mo',
      QUARTERLY: '/qtr',
      YEARLY: '/yr',
    };
    return freq ? abbrevs[freq] ?? '' : '';
  }

  feeTypeLabel(type?: LateFeeType): string {
    return type === LateFeeType.PERCENTAGE ? '%' : 'flat';
  }

  depositCategoryLabel(deposit: DepositConfig): string {
    return deposit.category?.replace(/_/g, ' ') ?? 'Deposit';
  }

  otherCategoryLabel(txn: OtherLeaseTransaction): string {
    return txn.title || txn.account || 'Other';
  }
}
