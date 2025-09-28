import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { StoreStore } from '../../../../../shared/stores/store.store';

export interface ExtensionDialogData {
  reservation: any;
  currentCheckOutDate: Date;
}

export interface ExtensionDialogResult {
  success: boolean;
  extension?: any;
  error?: string;
}

@Component({
  selector: 'app-extension-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatRadioModule
  ],
  templateUrl: './extension-dialog.component.html',
  styleUrls: ['./extension-dialog.component.scss']
})
export class ExtensionDialogComponent {
  private dialogRef = inject(MatDialogRef<ExtensionDialogComponent>);
  private data = inject<ExtensionDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  public storeStore = inject(StoreStore);

  extensionForm: FormGroup;
  isLoading = signal(false);
  availabilityChecking = signal(false);
  availability = signal<any>(null);
  errorMessage = signal('');

  constructor() {
    const minDate = new Date(this.data.currentCheckOutDate);
    minDate.setDate(minDate.getDate() + 1); // Next day

    this.extensionForm = this.fb.group({
      newCheckOutDate: ['', [Validators.required]],
      selectedPricingStrategy: ['same_rate', Validators.required], // Default to same rate
      discountedRate: [{ value: '', disabled: true }], // Enabled only when discounted_rate is selected
      notes: ['']
    });

    // Set minimum date
    this.minExtensionDate = minDate;

    // Listen for pricing strategy changes
    this.extensionForm.get('selectedPricingStrategy')?.valueChanges.subscribe(value => {
      this.onPricingStrategyChange(value);
    });
  }

  minExtensionDate: Date;

  get reservation() {
    return this.data.reservation;
  }

  get currentCheckOutDate() {
    return this.data.currentCheckOutDate;
  }

  get selectedStore() {
    return this.storeStore.selectedStore;
  }

  formatCurrency(amount: number): string {
    const store = this.selectedStore();
    const currency = store?.currency || 'USD';
    
    // Get currency symbol
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'GHS': '₵',
      'KES': 'KSh',
      'ZAR': 'R',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  getPricingStrategyDisplayName(strategy: string): string {
    const strategyNames: { [key: string]: string } = {
      'same_rate': 'Original Booking Rate',
      'current_rate': 'Current Room Rate', 
      'extension_rate': 'Extension Rate',
      'dynamic_rate': 'Dynamic Pricing',
      'loyalty_rate': 'Loyalty Rate'
    };
    return strategyNames[strategy] || strategy;
  }

  getModifierDisplayName(modifier: any): string {
    if (modifier.type === 'percentage') {
      const percentage = ((modifier.value - 1) * 100).toFixed(0);
      return percentage >= '0' ? `+${percentage}%` : `${percentage}%`;
    } else {
      return `${modifier.value > 0 ? '+' : ''}${this.formatCurrency(modifier.value)}`;
    }
  }

  async onDateChange() {
    const newDate = this.extensionForm.get('newCheckOutDate')?.value;
    if (newDate && newDate > this.currentCheckOutDate) {
      await this.checkAvailability();
    } else {
      this.availability.set(null);
    }
  }

  async checkAvailability() {
    const newCheckOutDate = this.extensionForm.get('newCheckOutDate')?.value;
    if (!newCheckOutDate) return;

    this.availabilityChecking.set(true);
    this.errorMessage.set('');

    try {
      const availability = await this.reservationService.checkExtensionAvailability(
        this.reservation._id,
        newCheckOutDate.toISOString()
      ).toPromise();

      this.availability.set(availability);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to check availability');
      this.availability.set(null);
    } finally {
      this.availabilityChecking.set(false);
    }
  }

  private calculateEstimatedCost(newDate: Date): number {
    const additionalNights = this.calculateNights(newDate);
    return additionalNights * 100; // Mock rate
  }

  private calculateNights(newDate: Date): number {
    const timeDiff = newDate.getTime() - this.currentCheckOutDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  async submitExtension() {
    if (!this.extensionForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    const availability = this.availability();
    if (!availability?.isAvailable) {
      this.errorMessage.set('Extension is not available for the selected dates');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const formData = this.extensionForm.value;
      const additionalNights = this.calculateNights(formData.newCheckOutDate);

    const extensionRequest = {
      newCheckOutDate: formData.newCheckOutDate.toISOString(),
      additionalNights,
      selectedPricingStrategy: formData.selectedPricingStrategy,
      selectedRate: this.getSelectedRate(),
      discountedRate: formData.selectedPricingStrategy === 'discounted_rate' ? this.getDiscountedRateValue() : null,
      totalCost: this.getTotalCost(),
      notes: formData.notes || ''
    };      const response = await this.reservationService.requestExtension(
        this.reservation._id,
        extensionRequest
      ).toPromise();

      this.dialogRef.close({
        success: true,
        extension: response?.extension
      } as ExtensionDialogResult);

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to request extension');
    } finally {
      this.isLoading.set(false);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.extensionForm.controls).forEach(key => {
      this.extensionForm.get(key)?.markAsTouched();
    });
  }

  getModifierValueDisplay(modifier: any): string {
    if (modifier.type === 'percentage') {
      return `${modifier.value > 0 ? '+' : ''}${modifier.value}%`;
    } else {
      return `${modifier.value > 0 ? '+' : ''}${this.formatCurrency(modifier.value)}`;
    }
  }

  getModifierValueClass(modifier: any): string {
    return modifier.value > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium';
  }

  getModifierDescription(modifier: any): string {
    const descriptions: { [key: string]: string } = {
      'seasonal': 'Applied based on current season',
      'loyalty': 'Discount for loyalty program members',
      'length_of_stay': 'Discount for extended stays',
      'last_minute': 'Discount for booking within 24 hours',
      'occupancy': 'Rate adjusted based on current occupancy levels',
      'weekend': 'Additional charge for weekend stays',
      'holiday': 'Premium rate during holiday periods'
    };
    
    return modifier.description || descriptions[modifier.type] || '';
  }

  // Get available rate options for selection (simplified to 2 options)
  get rateOptions() {
    const breakdown = this.availability()?.pricingBreakdown;
    if (!breakdown || !breakdown.originalRate) return [];

    return [
      {
        id: 'same_rate',
        name: 'Same Rate',
        description: 'Continue with the original room rate',
        rate: breakdown.originalRate,
        isRecommended: true,
        badge: 'ORIGINAL',
        savings: 0
      },
      {
        id: 'discounted_rate',
        name: 'Discounted Rate',
        description: 'Apply a custom discount to the original rate',
        rate: this.getDiscountedRateValue() || breakdown.originalRate,
        isRecommended: false,
        badge: null,
        savings: this.getDiscountAmount()
      }
    ];
  }

  // Get discounted rate value from form
  getDiscountedRateValue(): number {
    const discountedRate = this.extensionForm.get('discountedRate')?.value;
    return discountedRate ? parseFloat(discountedRate) : 0;
  }

  // Get discount amount
  getDiscountAmount(): number {
    const originalRate = this.availability()?.pricingBreakdown?.originalRate || 0;
    const discountedRate = this.getDiscountedRateValue();
    return discountedRate > 0 ? Math.max(0, originalRate - discountedRate) : 0;
  }

  // Get selected rate amount
  getSelectedRate(): number {
    const selectedStrategy = this.extensionForm.get('selectedPricingStrategy')?.value;
    
    if (selectedStrategy === 'same_rate') {
      return this.availability()?.pricingBreakdown?.originalRate || 0;
    } else if (selectedStrategy === 'discounted_rate') {
      const discountedRate = this.getDiscountedRateValue();
      return discountedRate > 0 ? discountedRate : (this.availability()?.pricingBreakdown?.originalRate || 0);
    }
    
    return 0;
  }

  // Calculate total cost based on selected rate
  getTotalCost(): number {
    const extensionDays = this.availability()?.extensionDays || 0;
    const selectedRate = this.getSelectedRate();
    return extensionDays * selectedRate;
  }

  // Get savings amount for display
  getSavings(option: any): number {
    return option.savings || 0;
  }

  // Check if rate option has savings
  hasSavings(option: any): boolean {
    return (option.savings || 0) > 0;
  }

  // Handle pricing strategy change
  onPricingStrategyChange(value: string): void {
    const discountedRateControl = this.extensionForm.get('discountedRate');
    
    if (value === 'discounted_rate') {
      // Enable discounted rate input
      discountedRateControl?.enable();
      discountedRateControl?.setValidators([Validators.required, Validators.min(1)]);
      
      // Set placeholder value as original rate
      const originalRate = this.availability()?.pricingBreakdown?.originalRate || 0;
      discountedRateControl?.setValue(originalRate);
    } else {
      // Disable discounted rate input
      discountedRateControl?.disable();
      discountedRateControl?.clearValidators();
      discountedRateControl?.setValue('');
    }
    
    discountedRateControl?.updateValueAndValidity();
  }

  // Validate discounted rate
  validateDiscountedRate(): boolean {
    const selectedStrategy = this.extensionForm.get('selectedPricingStrategy')?.value;
    
    if (selectedStrategy === 'discounted_rate') {
      const originalRate = this.availability()?.pricingBreakdown?.originalRate || 0;
      const discountedRate = this.getDiscountedRateValue();
      
      return discountedRate > 0 && discountedRate <= originalRate;
    }
    
    return true;
  }

  onCancel() {
    this.dialogRef.close({
      success: false
    } as ExtensionDialogResult);
  }
}