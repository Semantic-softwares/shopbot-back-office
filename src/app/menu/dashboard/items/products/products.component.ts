import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductService } from '../../../../shared/services/product.service';
import { StationsService } from '../../../../shared/services/station.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from "../../../../shared/components/no-record/no-record.component";
import { Product, Station } from '../../../../shared/models';
import { CategoryService } from '../../../../shared/services/category.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatChipsModule,
    PageHeaderComponent,
    NoRecordComponent
],
})
export class ProductsComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private stationsService = inject(StationsService);
  public storeStore = inject(StoreStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public searchTerm = signal<string>('');
  public selectedCategory = signal<string>('all');
  public selectedIds = signal<Set<string>>(new Set());
  public bulkUpdating = signal<boolean>(false);

  public displayedColumns: string[] = [
    'select',
    'photo',
    'name',
    'category',
    'station',
    'price',
    'cost',
    'initialStock',
    'criticalStockLevel',
    'qty',
    'active',
    'actions'
  ];

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.productService.getStoreProducts(params.storeId!)
  });

 
  public categories = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.categoryService.getStoreMenus(params.storeId!)
  });

  public stations = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.stationsService.getStoreStations(params.storeId!)
  });

  public selectedCount = computed(() => this.selectedIds().size);

  public isAllSelected = computed(() => {
    const products = this.filteredProducts();
    return products.length > 0 && this.selectedIds().size === products.length;
  });

  public isIndeterminate = computed(() => {
    const size = this.selectedIds().size;
    return size > 0 && size < this.filteredProducts().length;
  });

    public filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const categoryId = this.selectedCategory();
    
    return this.dataSource.value()?.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(term);
      const matchesCategory = categoryId === 'all' || product?.menu?._id === categoryId;
      return matchesSearch && matchesCategory;
    }) ?? [];
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Product>;


  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onCategoryChange(category: string) {
    this.selectedCategory.set(category);
  }


  addItem() {
    this.router.navigate(['/menu/erp/items/create-product']);
  }

  editProduct(product: Product) {
    console.log('Edit product:', product);
    // TODO: Implement edit functionality
  }

  onEditProduct(productId: string) {
    this.router.navigate(['/menu/erp/items/edit-product', productId]);
  }

  deleteProduct(product: Product) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        message: `Are you sure you want to delete ${product.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productService.deleteProduct(product._id).subscribe({
          next: () => {
            console.log('Product deleted successfully');
            // Refresh the data source after deletion
            this.dataSource.reload();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
          }
        });
      }
    })
  }

  toggleProductStatus(product: Product) {
    const updatedProduct = { active: !product.active };
    this.productService.saveProduct(updatedProduct, product._id).subscribe({
      next: () => {
        this.snackBar.open('Product status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        // this.dataSource.reload();
      },
      error: () => {
        this.snackBar.open('Error updating product status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  reloadProducts(): void {
    this.dataSource.reload();
  }

  toggleSelection(productId: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    this.selectedIds.set(current);
  }

  isSelected(productId: string): boolean {
    return this.selectedIds().has(productId);
  }

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const allIds = this.filteredProducts().map((p: Product) => p._id);
      this.selectedIds.set(new Set(allIds));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  bulkAssignStation(stationId: string): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.bulkUpdating.set(true);
    const updates = ids.map(id =>
      this.productService.saveProduct({ station: stationId }, id)
    );

    forkJoin(updates).subscribe({
      next: () => {
        this.snackBar.open(
          `Station updated for ${ids.length} product(s)`,
          'Close',
          { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' }
        );
        this.clearSelection();
        this.dataSource.reload();
        this.bulkUpdating.set(false);
      },
      error: () => {
        this.snackBar.open(
          'Error updating stations. Please try again.',
          'Close',
          { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' }
        );
        this.bulkUpdating.set(false);
      }
    });
  }

  bulkRemoveStation(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.bulkUpdating.set(true);
    const updates = ids.map(id =>
      this.productService.saveProduct({ station: null }, id)
    );

    forkJoin(updates).subscribe({
      next: () => {
        this.snackBar.open(
          `Station removed from ${ids.length} product(s)`,
          'Close',
          { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' }
        );
        this.clearSelection();
        this.dataSource.reload();
        this.bulkUpdating.set(false);
      },
      error: () => {
        this.snackBar.open(
          'Error removing stations. Please try again.',
          'Close',
          { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' }
        );
        this.bulkUpdating.set(false);
      }
    });
  }

  getStationName(product: Product): string {
    if (!product.station) return '—';
    if (typeof product.station === 'string') {
      const match = this.stations.value()?.find((s: Station) => s._id === product.station);
      return match?.name ?? '—';
    }
    return product.station?.name ?? '—';
  }
}
