import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../../../shared/services/store.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

// Edits Store.deliverySettings — read by DeliveryFeeService.calculateFee()
// (backend) for every storefront delivery order. Four fee modes map 1:1 onto
// that service's four branches; deliveryRadius and the minimum-order-amount
// gate are enforced server-side in SelfOrderService#placeOrder. `deliveryFee`
// and `deliveryType` are legacy fields nothing reads — left untouched on
// save rather than exposed here.
@Component({
  selector: 'app-delivery-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './delivery-settings.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DeliverySettings implements OnInit {
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);

  loading = signal(true);
  saving = signal(false);

  // 1 = flat rate, 2 = free, 3 = free above a threshold, 4 = by distance.
  feeMode = signal(1);
  deliveryFeeForAllOrder = signal(0);
  minimumOrderAmountForFreeDelivery = signal(0);
  minimumDeliveryFee = signal(0);
  deliveryFeeByKilometers = signal(0);

  estimatedMinMinutes = signal(0);
  estimatedMaxMinutes = signal(0);

  deliveryRadius = signal<number | null>(null);

  allowMinimumOrderAmount = signal(false);
  minimumOrderAmount = signal(0);

  enableDeliveryInstructions = signal(false);
  deliveryInstructions = signal('');

  // Preserved untouched from whatever the store already had — not exposed in
  // this form, but must round-trip on save since the backend replaces the
  // whole deliverySettings sub-document, not a merge.
  private passthroughDeliveryFee = 0;
  private passthroughDeliveryType: string[] = [];

  ngOnInit(): void {
    this.loadSettings();
    this.loading.set(false);
  }

  private loadSettings(): void {
    const settings = this.storeStore.selectedStore()?.deliverySettings;
    if (!settings) return;

    this.feeMode.set(settings.deliveryFeeNumber || 1);
    this.deliveryFeeForAllOrder.set(settings.deliveryFeeForAllOrder || 0);
    this.minimumOrderAmountForFreeDelivery.set(settings.minimumOrderAmountForFreeDelivery || 0);
    this.minimumDeliveryFee.set(settings.minimumDeliveryFee || 0);
    this.deliveryFeeByKilometers.set(settings.deliveryFeeByKilometers || 0);
    this.estimatedMinMinutes.set(settings.estimatedDeliveryTime?.minimum || 0);
    this.estimatedMaxMinutes.set(settings.estimatedDeliveryTime?.maximum || 0);
    const radius = Number(settings.deliveryRadius);
    this.deliveryRadius.set(radius > 0 ? radius : null);
    this.allowMinimumOrderAmount.set(!!settings.allowMinimumOrderAmount);
    this.minimumOrderAmount.set(settings.minimumOrderAmount || 0);
    this.enableDeliveryInstructions.set(!!settings.enableDeliveryInstructions);
    this.deliveryInstructions.set(settings.deliveryInstructions || '');

    this.passthroughDeliveryFee = settings.deliveryFee || 0;
    this.passthroughDeliveryType = settings.deliveryType || [];
  }

  save(): void {
    const store = this.storeStore.selectedStore();
    if (!store) return;

    this.saving.set(true);
    const payload = {
      deliverySettings: {
        deliveryFeeNumber: this.feeMode(),
        deliveryFeeForAllOrder: this.deliveryFeeForAllOrder(),
        minimumOrderAmountForFreeDelivery: this.minimumOrderAmountForFreeDelivery(),
        minimumDeliveryFee: this.minimumDeliveryFee(),
        deliveryFeeByKilometers: this.deliveryFeeByKilometers(),
        estimatedDeliveryTime: {
          minimum: this.estimatedMinMinutes(),
          maximum: this.estimatedMaxMinutes(),
        },
        deliveryRadius: this.deliveryRadius() != null ? String(this.deliveryRadius()) : '',
        allowMinimumOrderAmount: this.allowMinimumOrderAmount(),
        minimumOrderAmount: this.minimumOrderAmount(),
        enableDeliveryInstructions: this.enableDeliveryInstructions(),
        deliveryInstructions: this.deliveryInstructions().trim(),
        deliveryFee: this.passthroughDeliveryFee,
        deliveryType: this.passthroughDeliveryType,
      },
    };

    this.storeService.updateStore(store._id, payload).subscribe({
      next: () => {
        this.storeService.getStore(store._id).subscribe({
          next: (updatedStore) => {
            this.storeStore.updateStore(updatedStore);
            this.storeService.saveStoreLocally(updatedStore);
            this.saving.set(false);
            this.snackBar.open('Delivery settings saved.', 'Close', { duration: 3000 });
          },
          error: () => {
            this.saving.set(false);
            this.snackBar.open('Saved, but failed to refresh local data.', 'Close', { duration: 4000 });
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save delivery settings.', 'Close', { duration: 4000 });
      },
    });
  }
}
