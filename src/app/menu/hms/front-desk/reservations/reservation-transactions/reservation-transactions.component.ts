import { Component, input, inject, computed, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { Reservation } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-reservation-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    NoRecordComponent
  ],
  templateUrl: './reservation-transactions.component.html',
  styleUrl: './reservation-transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationTransactionsComponent {
  reservation = input.required<Reservation>();

  private storeStore = inject(StoreStore);
  private reservationService = inject(ReservationService);

  // Signals
  private reservationId = computed(() => this.reservation()._id);
  private storeId = computed(() => this.storeStore.selectedStore()?._id || '');

  // Resource for loading transactions
  public transactionsResource = rxResource({
    params: () => ({ 
      storeId: this.storeId(), 
      reservationId: this.reservationId() 
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.reservationId) {
        return of([]);
      }
      return this.reservationService.getReservationTransactions(
        params.storeId,
        params.reservationId
      );
    }
  });

  // Effect to reload transactions when reservation changes
  constructor() {
    effect(() => {
      // Trigger when reservation input changes
      if (this.reservation()) {
        // Reload transactions resource
        this.transactionsResource.reload();
      }
    });
  }

  // Computed signals
  transactions = computed(() => this.transactionsResource.value() || []);
  isLoading = computed(() => this.transactionsResource.isLoading());
  error = computed(() => this.transactionsResource.error());

  displayedColumns: string[] = ['date', 'amount', 'type', 'method', 'notes', 'balance'];

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'refund':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCurrencyFormat(): string {
    return this.storeStore.selectedStore()?.currency || '$';
  }
}
