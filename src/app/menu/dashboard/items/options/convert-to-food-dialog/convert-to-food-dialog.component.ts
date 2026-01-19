import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { rxResource } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../../shared/services/category.service';
import { ProductService } from '../../../../../shared/services/product.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { OptionItem } from '../../../../../shared/models';

@Component({
  selector: 'app-convert-to-food-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    CurrencyMaskModule,
  ],
  templateUrl: './convert-to-food-dialog.component.html',
  styleUrl: './convert-to-food-dialog.component.scss',
})
export class ConvertToFoodDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConvertToFoodDialogComponent>);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  public storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);
  public data: { option: OptionItem } = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  form!: FormGroup;

  // Load menus (product categories) using rxResource
  menus = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) => this.categoryService.getStoreMenus(params.storeId!),
  });

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.form = this.fb.group({
      menuId: ['', Validators.required],
      productName: [this.data.option.name, Validators.required],
      sellingPrice: [this.data.option.price, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      quantity: [this.data.option.quantity || 1, [Validators.required, Validators.min(1)]],
      active: [true, Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);

    const storeId = this.storeStore.selectedStore()?._id;
    const sellingPrice = parseFloat(this.form.get('sellingPrice')?.value) || 0;
    const costPrice = parseFloat(this.form.get('costPrice')?.value) || 0;
    const foodData = {
      name: this.form.get('productName')?.value,
      price: sellingPrice,
      costPrice: costPrice,
      quantity: this.form.get('quantity')?.value,
      menu: this.form.get('menuId')?.value,
      store: storeId,
      active: this.form.get('active')?.value,
      profit: sellingPrice - costPrice,
      initialStock: 0,
      criticalStockLevel: 0,
      qty: this.form.get('quantity')?.value,
    };

    this.productService.convertOptionToFood(foodData).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error converting option to food:', error);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
