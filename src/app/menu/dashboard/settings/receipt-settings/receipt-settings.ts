import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../../shared/services/store.service';
import { StoreStore } from '../../../../shared/stores/store.store';

@Component({
  selector: 'app-receipt-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './receipt-settings.html',
  styleUrl: './receipt-settings.scss',
})
export class ReceiptSettings implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  public storeStore = inject(StoreStore);

  loading = signal(false);
  saving = signal(false);
  
  posSettingsForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  private initializeForm(): void {
    this.posSettingsForm = this.fb.group({
      requireOrdersPaymentBeforeCheckout: [true],
      receiptSettings: this.fb.group({
        showNote: [false],
        showTax: [true],
        showStoreDetails: [true],
        showSellerInfo: [true],
        showCustomerName: [true],
        printAfterFinish: [true],
        footerMessage: ['Thank you for your patronage', Validators.required],
        disclaimer: [''],
      }),
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    
    const store = this.storeStore.selectedStore();
    if (store?.posSettings) {
      this.posSettingsForm.patchValue(store.posSettings);
    }
    
    this.loading.set(false);
  }

  saveReceiptSettings(): void {
    if (this.posSettingsForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const currentStore = this.storeStore.selectedStore()!;
      const posSettingsData = this.posSettingsForm.value;
      
      const storeUpdatePayload = {
        posSettings: posSettingsData
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: () => {
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              this.saving.set(false);
              this.snackBar.open('Receipt settings saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving receipt settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save receipt settings.', 'Close', { duration: 5000 });
        }
      });
    }
  }

  resetForm(): void {
    this.loadSettings();
  }
}
