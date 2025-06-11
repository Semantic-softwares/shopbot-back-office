import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../shared/services/category.service';
import { ProductService } from '../../../../shared/services/product.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { StationsService } from '../../../../shared/services/station.service';
import { Product } from '../../../../shared/models';
import { MatDialog } from '@angular/material/dialog';
import { CategoryDialogComponent } from '../../categories/category-dialog/category-dialog.component';
import { AddVariantsListComponent } from '../modals/add-variants-list/add-variants-list.component';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';

interface ProductUnit {
  value: string;
  viewValue: string;
}

interface ImagePreview {
  url: string;
  file: File;
}

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    RouterModule,
    NoRecordComponent,
  ],
})
export class CreateProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private stationService = inject(StationsService);
  private categoryService = inject(CategoryService);
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public isSubmitting = signal(false);
  public categories = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.categoryService.getStoreMenus(params.storeId!),
  });

  public stations = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.stationService.getStations(params.storeId!),
  });
  productForm: FormGroup;
  newCategory: string = '';

  productUnits: ProductUnit[] = [
    { value: 'slice', viewValue: 'Slice' },
    { value: 'crate', viewValue: 'Crate' },
    { value: 'amps', viewValue: 'Amps' },
    { value: 'plates', viewValue: 'Plates' },
    { value: 'trays', viewValue: 'Trays' },
  ];

  stockLevelAlertOptions = [
    { value: true, viewValue: 'Yes' },
    { value: false, viewValue: 'No' },
  ];

  private price = signal<number>(0);
  private costPrice = signal<number>(0);
  profit = computed(() => this.price() - this.costPrice());

  selectedImages: ImagePreview[] = [];
  selectedVariants: any[] = [];

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      menu: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      units: ['', Validators.required],
      store: [this.storeStore.selectedStore()?._id, Validators.required],
      station: [''],
      price: ['', Validators.required],
      costPrice: ['', Validators.required],
      quantity: ['', Validators.required],
      initialStock: ['', Validators.required],
      criticalStock: ['', Validators.required],
      sku: [''],
      barcode: [''],
      stockLevelAlert: [false],
      inStock: [''],
      images: [[]],
      profit: [0],
      active: [true], // Add active field with default true
      options: [[]], // Add variants form control
    });

    // Subscribe to price changes
    this.productForm.get('price')?.valueChanges.subscribe((value) => {
      this.price.set(Number(value) || 0);
      this.updateProfit();
    });

    this.productForm.get('costPrice')?.valueChanges.subscribe((value) => {
      this.costPrice.set(Number(value) || 0);
      this.updateProfit();
    });
  }

  private updateProfit() {
    const profit = this.profit();
    this.productForm.patchValue({ profit }, { emitEvent: false });
  }

  addCategory() {
    // if (this.newCategory && !this.categories.includes(this.newCategory)) {
    //   this.categories.push(this.newCategory);
    //   this.newCategory = '';
    // }
  }

  openCategoryModal(event: Event) {
    // Prevent select from closing
    event.stopPropagation();
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Category created:', result);
        this.productForm.patchValue({ menu: result._id });
        this.categories.reload();
      }
    });
  }

  openVariantsDialog(): void {
    const dialogRef = this.dialog.open(AddVariantsListComponent, {
      width: '500px',
      data: { selectedVariants: this.selectedVariants.map((v) => v._id) },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedVariants = result;
        this.productForm.patchValue({ options: result.map((v: any) => v._id) });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const maxFiles = 5;

      if (this.selectedImages.length + files.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} images`);
        return;
      }

      files.forEach((file) => {
        if (file.type.match(/image\/*/) && file.size < 5000000) {
          // 5MB limit
          const reader = new FileReader();
          reader.onload = (e) => {
            this.selectedImages.push({
              url: e.target?.result as string,
              file: file,
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  public isEditMode = signal(false);
  public productId = signal<string | null>(null);
  public pageTitle = computed(() =>
    this.isEditMode() ? 'Edit Product' : 'Create Product'
  );
  public submitButtonText = computed(() =>
    this.isEditMode() ? 'Update Product' : 'Create Product'
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(id);
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string) {
    this.productService.getProduct(id).subscribe({
      next: (product: Product) => {
        this.productForm.patchValue({
          menu: product.menu,
          name: product.name,
          description: product.description,
          units: product.units,
          station: product.station,
          price: product.price,
          costPrice: product.costPrice,
          quantity: product.quantity,
          initialStock: product.initialStock,
          criticalStock: product.criticalStockLevel,
          sku: product.sku,
          barcode: product.barcode,
          stockLevelAlert: product.stockLevelAlert,
          inStock: product.activate,
        });

        if (product.photos?.length) {
          this.selectedImages = product.photos.map((photo) => ({
            url: photo,
            file: null as any, // We don't need the file object for existing images
          }));
        }

        if (product.options?.length) {
          this.selectedVariants = product.options;
          this.productForm.patchValue({
            options: product.options.map((v) => v._id),
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Error loading product', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  public async onSubmit() {
    if (this.productForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.productForm.getRawValue();
      const productId = this.productId();

      try {
        // Save product data
        const savedProduct = await firstValueFrom(
          this.isEditMode()
            ? this.productService.saveProduct(formValue, productId!)
            : this.productService.addProduct(formValue)
        );

        // Upload images if any
        const newImages = this.selectedImages.filter(img => img.file);
        if (newImages.length > 0) {
          const formData = new FormData();
          newImages.forEach(image => {
            formData.append('files', image.file);
          });

          await firstValueFrom(
            this.productService.uploadPhoto(
              formData, 
              this.isEditMode() ? productId! : savedProduct._id
            )
          );
        }

        this.showSuccessMessage();
      } catch (error) {
        console.error('Error saving product:', error);
        this.snackBar.open(
          `Error ${this.isEditMode() ? 'updating' : 'creating'} product`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }
        );
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  private showSuccessMessage() {
    this.snackBar.open(
      `Product ${this.isEditMode() ? 'updated' : 'created'} successfully`,
      'Close',
      {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }
    );
    if (!this.isEditMode()) {
      this.resetForm();
    } else {
      this.router.navigate(['/dashboard/items/products']);
    }
    this.isSubmitting.set(false);
  }

  private resetForm() {
    this.productForm.reset({
      store: this.storeStore.selectedStore()?._id,
      stockLevelAlert: false,
      images: [],
    });
    this.selectedImages = [];
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.get(key);
      control?.setErrors(null);
      control?.markAsUntouched();
    });
  }

  removeVariant(variantToRemove: any) {
    this.selectedVariants = this.selectedVariants.filter(v => v._id !== variantToRemove._id);
    this.productForm.patchValue({
      options: this.selectedVariants.map(v => v._id)
    });
  }
}
