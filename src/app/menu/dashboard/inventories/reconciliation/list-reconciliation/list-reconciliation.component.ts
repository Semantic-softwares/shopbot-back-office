import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReconciliationService, Reconciliation } from '../../../../../shared/services/reconciliation.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-list-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatChipsModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './list-reconciliation.component.html',
  styles: [`
    .mat-mdc-table {
      width: 100%;
    }
    
    .mat-mdc-chip-set {
      margin: 0;
    }
    
    .mat-mdc-chip {
      font-size: 0.75rem;
      height: auto;
      padding: 4px 8px;
    }
  `]
})
export class ListReconciliationComponent implements OnInit {
  public storeStore = inject(StoreStore);
  private router = inject(Router);

  // Computed properties
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');

  displayedColumns: string[] = ['name', 'status', 'actions'];

  filters = {
    page: 1,
    limit: 25,
    status: '',
    type: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  };

  public reconciliations = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      page: this.filters.page,
      limit: this.filters.limit,
      status: this.filters.status,
      type: this.filters.type,
      dateFrom: this.filters.dateFrom ? this.filters.dateFrom.toISOString().split('T')[0] : undefined,
      dateTo: this.filters.dateTo ? this.filters.dateTo.toISOString().split('T')[0] : undefined,
    }),
    stream: ({ params }) => {
      if (!params.storeId) {
        return new Observable<any>(observer => {
          observer.next({ data: [], pagination: {} });
          observer.complete();
        });
      }
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
      );
      return this.reconciliationService.findAll(cleanParams);
    },
  });

  public stats = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) {
        return new Observable<any>(observer => {
          observer.next({});
          observer.complete();
        });
      }
      return this.reconciliationService.getStats();
    },
  });

  constructor(
    private reconciliationService: ReconciliationService
  ) {}

  ngOnInit(): void {
    // Component initialized
  }

  onFilterChange(): void {
    this.reconciliations.reload();
  }

  onPageChange(event: any): void {
    this.filters.page = event.pageIndex + 1;
    this.filters.limit = event.pageSize;
    this.reconciliations.reload();
  }

  getProgressPercentage(reconciliation: Reconciliation): number {
    if (reconciliation.totalProducts === 0) return 0;
    return (reconciliation.countedProducts / reconciliation.totalProducts) * 100;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'full_inventory':
        return 'bg-purple-100 text-purple-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'cycle_count':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'full_inventory':
        return 'Full Inventory';
      case 'partial':
        return 'Partial';
      case 'cycle_count':
        return 'Cycle Count';
      default:
        return type;
    }
  }

  deleteReconciliation(id: string): void {
    if (confirm('Are you sure you want to delete this reconciliation? This action cannot be undone.')) {
      this.reconciliationService.delete(id).subscribe(() => {
        this.reconciliations.reload();
      });
    }
  }
}
