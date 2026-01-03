import { Component, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { rxResource } from '@angular/core/rxjs-interop';
import { Subject, takeUntil, of } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { RoomType } from '../../../../../shared/models/room.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-room-type-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatTabsModule,
    PageHeaderComponent
  ],
  templateUrl: './room-type-details.component.html'
})
export class RoomTypeDetailsComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roomsService = inject(RoomsService);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private destroy$ = new Subject<void>();

  // Room type ID signal from route
  roomTypeId = signal<string | null>(this.route.snapshot.paramMap.get('id'));

  // rxResource for loading room type details
  roomTypeResource = rxResource({
    params: () => ({ roomTypeId: this.roomTypeId() }),
    stream: ({ params }) => {
      if (!params.roomTypeId) {
        return of(null as RoomType | null);
      }
      return this.roomsService.getRoomType(params.roomTypeId);
    }
  });

  // Computed properties from resource
  roomType = computed<RoomType | null>(() => this.roomTypeResource.value() ?? null);
  loading = computed(() => this.roomTypeResource.isLoading());
  error = computed(() => this.roomTypeResource.error() ? 'Failed to load room type details' : null);

  // Store currency
  storeCurrency = computed(() => this.storeStore.selectedStore()?.currency || this.storeStore.selectedStore()?.currencyCode || 'USD');

  // Currency symbol to ISO code mapping
  private currencySymbolToCode: Record<string, string> = {
    '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
    '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '₱': 'PHP', '฿': 'THB',
    'R$': 'BRL', 'R': 'ZAR', 'RM': 'MYR', 'kr': 'SEK', 'Fr': 'CHF'
  };

  // Computed values
  totalCapacity = computed(() => {
    const rt = this.roomType();
    if (rt?.capacity) {
      return (rt.capacity.adults || 0) + (rt.capacity.children || 0);
    }
    return 0;
  });

  roomFeatures = computed(() => {
    const rt = this.roomType();
    if (!rt?.features) return [];
    
    const features: { name: string; icon: string }[] = [];
    const featureMap: Record<string, { label: string; icon: string }> = {
      hasPrivateBathroom: { label: 'Private Bathroom', icon: 'bathroom' },
      hasAirConditioning: { label: 'Air Conditioning', icon: 'ac_unit' },
      hasWifi: { label: 'WiFi', icon: 'wifi' },
      hasTv: { label: 'Television', icon: 'tv' },
      hasRefrigerator: { label: 'Refrigerator', icon: 'kitchen' },
      hasBalcony: { label: 'Balcony', icon: 'balcony' },
      hasKitchenette: { label: 'Kitchenette', icon: 'countertops' },
      hasWorkDesk: { label: 'Work Desk', icon: 'desk' },
      hasSafe: { label: 'Safe', icon: 'lock' },
      hasHairdryer: { label: 'Hair Dryer', icon: 'dry' },
      hasIroning: { label: 'Iron & Board', icon: 'iron' },
      hasSeatingArea: { label: 'Seating Area', icon: 'weekend' }
    };

    for (const [key, config] of Object.entries(featureMap)) {
      if (rt.features[key as keyof typeof rt.features]) {
        features.push({ name: config.label, icon: config.icon });
      }
    }
    
    return features;
  });

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoomTypeDetails(): void {
    this.roomTypeResource.reload();
  }

  onBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    const id = this.roomTypeId();
    if (id) {
      this.router.navigate(['../', id, 'edit'], { relativeTo: this.route });
    }
  }

  onDelete() {
    const roomType = this.roomType();
    if (!roomType) return;

    const id = roomType._id || roomType.id;
    if (!id) return;

    if (confirm(`Are you sure you want to delete "${roomType.name}"? This action cannot be undone.`)) {
      this.roomsService.deleteRoomType(id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Room type deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['../../room-types'], { relativeTo: this.route });
        },
        error: (error) => {
          console.error('Error deleting room type:', error);
          this.snackBar.open('Failed to delete room type', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onToggleActive() {
    const roomType = this.roomType();
    if (!roomType) return;

    const id = roomType._id || roomType.id;
    if (!id) return;

    const newActiveStatus = !roomType.active;
    const action = newActiveStatus ? 'activate' : 'deactivate';

    this.roomsService.updateRoomType(id, { active: newActiveStatus }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open(`Room type ${action}d successfully`, 'Close', { duration: 3000 });
        this.roomTypeResource.reload();
      },
      error: (error) => {
        console.error(`Error ${action}ing room type:`, error);
        this.snackBar.open(`Failed to ${action} room type`, 'Close', { duration: 3000 });
      }
    });
  }

  formatPrice(price: number): string {
    let currencyCode = this.storeCurrency();
    
    // If it's a symbol, try to map it to a code
    if (this.currencySymbolToCode[currencyCode]) {
      currencyCode = this.currencySymbolToCode[currencyCode];
    }
    
    // Validate currency code (should be 3 letters)
    const isValidCode = /^[A-Z]{3}$/.test(currencyCode);
    
    if (!isValidCode) {
      // Fallback: format number and prepend the symbol
      const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(price);
      return `${this.storeCurrency()}${formattedNumber}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  }

  getCapacityText(): string {
    const rt = this.roomType();
    if (!rt?.capacity) return 'Not specified';
    
    const parts = [];
    if (rt.capacity.adults) parts.push(`${rt.capacity.adults} Adult${rt.capacity.adults > 1 ? 's' : ''}`);
    if (rt.capacity.children) parts.push(`${rt.capacity.children} Child${rt.capacity.children > 1 ? 'ren' : ''}`);
    
    return parts.join(', ') || 'Not specified';
  }
}