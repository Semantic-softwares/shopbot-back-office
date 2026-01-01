export interface Reservation {
  _id: string;
  store?: string;
  bookingType: BookingType;
  numberOfAdults: number;
  numberOfChildren: number;
  groupOwnerType?: GroupOwnerType; // Required if bookingType === 'group'
  guest: Guest; // Primary guest (owner for group, individual for single)
  sharers?: Sharer[]; // Only for single bookings
  rooms: ReservationRoom[] | any[];
  checkInDate: Date;
  checkOutDate: Date;
  actualCheckInDate?: Date;
  actualCheckOutDate?: Date;
  expectedCheckInTime?: string;
  expectedCheckOutTime?: string;
  numberOfNights: number;
  status: ReservationStatus;
  bookingSource?: BookingSource;
  pricing: ReservationPricing;
  roomChanges?: any[];
  paymentInfo?: PaymentInfo;
  additionalGuests?: AdditionalGuest[]; // Array of additional guest references
  specialRequests?: string;
  internalNotes?: string;
  cancellation?: CancellationInfo;
  modification?: ModificationInfo;
  extensions?: ReservationExtension[];
  currentExtension?: CurrentExtension;
  confirmationNumber: string;
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingType = 'single' | 'group';
export type GroupOwnerType = 'corporate' | 'travel_agent';

export interface Sharer {
  guest: Guest | string;
  checkInDate: Date;
  checkOutDate: Date;
}

export interface Guest {
  _id: string;
  guestType: GuestType;

  // Individual Fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;

  // Corporate/Agent Fields
  companyName?: string;
  companyRegistrationNumber?: string;
  contactPersonFirstName?: string;
  contactPersonLastName?: string;
  contactPersonTitle?: string;

  // Common Fields
  email: string;
  phone: string;
  nationality?: string;
  address?: Address;
  idDocument?: IdDocument;
  preferences?: GuestPreferences;
  emergencyContact?: EmergencyContact;
  loyaltyProgram?: LoyaltyProgram;
  notes?: string;
  isVip?: boolean;
  vipSince?: Date;
  blacklisted?: boolean;
  blacklistReason?: string;
  blacklistedAt?: Date;
  totalStays?: number;
  totalSpent?: number;
  lastStayDate?: Date;
  stores?: string[]; // Array of store IDs this guest is associated with
  updatedAt: Date
}

export type GuestType = 'individual' | 'corporate' | 'travel_agent';

export interface Room {
  _id: string;
  name: string;
  roomNumber: string;
  roomType: any; // Reference to RoomType or string ID
  floor?: number;
  status: RoomStatus;
  features?: RoomFeatures;
  photos?: string[];
}

export interface ReservationRoom {
  room: Room | string;
  assignedGuest?: Guest | string; // Required for group bookings
  guests: {
    adults: number;
    children: number;
  };
  stayPeriod?: {
    from: Date;
    to: Date;
    numberOfNights: number;
  };
  pricing?: {
    pricePerNight: number;
    totalPrice: number;
    discount?: number;
  };
  notes?: string;
}

export interface ReservationPricing {
  roomRates?: RoomRate[];
  subtotal: number;
  taxes: number;
  fees?: Fees;
  discounts?: number;
  total: number;
  paid: number;
  balance: number;
}



export interface RoomRate {
  date: Date;
  rate: number;
  roomType?: string;
}

export interface Fees {
  serviceFee?: number;
  cleaningFee?: number;
  resortFee?: number;
  other?: number;
}

export interface Discounts {
  amount?: number;
  reason?: string;
  code?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactions?: Transaction[];
}

export interface Transaction {
  date: Date;
  amount: number;
  method: string;
  reference?: string;
  status: string;
}

export interface AdditionalGuest {
  guest: Guest | string; // Reference to Guest document
  totalAdults: number;
  totalChildren: number;
}

export interface CancellationInfo {
  isCancelled: boolean;
  cancelledAt?: Date;
  cancelledBy?: string;
  reason?: string;
  refundAmount?: number;
  cancellationFee?: number;
}

export interface ModificationInfo {
  isModified: boolean;
  modifiedAt?: Date;
  modifiedBy?: string;
  originalData?: any;
  modificationNotes?: string;
}

export interface ReservationExtension {
  _id?: string;
  requestedBy: string;
  requestedAt: Date;
  originalCheckOutDate: Date;
  newCheckOutDate: Date;
  additionalNights: number;
  additionalCost: number;
  status: ExtensionStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  isProcessed?: boolean;
  processedAt?: Date;
  // Payment information
  paymentInfo?: {
    status: 'paid' | 'pending' | 'partial';
    method: string;
    amount: number;
    transactionReference?: string;
    notes?: string;
  };
}

export interface CurrentExtension {
  isActive: boolean;
  extensionId?: string;
  totalExtensionCost?: number;
  totalExtensionNights?: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IdDocument {
  type: 'passport' | 'national_id' | 'drivers_license' | 'other';
  number: string;
  expiryDate?: Date;
  issuingCountry?: string;
}

export interface GuestPreferences {
  roomType?: string;
  smokingPreference?: 'non_smoking' | 'smoking' | 'no_preference';
  bedPreference?: 'single' | 'double' | 'king' | 'queen' | 'twin' | 'no_preference';
  floorPreference?: 'low' | 'high' | 'middle' | 'no_preference';
  specialRequests?: string[];
  dietaryRequirements?: string[];
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export interface LoyaltyProgram {
  memberId?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
}

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

// Enums and Types
export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'checked_in' 
  | 'checked_out' 
  | 'cancelled' 
  | 'no_show'
  | 'reserved';

export type RoomStatus = 
  | 'available' 
  | 'occupied' 
  | 'maintenance' 
  | 'cleaning' 
  | 'out_of_order';

export type BookingSource = 
  | 'direct' 
  | 'phone' 
  | 'online' 
  | 'walk_in' 
  | 'booking_com' 
  | 'expedia' 
  | 'airbnb'
  | 'travel_agent'
  | 'corporate';

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'bank_transfer' 
  | 'mobile_money' 
  | 'online';

export type PaymentStatus = 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'refunded';

export type ExtensionStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected';

// DTOs for API operations
export interface CreateReservationDto {
  store: string; // Required by schema
  guest: string; // Required ObjectId - primary guest
  additionalGuests?: {
    guest: string; // Guest ObjectId reference
    totalAdults: number;
    totalChildren: number;
  }[];
  rooms: {
    room: string; // Schema expects 'room' not 'roomId'
    guests: { adults: number; children: number };
  }[];
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number; // Required by schema
  expectedCheckInTime?: string;
  expectedCheckOutTime?: string;
  bookingSource?: BookingSource;
  pricing: ReservationPricing;
  paymentInfo?: {
    method?: PaymentMethod | any;
    status?: PaymentStatus | any;
  };
  specialRequests?: string;
  internalNotes?: string;
  createdBy: string; // Required by schema
}

export interface UpdateReservationDto {
  guest?: string;
  additionalGuests?: {
    guest: string; // Guest ObjectId reference
    totalAdults: number;
    totalChildren: number;
  }[];
  rooms?: {
    room: string; // Updated to match schema
    guests: { adults: number; children: number };
  }[];
  checkInDate?: Date;
  checkOutDate?: Date;
  numberOfNights?: number;
  actualCheckInDate?: Date;
  actualCheckOutDate?: Date;
  expectedCheckInTime?: string;
  expectedCheckOutTime?: string;
  status?: ReservationStatus;
  pricing?: Partial<ReservationPricing>;
  paymentInfo?: {
    method?: PaymentMethod;
    status?: PaymentStatus;
    transactions?: Transaction[];
  };
  specialRequests?: string;
  internalNotes?: string;
  cancellation?: Partial<CancellationInfo>;
  modification?: Partial<ModificationInfo>;
}

// Filter interfaces for searching and listing
export interface ReservationFilters {
  status?: ReservationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  guestName?: string;
  confirmationNumber?: string;
  roomNumber?: string;
  bookingSource?: BookingSource[];
  paymentStatus?: PaymentStatus[];
}

export interface ReservationListItem {
  _id: string;
  confirmationNumber: string;
  guestName: string;
  roomNumbers: string[];
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  status: ReservationStatus;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  createdAt: Date;
}

// Calendar view interfaces
export interface CalendarReservation {
  _id: string;
  confirmationNumber: string;
  guestName: string;
  roomNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: ReservationStatus;
  totalAmount: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  reservation: CalendarReservation;
}