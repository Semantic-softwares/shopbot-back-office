import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Order } from '../../models';
import { StoreStore } from '../../stores/store.store';
import { PrintJobService } from '../../services/print-job.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface BillModalData {
  orderData: Order;
}

@Component({
  selector: 'app-bill-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './bill-modal.component.html',
  styleUrl: './bill-modal.component.scss',
})
export class BillModalComponent {
  private dialogRef = inject(MatDialogRef<BillModalComponent>);
  public storeStore = inject(StoreStore);
  public printJobService = inject(PrintJobService);
  public data = inject<BillModalData>(MAT_DIALOG_DATA);
  public order = signal(this.data.orderData);
  public snackBar = inject(MatSnackBar);
  public isPrinting = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  async print(): Promise<void> {
    // Set printing state
    this.isPrinting.set(true);

    try {
      // Print via PrintJobService which handles both Bluetooth and backend print jobs
      const result = await this.printJobService.printOrderReceipt(this.order());

      // Show appropriate success message based on printer connection
      if (result.isPrinterConnected) {
        this.snackBar.open('✅ Order printed successfully', 'Close', {
          duration: 3000,
        });
      } else {
        this.snackBar.open(
          '📋 Print job created - Receipt will print at counter',
          'Close',
          {
            duration: 5000,
            panelClass: ['info-snackbar'],
          }
        );
      }
      this.close();
    } catch (error: any) {
      console.error('Print failed:', error);
      this.snackBar.open(`Print failed: ${error.message}`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isPrinting.set(false);
    }
  }

  public currency = computed(
    () => this.storeStore.selectedStore()?.currency || '₦'
  );

  /**
   * Calculate total cost for a product including all selected options
   */
  getItemTotal(product: any): number {
    let total = product.price * product.quantity;

    // Add options cost
    if (product.options && product.options.length > 0) {
      product.options.forEach((variant: any) => {
        if (variant.options) {
          variant.options.forEach((option: any) => {
            if (option.selected) {
              total +=
                (option.price || 0) * (option.quantity || 1) * product.quantity;
            }
          });
        }
      });
    }

    return total;
  }

  /**
   * Get all selected options for a product in a flattened format
   */
  getOptionsDisplay(
    product: any
  ): Array<{ name: string; quantity: number; price: number }> {
    if (!product.options || product.options.length === 0) return [];

    const selectedOptions: Array<{
      name: string;
      quantity: number;
      price: number;
    }> = [];
    product.options.forEach((variant: any) => {
      if (variant.options) {
        variant.options.forEach((option: any) => {
          if (option.selected) {
            selectedOptions.push({
              name: option.name,
              quantity: option.quantity || 1,
              price: option.price || 0,
            });
          }
        });
      }
    });
    return selectedOptions;
  }

  /**
   * Calculate base price (without options) for a product
   */
  getBasePrice(product: any): number {
    return product.price * product.quantity;
  }

  /**
   * Calculate total options cost for a product
   */
  getOptionsCost(product: any): number {
    let optionsCost = 0;
    if (product.options && product.options.length > 0) {
      product.options.forEach((variant: any) => {
        if (variant.options) {
          variant.options.forEach((option: any) => {
            if (option.selected) {
              optionsCost +=
                (option.price || 0) * (option.quantity || 1) * product.quantity;
            }
          });
        }
      });
    }
    return optionsCost;
  }

  /**
   * Format date to readable string
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }
}
