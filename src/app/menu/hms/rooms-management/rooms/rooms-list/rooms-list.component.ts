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

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { 
  Room, 
  RoomType, 
  RoomFilters, 
  RoomStatus, 
  HousekeepingStatus,
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
    MatFormFieldModule
  ],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.scss'
})
export class RoomsListComponent implements OnInit {
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);

  // Signals for reactive data
  rooms = signal<Room[]>([]);
  roomTypes = signal<RoomType[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

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
    'status',
    'housekeepingStatus',
    'features',
    'actions'
  ];

  // Status options
  statusOptions: RoomStatus[] = ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order'];
  housekeepingOptions: HousekeepingStatus[] = ['clean', 'dirty', 'inspected', 'out_of_order'];

  // Computed properties
  filteredRooms = computed(() => {
    const rooms = this.rooms();
    const filters = this.filterForm?.value;
    
    if (!filters) return rooms;

    return rooms.filter(room => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const roomTypeNameLower = typeof room.roomType === 'object' 
          ? room.roomType.name.toLowerCase() 
          : '';
        
        if (!room.roomNumber.toLowerCase().includes(search) &&
            !roomTypeNameLower.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (filters.status?.length && !filters.status.includes(room.status)) {
        return false;
      }

      // Housekeeping status filter
      if (filters.housekeepingStatus?.length && !filters.housekeepingStatus.includes(room.housekeepingStatus)) {
        return false;
      }

      // Room type filter
      if (filters.roomType?.length) {
        const roomTypeId = typeof room.roomType === 'object' ? room.roomType._id || room.roomType.id : room.roomType;
        if (!filters.roomType.includes(roomTypeId)) {
          return false;
        }
      }

      // Floor filter
      if (filters.floor?.length && room.floor && !filters.floor.includes(room.floor)) {
        return false;
      }

      return true;
    });
  });

  roomStats = computed(() => {
    const rooms = this.filteredRooms();
    return {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length,
      outOfOrder: rooms.filter(r => r.status === 'out_of_order').length
    };
  });

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      housekeepingStatus: [[]],
      roomType: [[]],
      floor: [[]]
    });

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      // Trigger computed update (happens automatically)
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const selectedStore = this.storeStore.selectedStore();
      const storeId = selectedStore?._id;
      
      if (!storeId) {
        this.error.set('No store selected');
        return;
      }

      this.loading.set(true);
      this.error.set(null);
      
      // Load rooms and room types in parallel
      const [rooms, roomTypes] = await Promise.all([
        this.roomsService.getRooms(storeId).toPromise(),
        this.roomsService.getRoomTypes(storeId).toPromise()
      ]);
      
      this.rooms.set(rooms || []);
      this.roomTypes.set(roomTypes || []);
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading data:', error);
      this.error.set('Failed to load rooms data');
      this.loading.set(false);
    }
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
    this.selectedRooms.set([...this.filteredRooms()]);
  }

  clearSelection(): void {
    this.selectedRooms.set([]);
  }

  // Status update methods
  async updateRoomStatus(room: Room, status: RoomStatus): Promise<void> {
    try {
      const roomId = room._id || room.id!;
      await this.roomsService.updateRoomStatus(roomId, status).toPromise();
      await this.loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  }

  async updateHousekeepingStatus(room: Room, status: HousekeepingStatus): Promise<void> {
    try {
      const roomId = room._id || room.id!;
      await this.roomsService.updateHousekeepingStatus(roomId, status).toPromise();
      await this.loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating housekeeping status:', error);
    }
  }

  async bulkUpdateStatus(status: RoomStatus): Promise<void> {
    try {
      const roomIds = this.selectedRooms().map(r => r._id || r.id!);
      await this.roomsService.bulkUpdateRoomStatus(roomIds, status).toPromise();
      this.clearSelection();
      await this.loadData(); // Refresh data
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
    const rooms = this.rooms();
    rooms.forEach((room: Room) => {
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