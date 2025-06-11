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
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductService } from '../../../shared/services/product.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from "../../../shared/components/no-record/no-record.component";
import { Product } from '../../../shared/models';
import { CategoryService } from '../../../shared/services/category.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    NoRecordComponent
],
})
export class ProductsComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  public storeStore = inject(StoreStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public searchTerm = signal('');
  public selectedCategory = signal('all');
  public displayedColumns: string[] = [
    'photo',
    'name',
    'category',
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
    this.router.navigate(['/dashboard/items/create-product']);
  }

  editProduct(product: Product) {
    console.log('Edit product:', product);
    // TODO: Implement edit functionality
  }

  onEditProduct(productId: string) {
    this.router.navigate(['/dashboard/items/edit-product', productId]);
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
}
