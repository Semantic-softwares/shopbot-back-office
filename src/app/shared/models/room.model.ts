// Room and Room Type interfaces based on backend schema

export interface RoomFeatures {
  hasBalcony?: boolean;
  hasKitchen?: boolean;
  hasBathtub?: boolean;
  hasAirConditioning?: boolean;
  hasWifi?: boolean;
  hasTV?: boolean;
  oceanView?: boolean;
  cityView?: boolean;
}

export interface AccessibilityFeatures {
  wheelchairAccessible?: boolean;
  hearingAccessible?: boolean;
  visuallyAccessible?: boolean;
  rollInShower?: boolean;
  grabBars?: boolean;
}

export type ViewType = 'ocean' | 'city' | 'mountain' | 'garden' | 'pool' | 'courtyard' | 'street' | 'interior';

export interface RoomTypeCapacity {
  adults: number;
  children: number;
  infants?: number;
}

export interface RoomType {
  _id?: string;
  id?: string;
  store: string;
  name: string;
  description?: string;
  basePrice: number;
  capacity: RoomTypeCapacity;
  amenities: string[];
  photos: string[];
  size?: number; // square feet
  bedConfiguration?: string;
  maxOccupancy: number;
  features: RoomFeatures;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  _id?: string;
  id?: string;
  store: string;
  roomType: string | RoomType; // Can be populated
  roomNumber: string;
  name?: string; // Display name for the room
  description?: string; // Room-specific description
  floor?: number;
  size?: number; // Room-specific size in square feet
  bedConfiguration?: string; // e.g., "1 King Bed", "2 Queen Beds"
  capacity?: RoomTypeCapacity; // Room-specific capacity override
  maxOccupancy?: number; // Room-specific max occupancy
  priceOverride?: number; // Override room type base price
  viewType?: ViewType; // Type of view from room
  status: RoomStatus;
  lastCleaned?: string;
  lastInspected?: string;
  notes?: string;
  maintenanceNotes?: string;
  housekeepingStatus: HousekeepingStatus;
  currentGuest?: string;
  currentReservation?: string;
  features: RoomFeatures;
  accessibilityFeatures?: AccessibilityFeatures;
  qualityRating?: number; // 1-5 star quality rating
  amenities?: string[]; // Room-specific amenities beyond room type
  active: boolean;
  photos: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';

export type HousekeepingStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order';

// Form interfaces for creating/editing
export interface CreateRoomRequest {
  roomType: string;
  roomNumber: string;
  name?: string;
  description?: string;
  floor?: number;
  size?: number;
  bedConfiguration?: string;
  capacity?: RoomTypeCapacity;
  maxOccupancy?: number;
  priceOverride?: number;
  viewType?: ViewType;
  status?: RoomStatus;
  notes?: string;
  maintenanceNotes?: string;
  housekeepingStatus?: HousekeepingStatus;
  features: RoomFeatures;
  accessibilityFeatures?: AccessibilityFeatures;
  qualityRating?: number;
  amenities?: string[];
  photos?: string[];
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {
  lastCleaned?: string;
  lastInspected?: string;
}

export interface CreateRoomTypeRequest {
  name: string;
  description?: string;
  basePrice: number;
  capacity: RoomTypeCapacity;
  amenities: string[];
  photos?: string[];
  size?: number;
  bedConfiguration?: string;
  maxOccupancy: number;
  features: RoomFeatures;
  sortOrder?: number;
}

export interface UpdateRoomTypeRequest extends Partial<CreateRoomTypeRequest> {
  active?: boolean;
}

// API Response interfaces
export interface RoomsListResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
}

export interface RoomTypesListResponse {
  roomTypes: RoomType[];
  total: number;
  page: number;
  limit: number;
}

// Stats interfaces
export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  cleaning: number;
  outOfOrder: number;
  byFloor: Record<number, number>;
  byType: Record<string, number>;
}

export interface RoomTypeStats {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  averageRate: number;
  bookingCount: number;
}

// Filter and search interfaces
export interface RoomFilters {
  status?: RoomStatus[];
  housekeepingStatus?: HousekeepingStatus[];
  roomType?: string[];
  floor?: number[];
  features?: Partial<RoomFeatures>;
  search?: string; // for room number search
  page?: number;
  limit?: number;
}

export interface PaginatedRoomsResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoomTypeFilters {
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  features?: Partial<RoomFeatures>;
  search?: string; // for name/description search
}

// Availability interfaces
export interface AvailabilityRequest {
  checkIn: string;
  checkOut: string;
  roomTypeId?: string;
}

export interface AvailableRoom extends Room {
  isAvailable: boolean;
  rate: number;
  totalCost: number;
}

export interface RoomChangeEntry {
  _id?: string;
  changeType: 'upgrade' | 'downgrade' | 'lateral' | 'maintenance' | 'guest_request';
  effectiveDate: string | Date;
  fromRoom: {
    room: any;
    roomType?: any;
    roomNumber?: string;
    ratePerNight: number;
  };
  toRoom: {
    room: any;
    roomType?: any;
    roomNumber?: string;
    ratePerNight: number;
  };
  pricingDetails: {
    nightsConsumed: number;
    nightsRemaining: number;
    originalRemainingCost: number;
    newRemainingCost: number;
    difference: number;
    adjustmentType: 'charged' | 'refunded' | 'credited' | 'waived' | 'kept_original_rate';
    adjustmentAmount: number;
    adjustmentNotes?: string;
  };
  reason: string;
  performedBy?: any;
  performedAt: string | Date;
  transaction?: any;
}

export interface AvailableRoomType extends RoomType {
  availableRooms: number;
  lowestRate: number;
  highestRate: number;
}

// Common amenities list
export const COMMON_AMENITIES = [
  'Free WiFi',
  'Air Conditioning',
  'Television',
  'Mini Bar',
  'Room Service',
  'Balcony',
  'Kitchen',
  'Bathtub',
  'Shower',
  'Hair Dryer',
  'Iron',
  'Safe',
  'Coffee Maker',
  'Refrigerator',
  'Microwave',
  'Ocean View',
  'City View',
  'Mountain View',
  'Pool View',
  'Garden View',
  'Fitness Center Access',
  'Business Center Access',
  'Concierge Service',
  'Laundry Service',
  'Dry Cleaning',
  'Parking',
  'Valet Parking',
  'Pet Friendly',
  'Smoking Allowed',
  'Non-Smoking',
  'Wheelchair Accessible'
] as const;

export type Amenity = typeof COMMON_AMENITIES[number];

// View type options
export const VIEW_TYPE_OPTIONS = [
  { value: 'ocean', label: 'Ocean View', icon: 'waves' },
  { value: 'city', label: 'City View', icon: 'location_city' },
  { value: 'mountain', label: 'Mountain View', icon: 'terrain' },
  { value: 'garden', label: 'Garden View', icon: 'local_florist' },
  { value: 'pool', label: 'Pool View', icon: 'pool' },
  { value: 'courtyard', label: 'Courtyard View', icon: 'account_balance' },
  { value: 'street', label: 'Street View', icon: 'traffic' },
  { value: 'interior', label: 'Interior View', icon: 'home' }
] as const;

// Bed configuration options
export const BED_CONFIGURATIONS = [
  'Single Bed',
  'Twin Beds',
  'Double Bed',
  'Queen Bed',
  'King Bed',
  '2 Single Beds',
  '2 Twin Beds', 
  '2 Double Beds',
  '2 Queen Beds',
  '2 King Beds',
  '1 King + 1 Sofa Bed',
  '1 Queen + 1 Sofa Bed',
  'Murphy Bed',
  'Bunk Beds',
  'Custom Configuration'
] as const;

// Status color mappings for UI
export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  available: 'success',
  occupied: 'primary',
  maintenance: 'warning',
  cleaning: 'info',
  out_of_order: 'danger'
};

export const HOUSEKEEPING_STATUS_COLORS: Record<HousekeepingStatus, string> = {
  clean: 'success',
  dirty: 'warning',
  inspected: 'info',
  out_of_order: 'danger'
};