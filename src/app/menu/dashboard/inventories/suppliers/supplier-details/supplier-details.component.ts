import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SuppliersService } from '../../../../../shared/services/suppliers.service';
import { Supplier } from '../../../../../shared/models/supplier.model';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supplier-details.component.html',
  styleUrl: './supplier-details.component.scss'
})
export class SupplierDetailsComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public storeStore = inject(StoreStore);

  supplier = signal<Supplier | null>(null);
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
    
    if (confirm(`Are you sure you want to delete supplier "${currentSupplier.name}"?`)) {
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

  goBack() {
    this.router.navigate(['/menu/erp/inventory/suppliers']);
  }

  hasAddressInfo(): boolean {
    const address = this.supplier()?.address;
    if (!address) return false;
    
    return !!(address.street || address.city || address.state || address.country || address.postalCode);
  }
}
