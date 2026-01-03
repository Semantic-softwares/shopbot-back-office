import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { 
  RoomType, 
  RoomTypeFilters,
  UpdateRoomTypeRequest,
  RoomTypeStats
} from '../../../../../shared/models/room.model';

@Component({
  selector: 'app-room-types-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatTableModule,
    MatDividerModule,
    PageHeaderComponent
  ],
  templateUrl: './room-types-list.component.html'
})
export class RoomTypesListComponent {
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Filter signals
  searchFilter = signal<string>('');
  activeFilter = signal<boolean | null>(null);
  minPriceFilter = signal<number | null>(null);
  maxPriceFilter = signal<number | null>(null);

  // Local state
  selectedRoomTypes = signal<RoomType[]>([]);
  viewMode = signal<'grid' | 'table'>('table');
  
  // Table columns
  displayedColumns: string[] = ['select', 'roomType', 'capacityPricing', 'amenities', 'status', 'actions'];
  
  // Filter form
  filterForm: FormGroup;

  // Computed filter params for rxResource
  private filterParams = computed(() => {
    const selectedStore = this.storeStore.selectedStore();
    
    return {
      storeId: selectedStore?._id,
      search: this.searchFilter(),
      active: this.activeFilter(),
      minPrice: this.minPriceFilter(),
      maxPrice: this.maxPriceFilter()
    };
  });

  // rxResource for room types - automatically reloads when filterParams changes
  public roomTypesResource = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) => {
      if (!params.storeId) {
        return of([] as RoomType[]);
      }
      return this.roomsService.getRoomTypes(params.storeId);
    }
  });

  // Computed accessor for room types with client-side filtering
  roomTypes = computed(() => {
    const allRoomTypes = this.roomTypesResource.value() || [];
    const params = this.filterParams();

    return allRoomTypes.filter(roomType => {
      // Search filter
      if (params.search && params.search.trim()) {
        const search = params.search.toLowerCase();
        const matches = roomType.name.toLowerCase().includes(search) ||
                       roomType.description?.toLowerCase().includes(search);
        if (!matches) return false;
      }

      // Active filter
      if (params.active !== null) {
        if (roomType.active !== params.active) return false;
      }

      // Price range filter
      if (params.minPrice !== null && roomType.basePrice < params.minPrice) return false;
      if (params.maxPrice !== null && roomType.basePrice > params.maxPrice) return false;

      return true;
    });
  });

  // Get store currency for formatting
  storeCurrency = computed(() => this.storeStore.selectedStore()?.currency || this.storeStore.selectedStore()?.currencyCode || 'USD');

  // Computed stats based on all room types (not filtered)
  roomTypeStats = computed(() => {
    const allRoomTypes = this.roomTypesResource.value() || [];
    return {
      total: allRoomTypes.length,
      active: allRoomTypes.filter(rt => rt.active).length,
      inactive: allRoomTypes.filter(rt => !rt.active).length,
      averagePrice: allRoomTypes.length > 0 
        ? allRoomTypes.reduce((sum, rt) => sum + rt.basePrice, 0) / allRoomTypes.length 
        : 0
    };
  });

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      active: [null],
      minPrice: [null],
      maxPrice: [null]
    });

    // Sync form changes to signals with debounce
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((formValues) => {
      this.searchFilter.set(formValues.search || '');
      this.activeFilter.set(formValues.active);
      this.minPriceFilter.set(formValues.minPrice);
      this.maxPriceFilter.set(formValues.maxPrice);
    });
  }

  // Filter methods
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      active: null,
      minPrice: null,
      maxPrice: null
    });
  }

  applyQuickFilter(filter: { active?: boolean }): void {
    this.filterForm.patchValue(filter);
  }

  // Selection methods
  toggleRoomTypeSelection(roomType: RoomType): void {
    const selected = this.selectedRoomTypes();
    const index = selected.findIndex(rt => (rt._id || rt.id) === (roomType._id || roomType.id));
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(roomType);
    }
    
    this.selectedRoomTypes.set([...selected]);
  }

  isRoomTypeSelected(roomType: RoomType): boolean {
    return this.selectedRoomTypes().some(rt => (rt._id || rt.id) === (roomType._id || roomType.id));
  }

  selectAllRoomTypes(): void {
    this.selectedRoomTypes.set([...this.roomTypes()]);
  }

  clearSelection(): void {
    this.selectedRoomTypes.set([]);
  }

  // Bulk operations
  async bulkToggleActive(active: boolean): Promise<void> {
    const selectedIds = this.selectedRoomTypes().map(rt => rt._id || rt.id!);
    if (selectedIds.length === 0) return;

    try {
      // Update each room type individually since there's no bulk endpoint
      for (const id of selectedIds) {
        await this.roomsService.updateRoomType(id, { active }).toPromise();
      }
      
      this.clearSelection();
      this.roomTypesResource.reload();
      this.showSuccess(`${selectedIds.length} room type(s) updated successfully`);
    } catch (error) {
      this.showError('Failed to update room types');
    }
  }

  async deleteRoomType(roomType: RoomType): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${roomType.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const roomTypeId = roomType._id || roomType.id!;
      await this.roomsService.deleteRoomType(roomTypeId).toPromise();
      this.showSuccess('Room type deleted successfully');
      this.roomTypesResource.reload();
    } catch (error) {
      this.showError('Failed to delete room type: ' + (error || 'Unknown error'));
    }
  }

  async toggleRoomTypeActive(roomType: RoomType): Promise<void> {
    try {
      const roomTypeId = roomType._id || roomType.id!;
      await this.roomsService.updateRoomType(roomTypeId, { active: !roomType.active }).toPromise();
      this.showSuccess(`Room type ${roomType.active ? 'deactivated' : 'activated'} successfully`);
      this.roomTypesResource.reload();
    } catch (error) {
      this.showError('Failed to update room type status');
    }
  }

  // Currency symbol to ISO code mapping
  private currencySymbolToCode: Record<string, string> = {
    '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
    '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '₱': 'PHP', '฿': 'THB',
    'R$': 'BRL', 'R': 'ZAR', 'RM': 'MYR', 'kr': 'SEK', 'Fr': 'CHF'
  };

  // Utility methods
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

  getAmenitiesList(roomType: RoomType): string[] {
    return roomType.amenities || [];
  }

  getCapacityText(roomType: RoomType): string {
    if (!roomType.capacity) return 'Not specified';
    return `${roomType.capacity.adults} Adults, ${roomType.capacity.children} Children`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}