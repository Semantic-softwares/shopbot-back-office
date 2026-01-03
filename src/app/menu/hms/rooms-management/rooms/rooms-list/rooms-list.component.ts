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
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { 
  Room, 
  RoomType, 
  RoomFilters, 
  RoomStatus, 
  HousekeepingStatus,
  PaginatedRoomsResponse,
  ROOM_STATUS_COLORS,
  HOUSEKEEPING_STATUS_COLORS
} from '../../../../../shared/models/room.model';

@Component({
  selector: 'app-rooms-list',
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
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatButtonToggleModule,
    PageHeaderComponent
  ],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.scss'
})
export class RoomsListComponent {
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);

  // Filter signals
  searchFilter = signal<string>('');
  statusFilter = signal<RoomStatus[]>([]);
  housekeepingStatusFilter = signal<HousekeepingStatus[]>([]);
  roomTypeFilter = signal<string[]>([]);
  floorFilter = signal<number[]>([]);

  // Pagination signals
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);
  totalRooms = signal<number>(0);

  // Local state
  selectedRooms = signal<Room[]>([]);
  viewMode = signal<'grid' | 'table'>('table');
  
  // Filter form
  filterForm: FormGroup;
  
  // Display columns for table
  displayedColumns = [
    'select',
    'roomNumber',
    'roomType',
    'floor',
    'priceOverride',
    'status',
    'housekeepingStatus',
    'features',
    'actions'
  ];

  // Status options
  statusOptions: RoomStatus[] = ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order'];
  housekeepingOptions: HousekeepingStatus[] = ['clean', 'dirty', 'inspected', 'out_of_order'];

  // Computed filter params for rxResource
  private filterParams = computed(() => {
    const selectedStore = this.storeStore.selectedStore();
    
    const filters: RoomFilters = {};

    if (this.searchFilter() && this.searchFilter().trim()) {
      filters.search = this.searchFilter().trim();
    }

    if (this.statusFilter().length > 0) {
      filters.status = this.statusFilter();
    }

    if (this.housekeepingStatusFilter().length > 0) {
      filters.housekeepingStatus = this.housekeepingStatusFilter();
    }

    if (this.roomTypeFilter().length > 0) {
      filters.roomType = this.roomTypeFilter();
    }

    if (this.floorFilter().length > 0) {
      filters.floor = this.floorFilter();
    }

    // Add pagination params
    filters.page = this.pageIndex() + 1; // Backend uses 1-based pages
    filters.limit = this.pageSize();

    return {
      storeId: selectedStore?._id,
      filters
    };
  });

  // rxResource for rooms - automatically reloads when filterParams changes
  public roomsResource = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) => {
      if (!params.storeId) {
        return of({ rooms: [], total: 0, page: 1, limit: 10, totalPages: 0 } as PaginatedRoomsResponse);
      }
      return this.roomsService.getRoomsPaginated(params.storeId, params.filters);
    }
  });

  // Computed accessor for rooms array
  rooms = computed(() => this.roomsResource.value()?.rooms || []);

  // Sync total count from response
  roomsTotal = computed(() => this.roomsResource.value()?.total || 0);

  // rxResource for room types
  public roomTypesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) {
        return of([]);
      }
      return this.roomsService.getRoomTypes(params.storeId);
    }
  });

  // Computed room types accessor
  roomTypes = computed(() => this.roomTypesResource.value() || []);

  // Get store currency for formatting
  storeCurrency = computed(() => this.storeStore.selectedStore()?.currency || this.storeStore.selectedStore()?.currencyCode || 'USD');

  // Computed room stats based on current data
  roomStats = computed(() => {
    const roomsList = this.rooms() || [];
    return {
      total: this.roomsTotal(),
      available: roomsList.filter(r => r.status === 'available').length,
      occupied: roomsList.filter(r => r.status === 'occupied').length,
      maintenance: roomsList.filter(r => r.status === 'maintenance').length,
      cleaning: roomsList.filter(r => r.status === 'cleaning').length,
      outOfOrder: roomsList.filter(r => r.status === 'out_of_order').length
    };
  });

  // Page size options
  pageSizeOptions = [5, 10, 25, 50, 100];

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      housekeepingStatus: [[]],
      roomType: [[]],
      floor: [[]]
    });

    // Sync form changes to signals with debounce
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((formValues) => {
      // Reset to first page when filters change
      this.pageIndex.set(0);
      this.searchFilter.set(formValues.search || '');
      this.statusFilter.set(formValues.status || []);
      this.housekeepingStatusFilter.set(formValues.housekeepingStatus || []);
      this.roomTypeFilter.set(formValues.roomType || []);
      this.floorFilter.set(formValues.floor || []);
    });
  }

  // Pagination handler
  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  // Filter methods
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: [],
      housekeepingStatus: [],
      roomType: [],
      floor: []
    });
    this.pageIndex.set(0);
  }

  applyQuickFilter(filter: Partial<RoomFilters>): void {
    this.filterForm.patchValue(filter);
  }

  // Room selection methods
  toggleRoomSelection(room: Room): void {
    const selected = this.selectedRooms();
    const index = selected.findIndex(r => (r._id || r.id) === (room._id || room.id));
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(room);
    }
    
    this.selectedRooms.set([...selected]);
  }

  isRoomSelected(room: Room): boolean {
    return this.selectedRooms().some(r => (r._id || r.id) === (room._id || room.id));
  }

  selectAllRooms(): void {
    this.selectedRooms.set([...this.rooms()]);
  }

  clearSelection(): void {
    this.selectedRooms.set([]);
  }

  // Status update methods
  async updateRoomStatus(room: Room, status: RoomStatus): Promise<void> {
    try {
      const roomId = room._id || room.id!;
      await this.roomsService.updateRoomStatus(roomId, status).toPromise();
      this.roomsResource.reload(); // Refresh data
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  }

  async updateHousekeepingStatus(room: Room, status: HousekeepingStatus): Promise<void> {
    try {
      const roomId = room._id || room.id!;
      await this.roomsService.updateHousekeepingStatus(roomId, status).toPromise();
      this.roomsResource.reload(); // Refresh data
    } catch (error) {
      console.error('Error updating housekeeping status:', error);
    }
  }

  async bulkUpdateStatus(status: RoomStatus): Promise<void> {
    try {
      const roomIds = this.selectedRooms().map(r => r._id || r.id!);
      await this.roomsService.bulkUpdateRoomStatus(roomIds, status).toPromise();
      this.clearSelection();
      this.roomsResource.reload(); // Refresh data
    } catch (error) {
      console.error('Error bulk updating status:', error);
    }
  }

  // Utility methods
  getRoomTypeName(room: Room): string {
    return typeof room.roomType === 'object' ? room.roomType.name : 'Unknown';
  }

  getStatusColor(status: RoomStatus): string {
    return ROOM_STATUS_COLORS[status] || 'default';
  }

  getHousekeepingColor(status: HousekeepingStatus): string {
    return HOUSEKEEPING_STATUS_COLORS[status] || 'default';
  }

  getFeaturesList(room: Room): string[] {
    const features: string[] = [];
    if (room.features.hasBalcony) features.push('Balcony');
    if (room.features.hasKitchen) features.push('Kitchen');
    if (room.features.hasBathtub) features.push('Bathtub');
    if (room.features.hasAirConditioning) features.push('AC');
    if (room.features.hasWifi) features.push('WiFi');
    if (room.features.hasTV) features.push('TV');
    if (room.features.oceanView) features.push('Ocean View');
    if (room.features.cityView) features.push('City View');
    
    // Add room-specific amenities
    if (room.amenities && room.amenities.length > 0) {
      features.push(...room.amenities.slice(0, 2)); // Add first 2 amenities
    }
    
    return features;
  }

  getSizeDisplay(size: number | string | undefined): string {
    if (!size) return '';
    
    if (typeof size === 'string') {
      const sizeMap: { [key: string]: string } = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        'extra-large': 'X-Large'
      };
      return sizeMap[size] || size;
    }
    
    return `${size} sq ft`;
  }

  getViewIcon(viewType: string | undefined): string {
    if (!viewType) return 'home';
    
    const viewIcons: { [key: string]: string } = {
      ocean: 'waves',
      city: 'location_city',
      mountain: 'terrain',
      garden: 'local_florist',
      pool: 'pool',
      courtyard: 'account_balance',
      street: 'traffic',
      interior: 'home'
    };
    
    return viewIcons[viewType] || 'home';
  }

  // Floor options for filter
  getFloorOptions(): number[] {
    const floors = new Set<number>();
    const roomsList = this.rooms();
    roomsList.forEach((room: Room) => {
      if (room.floor !== undefined) {
        floors.add(room.floor);
      }
    });
    return Array.from(floors).sort((a, b) => a - b);
  }

  // View toggle
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'grid' : 'table');
  }

  // Navigation
  navigateToRoom(roomId: string): void {
    // Will be implemented with router navigation
  }

  editRoom(roomId: string): void {
    // Will be implemented with router navigation
  }

  deleteRoom(room: Room): void {
    // Will be implemented with confirmation dialog
  }
}