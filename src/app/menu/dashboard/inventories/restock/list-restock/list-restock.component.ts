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
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestockService, Restock } from '../../../../../shared/services/restock.service';
import { SuppliersService } from '../../suppliers/services/suppliers.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-list-restock',
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
    RouterModule,
    FormsModule,
  ],
  templateUrl: './list-restock.component.html',
  styleUrls: ['./list-restock.component.scss']
})
export class ListRestockComponent implements OnInit {
  displayedColumns: string[] = ['invoiceNumber', 'date', 'supplier', 'items', 'total', 'status', 'actions'];
  
  public storeStore = inject(StoreStore);
  
  // Computed property for currency
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');
  
  filters = {
    status: '',
    supplier: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    page: 1,
    limit: 10
  };

  public restocks = rxResource({
    params: () => ({
      ...this.filters,
      dateFrom: this.filters.dateFrom?.toISOString().split('T')[0] || '',
      dateTo: this.filters.dateTo?.toISOString().split('T')[0] || ''
    }),
    stream: ({ params }) => this.restockService.findAll(params),
  });

  public suppliers = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) {
        return new Observable<any[]>(observer => {
          observer.next([]);
          observer.complete();
        });
      }
      return this.suppliersService.getSuppliersByStore(params.storeId);
    },
  });

  constructor(
    private restockService: RestockService,
    private suppliersService: SuppliersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRestocks();
  }

  loadRestocks(): void {
    this.restocks.reload();
  }

  onPageChange(event: any): void {
    this.filters.page = event.pageIndex + 1;
    this.filters.limit = event.pageSize;
    this.loadRestocks();
  }

  viewDetails(id: string): void {
    this.router.navigate(['dashboard', 'inventory', 'restock', 'details', id]);
  }

  editRestock(id: string): void {
    this.router.navigate(['dashboard', 'inventory', 'restock', 'edit', id]);
  }

  deleteRestock(id: string): void {
    if (confirm('Are you sure you want to delete this restock record?')) {
      this.restockService.delete(id).subscribe(() => {
        this.loadRestocks();
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
