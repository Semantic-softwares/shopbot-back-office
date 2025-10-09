import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { RestockService, Restock } from '../../../../../shared/services/restock.service';
import { ProductService } from '../../../../../shared/services/product.service';
import { SuppliersService } from '../../suppliers/services/suppliers.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, startWith, map } from 'rxjs';

@Component({
  selector: 'app-add-restock',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    RouterModule,
  ],
  templateUrl: './add-restock.component.html',
  styleUrls: ['../restock.component.scss']
})
export class RestockComponent implements OnInit {
  public storeStore = inject(StoreStore);
  public isSubmitting = signal(false);
  public isEditMode = signal(false);
  public restockId = signal<string | null>(null);
  public currentRestock = signal<Restock | null>(null);
  
  // Computed property for currency
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');

  restockForm: FormGroup;
  filteredProducts$: Observable<any[]> = of([]);
  
  // Reactive form value signal
  formValue = signal<any>({});

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
    private fb: FormBuilder,
    private restockService: RestockService,
    private productService: ProductService,
    private suppliersService: SuppliersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.restockForm = this.fb.group({
      supplier: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      orderNumber: [''],
      invoiceDate: [new Date(), Validators.required],
      items: this.fb.array([]),
      discount: [0],
      vat: [0],
      amountPaid: [0],
      paymentMethod: ['cash'],
      notes: ['']
    });

    // Subscribe to form changes and update the signal
    this.restockForm.valueChanges.pipe(
      startWith(this.restockForm.value)
    ).subscribe(value => {
      this.formValue.set(value);
    });
  }

  goToRestock() {
    this.router.navigate(['/menu/erp/inventories/restock']);
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.restockId.set(id);
      this.loadRestockForEdit(id);
    } else {
      this.generateInvoiceNumber();
    }
  }

  private loadRestockForEdit(id: string): void {
    this.restockService.findOne(id).subscribe({
      next: (restock) => {
        this.currentRestock.set(restock);
        this.populateFormWithRestock(restock);
      },
      error: (error) => {
        console.error('Error loading restock:', error);
        this.router.navigate(['/menu/erp/inventories/restock']);
      }
    });
  }

  private populateFormWithRestock(restock: Restock): void {
    // Populate main form fields
    this.restockForm.patchValue({
      supplier: restock.supplier,
      invoiceNumber: restock.invoiceNumber,
      orderNumber: restock.orderNumber,
      invoiceDate: new Date(restock.invoiceDate),
      discount: restock.discount || 0,
      vat: restock.vat || 0,
      amountPaid: restock.amountPaid || 0,
      paymentMethod: restock.paymentMethod || 'cash',
      notes: restock.notes || ''
    });

    // Clear existing items and populate with restock items
    const itemsArray = this.itemsArray;
    itemsArray.clear();

    restock.items.forEach(item => {
      // Create product object with available data
      const productData = {
        _id: typeof item.product === 'string' ? item.product : (item.product as any)?._id,
        name: item.productName,
        sku: (item.product as any)?.sku || '',
        photos: (item.product as any)?.photos || [],
        price: item.sellingPrice,
        costPrice: item.costPrice
      };

      const itemGroup = this.fb.group({
        product: [productData],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        costPrice: [item.costPrice, [Validators.required, Validators.min(0)]],
        sellingPrice: [item.sellingPrice, [Validators.required, Validators.min(0)]],
        expiryDate: [item.expiryDate ? new Date(item.expiryDate) : null]
      });

      // Subscribe to changes in this item group to trigger calculations
      itemGroup.valueChanges.subscribe(() => {
        this.formValue.set(this.restockForm.value);
      });

      itemsArray.push(itemGroup);
    });

    // Trigger form value update
    this.formValue.set(this.restockForm.value);
  }

  get itemsArray(): FormArray {
    return this.restockForm.get('items') as FormArray;
  }

  generateInvoiceNumber(): void {
    const timestamp = Date.now();
    const invoiceNumber = `INV-${timestamp}`;
    this.restockForm.patchValue({ invoiceNumber });
  }

  onSearchInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    
    if (query.length < 2) {
      this.filteredProducts$ = of([]);
      return;
    }

    const excludeIds = this.itemsArray.value.map((item: any) => item.product._id);
    
    this.filteredProducts$ = this.productService.searchForAutocomplete(
      this.storeStore.selectedStore()?._id || '',
      query,
      excludeIds
    );
  }

  displayProduct(product: any): string {
    return product ? product.name : '';
  }

  addProductToRestock(product: any): void {
    const itemGroup = this.fb.group({
      product: [product],
      quantity: [1, [Validators.required, Validators.min(1)]],
      costPrice: [product.costPrice || 0, [Validators.required, Validators.min(0)]],
      sellingPrice: [product.price || 0, [Validators.required, Validators.min(0)]],
      expiryDate: [product.expiryDate || null]
    });

    // Subscribe to changes in this item group to trigger calculations
    itemGroup.valueChanges.subscribe(() => {
      this.formValue.set(this.restockForm.value);
    });

    this.itemsArray.push(itemGroup);
    
    // Trigger immediate update
    this.formValue.set(this.restockForm.value);
    
    // Clear search input
    const searchInput = document.querySelector('input[matInput]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
  }

  removeItem(index: number): void {
    this.itemsArray.removeAt(index);
    // Trigger update after removal
    this.formValue.set(this.restockForm.value);
  }

  subtotal = computed(() => {
    const formValue = this.formValue();
    const items = formValue.items || [];
    return items.reduce((total: number, item: any) => {
      return total + (item.quantity || 0) * (item.costPrice || 0);
    }, 0);
  });

  discountAmount = computed(() => {
    const formValue = this.formValue();
    const discount = formValue.discount || 0;
    return (this.subtotal() * discount) / 100;
  });

  vatAmount = computed(() => {
    const formValue = this.formValue();
    const vat = formValue.vat || 0;
    const afterDiscount = this.subtotal() - this.discountAmount();
    return (afterDiscount * vat) / 100;
  });

  total = computed(() => {
    return this.subtotal() - this.discountAmount() + this.vatAmount();
  });

  onSubmit(): void {
    if (this.restockForm.valid && this.itemsArray.length > 0) {
      this.isSubmitting.set(true);
      
      const formValue = this.restockForm.value;
      const restockData = {
        ...formValue,
        subtotal: this.subtotal(),
        discountAmount: this.discountAmount(),
        vatAmount: this.vatAmount(),
        total: this.total(),
        outstandingBalance: this.total() - (formValue.amountPaid || 0),
        status: 'completed',
        items: formValue.items.map((item: any) => ({
          product: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          expiryDate: item.expiryDate,
          totalCost: item.quantity * item.costPrice
        }))
      };

      const operation = this.isEditMode() 
        ? this.restockService.update(this.restockId()!, restockData)
        : this.restockService.create(restockData);

      operation.subscribe({
        next: (response) => {
          console.log(`Restock ${this.isEditMode() ? 'updated' : 'saved'}:`, response);
          this.goToRestock();
        },
        error: (error) => {
          console.error(`Error ${this.isEditMode() ? 'updating' : 'saving'} restock:`, error);
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
