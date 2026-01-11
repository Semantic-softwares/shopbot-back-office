import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { Product, Option } from '../../models/product.model';
import { ProductsStore } from '../../stores/product.store';
import { VariantStore } from '../../stores/variant.store';
import { StoreStore } from '../../stores/store.store';

export interface ProductOptionsDialogData {
  product: Product & { activityDateTime?: Date };
  isEditing?: boolean;
}

export interface ProductOptionsDialogResult extends Product {
  activityDateTime?: Date;
}

@Component({
  selector: 'app-product-options',
  templateUrl: './product-options.component.html',
  styleUrls: ['./product-options.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    CurrencyPipe,
    TitleCasePipe,
  ],
})
export class ProductOptionsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ProductOptionsComponent>);
  private dialogData: ProductOptionsDialogData = inject(MAT_DIALOG_DATA);

  public isActivity = computed(() => this.storeStore.selectedStore()?.category === 'Activities');
  public product: Product & { activityDateTime?: Date } = this.dialogData.product;
  public isEditing = signal<boolean>(this.dialogData?.isEditing ?? false);
  public productStore = inject(ProductsStore);
  public variantStore = inject(VariantStore);
  public storeStore = inject(StoreStore);
  public quantity = signal<number>(this.product?.quantity || 1);
  public minDate = signal(new Date());
  public activityForm = new FormControl();

  variant = effect(() => {
    console.log("Selected variants updated:", this.variantStore.selectedVariants());
    this.variantStore.selectedVariants();
  });

  public updateAreAllVariantsValid = computed(() => {
    const variants = this.variantStore.selectedVariants();
    return variants.every((variant: Option) => !variant.invalid);
  });

  ngOnInit() {
    // If editing, bind product.options to variantStore.selectedVariants
    if (this.isEditing() && this.product.options && this.product.options.length > 0) {
      const clonedOptions = JSON.parse(JSON.stringify(this.product.options));
      this.variantStore.updateSelectedVariants(clonedOptions);
    }

    this.activityForm.valueChanges.subscribe(value => {
      if (value) {
        this.product = {
          ...this.product,
          activityDateTime: value
        };
      }
    });
  }

  protected closeModal(): void {
    this.variant.destroy();
    this.dialogRef.close();
  }

  protected submit(): void {
    if (this.isActivity() && !this.product.activityDateTime) {
      alert('Please select activity date and time');
      return;
    }

    this.variant.destroy();
    const variants = this.variantStore.selectedVariants();
    
    const filteredVariants = variants.map((item: Option) => ({
      ...item,
      options: item.options.filter((option) => option.selected),
    }));
    this.product.quantity = this.quantity();
    
    this.dialogRef.close({
      ...this.product,
      options: filteredVariants,
      activityDateTime: this.isActivity() ? this.product.activityDateTime : undefined
    } as ProductOptionsDialogResult);
  }

  protected updateQuantityTotal(side: 'up' | 'down'): void {
    if (side === 'up') {
      this.quantity.update((qty) => qty + 1);
    } else {
      this.quantity.update((qty) => Math.max(1, qty - 1));
    }
  }

  protected increase(variantIndex: number, optionIndex: number): void {
    const variants = this.variantStore.selectedVariants();

    const updatedOption = {
      ...variants[variantIndex].options[optionIndex],
      quantity: variants[variantIndex].options[optionIndex].quantity + 1
    };

    const updatedOptions = [
      ...variants[variantIndex].options.slice(0, optionIndex),
      updatedOption,
      ...variants[variantIndex].options.slice(optionIndex + 1)
    ];

    const updatedVariant = {
      ...variants[variantIndex],
      options: updatedOptions
    };

    const updatedVariants = [
      ...variants.slice(0, variantIndex),
      updatedVariant,
      ...variants.slice(variantIndex + 1)
    ];

    this.variantStore.updateSelectedVariants(updatedVariants);
  }

  protected decrease(variantIndex: number, optionIndex: number): void {
    const variants = this.variantStore.selectedVariants();

    const newQuantity = Math.max(1, variants[variantIndex].options[optionIndex].quantity - 1);

    const updatedOption = {
      ...variants[variantIndex].options[optionIndex],
      quantity: newQuantity
    };

    const updatedOptions = [
      ...variants[variantIndex].options.slice(0, optionIndex),
      updatedOption,
      ...variants[variantIndex].options.slice(optionIndex + 1)
    ];

    const updatedVariant = {
      ...variants[variantIndex],
      options: updatedOptions
    };

    const updatedVariants = [
      ...variants.slice(0, variantIndex),
      updatedVariant,
      ...variants.slice(variantIndex + 1)
    ];

    this.variantStore.updateSelectedVariants(updatedVariants);
  }

  protected checkedChange(variantIndex: number, optionIndex: number, checked: boolean): void {
    const variants = this.deepClone(this.variantStore.selectedVariants());

    const updatedVariants = variants.map((variant: Option, vIndex: number) => {
      if (vIndex === variantIndex) {
        const newOptions = variant.options.map((option, oIndex) => {
          if (oIndex === optionIndex) {
            return { ...option, selected: checked };
          }
          return option;
        });

        const selectedOptions = newOptions.filter(item => item.selected === true);
        return {
          ...variant,
          options: newOptions,
          invalid: !(selectedOptions.length >= variant.atLeast &&
            selectedOptions.length <= variant.atMost)
        };
      }
      return variant;
    });

    this.variantStore.updateSelectedVariants(updatedVariants);
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
