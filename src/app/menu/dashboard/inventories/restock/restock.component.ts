import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router } from '@angular/router';

import { ProductService } from '../../../../shared/services/product.service';
import { SuppliersService } from '../suppliers/services/suppliers.service';
import { SubscriptionService } from '../../../../services/subscription.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { Product } from '../../../../shared/models/product.model';
import { Supplier } from '../suppliers/interfaces/supplier.interface';
import { RestockItem, RestockFormData, RestockResult } from './interfaces/restock.interface';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-restock',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatAutocompleteModule
  ],
  templateUrl: './restock.component.html',
  styleUrl: './restock.component.scss'
})
export class RestockComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private suppliersService = inject(SuppliersService);
  private subscriptionService = inject(SubscriptionService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private storeStore = inject(StoreStore);

  // Computed properties
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');

  restockForm: FormGroup;
  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  submitting = signal(false);
  
  // Autocomplete related properties
  searchControl = this.fb.control('');
  filteredProducts$: Observable<Product[]> = of([]);

  displayedColumns: string[] = ['name', 'quantity', 'costPrice', 'sellingPrice', 'expiryDate', 'usePricesAcrossStores', 'actions'];

  constructor() {
    this.restockForm = this.fb.group({
      supplierId: ['', Validators.required],
      invoiceReceiptNumber: [''],
      orderNumber: [''],
      invoiceReceiptDate: [new Date(), Validators.required],
      items: this.fb.array([])
    });

    // Setup autocomplete
    this.setupAutocomplete();
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  setupAutocomplete() {
    this.filteredProducts$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.searchProducts(value);
        }
        return of([]);
      })
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    const storeId = this.subscriptionService.currentStoreId();
    if (!storeId) return of([]);

    // Get IDs of products already added to prevent duplicates
    const excludeIds = this.itemsFormArray.controls.map(control => 
      control.get('productId')?.value
    ).filter(id => id);

    return this.productService.searchForAutocomplete(storeId, query, excludeIds);
  }

  get itemsFormArray(): FormArray {
    return this.restockForm.get('items') as FormArray;
  }

  loadSuppliers() {
    this.loading.set(true);
    const storeId = this.subscriptionService.currentStoreId();
    
    if (!storeId) {
      this.snackBar.open('Please select a store first', 'Close', { duration: 3000 });
      this.loading.set(false);
      return;
    }

    this.suppliersService.getSuppliersByStore(storeId).subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.snackBar.open('Error loading suppliers', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadProducts() {
    // This method is no longer needed as we use autocomplete search
    // Products are loaded on-demand via search
  }

  displayFn(product: Product): string {
    return product && product.name ? product.name : '';
  }

  onProductSelected(product: Product) {
    this.addProductToRestock(product);
    this.searchControl.setValue(''); // Clear the search field
  }

  addProductToRestock(product: Product) {
    const itemGroup = this.fb.group({
      productId: [product._id, Validators.required],
      productName: [product.name, Validators.required],
      currentQuantity: [product.qty || 0],
      quantity: [0, [Validators.required, Validators.min(1)]],
      costPrice: [product.costPrice || 0, [Validators.required, Validators.min(0)]],
      sellingPrice: [product.price, [Validators.required, Validators.min(0)]],
      expiryDate: [product.expiryDate || null],
      usesPricesAcrossStores: [false]
    });

    this.itemsFormArray.push(itemGroup);
  }

  removeRestockItem(index: number) {
    this.itemsFormArray.removeAt(index);
  }

  onSubmit() {
    if (this.restockForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    const formData: RestockFormData = this.restockForm.value;
    
    // Transform the form data for the API
    const restockData = formData.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      expiryDate: item.expiryDate
    }));

    this.productService.bulkRestock(restockData).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.showRestockResults(response.results);
        
        // Reset form and reload products
        this.restockForm.reset();
        this.itemsFormArray.clear();
        this.restockForm.patchValue({
          invoiceReceiptDate: new Date()
        });
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error during restock:', error);
        this.submitting.set(false);
        this.snackBar.open('Error during restock operation', 'Close', { duration: 3000 });
      }
    });
  }

  showRestockResults(results: RestockResult[]) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    let message = `Restock completed: ${successful} successful`;
    if (failed > 0) {
      message += `, ${failed} failed`;
    }
    
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: failed > 0 ? ['warn-snackbar'] : ['success-snackbar']
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/inventory']);
  }
}
