import { MatCardModule } from '@angular/material/card';
import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { TrPipe } from '../../../../../shared/i18n/tr.pipe';
import { PurchasingService } from '../../../../../shared/services/purchasing.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SuppliersService } from '../../../../../shared/services/suppliers.service';
import { Supplier } from '../../../../../shared/models/supplier.model';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [MatCardModule, CommonModule, RouterModule, PageHeaderComponent, TrPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './supplier-details.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './supplier-details.component.scss'
})
export class SupplierDetailsComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public storeStore = inject(StoreStore);

  private purchasing = inject(PurchasingService);
  supplier = signal<Supplier | null>(null);
  private productsRes = rxResource({
    params: () => ({ s: this.storeStore.selectedStore()?._id, id: this.supplier()?._id }),
    stream: ({ params }) => (params.s && params.id ? this.purchasing.links(params.s, { supplier: params.id }) : of([])),
  });
  products = computed(() => (this.productsRes.hasValue() ? this.productsRes.value() : []));
  loading = signal(false);
  error = signal<string | null>(null);
  
  supplierId!: string;

  constructor() {}

  ngOnInit() {
    this.supplierId = this.route.snapshot.paramMap.get('id')!;
    if (this.supplierId) {
      this.loadSupplier();
    } else {
      this.router.navigate(['/menu/erp/inventory/suppliers']);
    }
  }

  loadSupplier() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.loading.set(true);
    this.error.set(null);
    
    this.suppliersService.getSupplier(this.supplierId, storeId).subscribe({
      next: (supplier) => {
        this.supplier.set(supplier);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load supplier details');
        this.loading.set(false);
        console.error('Error loading supplier:', error);
      }
    });
  }

  editSupplier() {
    this.router.navigate(['/menu/erp/inventory/suppliers/edit', this.supplierId]);
  }

  toggleSupplierStatus() {
    const currentSupplier = this.supplier();
    if (!currentSupplier) return;
    
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    
    this.suppliersService.toggleSupplierStatus(this.supplierId, storeId).subscribe({
      next: (updatedSupplier) => {
        this.supplier.set(updatedSupplier);
      },
      error: (error) => {
        console.error('Error toggling supplier status:', error);
        this.error.set('Failed to update supplier status');
      }
    });
  }

  deleteSupplier() {
    const currentSupplier = this.supplier();
    if (!currentSupplier) return;
    
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    
    if (confirm($localize`Are you sure you want to delete supplier "${currentSupplier.name}"?`)) {
      this.suppliersService.deleteSupplier(this.supplierId, storeId).subscribe({
        next: () => {
          this.router.navigate(['/menu/erp/inventory/suppliers']);
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          this.error.set('Failed to delete supplier');
        }
      });
    }
  }

  newOrder() {
    this.router.navigate(['/menu/erp/inventory/purchasing/new']);
  }

  addressLine(): string {
    const a = this.supplier()?.address;
    return a ? [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ') : '';
  }

  goBack() {
    this.router.navigate(['/menu/erp/inventory/suppliers']);
  }

  hasAddressInfo(): boolean {
    const address = this.supplier()?.address;
    if (!address) return false;
    
    return !!(address.street || address.city || address.state || address.country || address.postalCode);
  }
}
