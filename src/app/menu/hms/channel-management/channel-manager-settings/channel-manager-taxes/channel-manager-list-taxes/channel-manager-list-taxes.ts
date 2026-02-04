import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { ConfirmationDialogComponent } from '../../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TaxService, Tax } from '../../../../../../shared/services/tax.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { ChannelManagerCreateTaxModal } from '../channel-manager-create-tax-modal/channel-manager-create-tax-modal';

@Component({
  selector: 'app-channel-manager-list-taxes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    PageHeaderComponent,
  ],
  templateUrl: './channel-manager-list-taxes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerListTaxes {
  private taxService = inject(TaxService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  taxes = signal<Tax[]>([]);
  isLoading = signal(false);
  displayedColumns: string[] = ['title', 'type', 'rate', 'actions'];

  constructor() {
    this.loadTaxes();
  }

  private loadTaxes() {
    const propertyId = this.storeStore.selectedStore()?.channex?.propertyId;
    if (!propertyId) {
      this.snackBar.open('Property ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    this.taxService
      .getTaxes(propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.taxes.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          const errorMessage = error.error?.message || 'Failed to load taxes';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Error loading taxes:', error);
        },
      });
  }

  createTax() {
    this.openModal();
  }

  editTax(tax: Tax) {
    this.openModal(tax);
  }

  private openModal(tax?: Tax) {
    this.dialog
      .open(ChannelManagerCreateTaxModal, {
        data: { tax, propertyId: this.storeStore.selectedStore()?.channex?.propertyId },
        width: '600px',
        disableClose: false,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadTaxes();
        }
      });
  }

  deleteTax(tax: Tax) {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete Tax',
          message: `Are you sure you want to delete the tax "${tax.title}"?`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          const propertyId = this.storeStore.selectedStore()?.channex?.propertyId;
          if (!propertyId) return;

          this.taxService
            .deleteTax(propertyId, tax.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.snackBar.open('Tax deleted successfully', 'Close', { duration: 3000 });
                this.loadTaxes();
              },
              error: (error) => {
                const errorMessage = error.error?.message || 'Failed to delete tax';
                this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                console.error('Error deleting tax:', error);
              },
            });
        }
      });
  }
}
