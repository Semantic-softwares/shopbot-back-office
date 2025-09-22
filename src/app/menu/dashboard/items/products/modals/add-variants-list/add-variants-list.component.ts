import { Component, Inject, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import { ProductService } from '../../../../../../shared/services/product.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { rxResource } from '@angular/core/rxjs-interop';
import { VariantDialogComponent } from '../../../variants/variant-dialog/variant-dialog.component';

@Component({
  selector: 'app-add-variants-list',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NoRecordComponent
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 mat-dialog-title class="text-xl font-bold">Select Variants</h2>
        <button mat-stroked-button color="primary" (click)="createNewVariant()">
          <mat-icon class="mr-2">add</mat-icon>
          New Variant
        </button>
      </div>

      @if (variants.isLoading()) {
        <div class="flex items-center justify-center min-h-[200px]">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (variants.error()) {
        <p class="text-red-500">Error loading variants</p>
      } @else if (variants.hasValue() && variants.value().length === 0) {
        <app-no-record 
          icon="tune"
          title="No Variants Available"
          message="Create your first variant to customize product options like sizes, colors, or flavors.">
        </app-no-record>
      } @else if (variants.hasValue()) {
        <mat-selection-list #variantList [multiple]="true">
          @for (variant of variants.value(); track variant._id) {
            <mat-list-option [value]="variant" 
                           [selected]="isSelected(variant._id)"
                           [checkboxPosition]="'before'">
              {{variant.name}}
              <div class="text-sm text-gray-500">
                At least: {{variant.atLeast}} | At most: {{variant.atMost}}
              </div>
            </mat-list-option>
          }
        </mat-selection-list>
      }

      <div class="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                [disabled]="!variants.hasValue() || variants.value().length === 0"
                (click)="onSave(variantList!.selectedOptions!.selected)">
          Save
        </button>
      </div>
    </div>
  `
})
export class AddVariantsListComponent {
  @ViewChild('variantList') variantList!: MatSelectionList;
  private dialog = inject(MatDialog);
  private productService = inject(ProductService);
  private storeStore = inject(StoreStore);
  
  public variants = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.productService.getStoreGroupOption(params.storeId!)
  });

  constructor(
    public dialogRef: MatDialogRef<AddVariantsListComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { selectedVariants: string[] }
  ) {}

  isSelected(variantId: string): boolean {
    return this.data.selectedVariants.includes(variantId);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(selectedOptions: any[]): void {
    const selectedVariants = selectedOptions.map(option => option.value);
    this.dialogRef.close(selectedVariants);
  }

  createNewVariant(): void {
    const dialogRef = this.dialog.open(VariantDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.variants.reload();
      }
    });
  }
}