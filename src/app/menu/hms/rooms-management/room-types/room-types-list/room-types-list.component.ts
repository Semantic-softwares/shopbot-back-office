import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './room-types-list.component.html'
})
export class RoomTypesListComponent implements OnInit {
  private destroy$ = new Subject<void>();
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals for reactive data
  roomTypes = signal<RoomType[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Local state
  selectedRoomTypes = signal<RoomType[]>([]);
  viewMode = signal<'grid' | 'table'>('table');
  
  // Filter form
  filterForm: FormGroup;

  // Computed properties
  filteredRoomTypes = computed(() => {
    const roomTypes = this.roomTypes();
    const filters = this.filterForm?.value;
    
    if (!filters) return roomTypes;

    return roomTypes.filter(roomType => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matches = roomType.name.toLowerCase().includes(search) ||
                       roomType.description?.toLowerCase().includes(search);
        if (!matches) return false;
      }

      // Active filter
      if (filters.active !== null && filters.active !== '') {
        if (roomType.active !== filters.active) return false;
      }

      // Price range filter
      if (filters.minPrice && roomType.basePrice < filters.minPrice) return false;
      if (filters.maxPrice && roomType.basePrice > filters.maxPrice) return false;

      return true;
    });
  });

  roomTypeStats = computed(() => {
    const roomTypes = this.roomTypes();
    return {
      total: roomTypes.length,
      active: roomTypes.filter(rt => rt.active).length,
      inactive: roomTypes.filter(rt => !rt.active).length,
      averagePrice: roomTypes.length > 0 
        ? roomTypes.reduce((sum, rt) => sum + rt.basePrice, 0) / roomTypes.length 
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

    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      // Trigger recomputation through signal
      this.roomTypes.set([...this.roomTypes()]);
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData(): Promise<void> {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.error.set('No store selected');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      this.roomsService.getRoomTypes(storeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (roomTypes) => {
            this.roomTypes.set(roomTypes);
            this.loading.set(false);
          },
          error: (error) => {
            this.error.set('Failed to load room types');
            this.loading.set(false);
            this.showError('Failed to load room types: ' + (error.error?.message || error.message));
          }
        });
    } catch (error) {
      this.error.set('Failed to load room types');
      this.loading.set(false);
    }
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
    this.selectedRoomTypes.set([...this.filteredRoomTypes()]);
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
      await this.loadData();
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
      await this.loadData();
    } catch (error) {
      this.showError('Failed to delete room type: ' + (error || 'Unknown error'));
    }
  }

  // View toggle
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'grid' : 'table');
  }

  // Utility methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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