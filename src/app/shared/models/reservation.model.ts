export interface Reservation {
  _id: string;
  store?: string;
  guest: Guest | string;
  rooms: ReservationRoom[];
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
  paymentInfo?: PaymentInfo;
  guestDetails: GuestDetails;
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

export interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
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

export interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor?: number;
  status: RoomStatus;
  features?: RoomFeatures;
  photos?: string[];
}

export interface ReservationRoom {
  room: Room | string;
  guests: {
    adults: number;
    children: number;
  };
}

export interface ReservationPricing {
  roomRates?: RoomRate[];
  subtotal: number;
  taxes: number;
  fees?: Fees;
  discounts?: Discounts;
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

export interface GuestDetails {
  primaryGuest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  additionalGuests?: AdditionalGuest[];
  totalAdults: number;
  totalChildren: number;
}

export interface AdditionalGuest {
  firstName?: string;
  lastName?: string;
  age?: number;
  relationship?: string;
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
  | 'no_show';

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
  | 'airbnb';

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
  guest: string; // Required ObjectId - must be created first if new
  guestDetails: GuestDetails; // Required by schema - missing from payload!
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
  pricing: Omit<ReservationPricing, 'balance'>;
  paymentInfo?: {
    method?: PaymentMethod;
    status?: PaymentStatus;
    transactions?: Transaction[]; // Required by schema - missing from payload!
  };
  specialRequests?: string;
  internalNotes?: string;
  createdBy: string; // Required by schema
}

export interface UpdateReservationDto {
  guest?: string;
  guestDetails?: GuestDetails; // Include guestDetails for updates too
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