import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { EMPTY } from 'rxjs';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import {
  LedgerEntryType,
  LedgerEntryView,
} from '../../../../../../shared/models/estate.model';
import { LedgerApiService } from '../../../../../../shared/services/ledger-api.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { LeaseDetailPageComponent } from '../../lease-detail-page.component';

@Component({
  selector: 'app-lease-activities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    NoRecordComponent,
  ],
  templateUrl: './activities.component.html',
})
export class LeaseActivitiesComponent {
  private readonly parent = inject(LeaseDetailPageComponent);
  private readonly ledgerApiService = inject(LedgerApiService);
  private readonly storeStore = inject(StoreStore);

  readonly displayedColumns: string[] = [
    'date',
    'type',
    'reference',
    'description',
    'debit',
    'credit',
    'balance',
  ];

  readonly ledgerResource = rxResource({
    params: () => ({
      leaseId: this.parent.leaseId(),
      storeId: this.storeStore.selectedStore()?._id || '',
    }),
    stream: ({ params }) => {
      if (!params.leaseId || !params.storeId) return EMPTY;
      return this.ledgerApiService.getLeaseLedger(params.leaseId, params.storeId);
    },
  });

  readonly entries = computed(
    () => this.ledgerResource.value()?.data?.entries || [],
  );

  readonly currency = computed(
    () => this.storeStore.selectedStore()?.currencyCode || 'NGN',
  );

  typeLabel(type: LedgerEntryType): string {
    switch (type) {
      case LedgerEntryType.INVOICE:
        return 'Invoice';
      case LedgerEntryType.PAYMENT:
        return 'Payment';
      case LedgerEntryType.LATE_FEE:
        return 'Late Fee';
      case LedgerEntryType.VOID:
        return 'Void';
      case LedgerEntryType.REVERSAL:
        return 'Reversal';
      default:
        return type;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  reference(entry: LedgerEntryView): string {
    return entry.referenceNumber || '--';
  }
}
