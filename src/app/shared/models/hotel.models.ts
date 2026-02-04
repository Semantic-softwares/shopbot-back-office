export interface HotelPropertySettings {
  _id?: string;
  store: string;
  hotelName: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  taxRate: number;
  amenities: string[];
  policies: {
    cancellationPolicy: string;
    petPolicy: string;
    smokingPolicy: string;
    childrenPolicy: string;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoomType {
  _id?: string;
  store: string;
  name: string;
  description: string;
  capacity: {
    adults: number;
    children: number;
    maxOccupancy: number;
  };
  bedConfiguration: {
    singleBeds: number;
    doubleBeds: number;
    queenBeds: number;
    kingBeds: number;
  };
  basePrice: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  channexRoomTypeId?: string; // Channex integration
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Room {
  _id?: string;
  store: string;
  roomNumber: string;
  roomType: string | RoomType;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  housekeeping: {
    status: 'clean' | 'dirty' | 'cleaning' | 'inspected';
    lastCleaned?: Date;
    cleanedBy?: string;
    notes?: string;
  };
  currentReservation?: string;
  currentGuest?: string;
  lastCheckOut?: Date;
  features: string[];
  notes?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Guest {
  _id?: string;
  stores: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  idDocument?: {
    type: 'passport' | 'drivers_license' | 'national_id';
    number: string;
    expiryDate?: Date;
    issuingCountry: string;
  };
  preferences: {
    roomType?: string;
    floor?: string;
    smokingRoom: boolean;
    accessibleRoom: boolean;
    bedType?: string;
    dietaryRestrictions?: string[];
    specialRequests?: string;
  };
  loyaltyProgram: {
    membershipNumber?: string;
    tier: 'basic' | 'silver' | 'gold' | 'platinum';
    points: number;
    joinDate?: Date;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  stayHistory: {
    totalStays: number;
    totalNights: number;
    totalSpent: number;
    lastStayDate?: Date;
    averageRating?: number;
  };
  isVip: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  notes?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Reservation {
  _id?: string;
  confirmationNumber: string;
  store: string;
  guest: string | Guest;
  rooms: Array<{
    room: string | Room;
    basePrice: number;
    discountedPrice?: number;
    guests: number;
  }>;
  checkInDate: Date;
  checkOutDate: Date;
  expectedCheckInTime?: string;
  expectedCheckOutTime?: string;
  actualCheckInDate?: Date;
  actualCheckOutDate?: Date;
  nights: number;
  totalGuests: {
    adults: number;
    children: number;
  };
  pricing: {
    roomTotal: number;
    taxes: number;
    fees: number;
    discounts: number;
    totalAmount: number;
  };
  paymentInfo: {
    depositAmount: number;
    depositPaid: boolean;
    depositMethod?: string;
    fullPayment: boolean;
    paymentMethod?: string;
    transactionIds: string[];
  };
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  source: 'direct' | 'online' | 'phone' | 'walk_in' | 'agent';
  specialRequests?: string;
  notes?: string;
  cancellation?: {
    isCancelled: boolean;
    cancelledAt?: Date;
    reason?: string;
    refundAmount?: number;
  };
  modification?: {
    isModified: boolean;
    modifiedAt?: Date;
    originalData?: any;
  };
  createdBy: string;
  lastModifiedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Inventory & Rates Management
export interface LengthOfStayDiscount {
  nights: number;
  percentage: number;
}

export interface PricingRules {
  minStay: number;
  minStayEnabled: boolean;
  losDiscounts: LengthOfStayDiscount[];
  occupancyPricingEnabled: boolean;
}

export interface BlackoutDate {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface RoomInventory {
  [roomTypeId: string]: number;
}

export interface RoomRates {
  [roomTypeId: string]: number;
}

export interface BookingRestrictions {
  closedToArrival: boolean;
  closedToDeparture: boolean;
  stopSales: boolean;
}

export interface InventoryAndRatesData {
  store: string;
  inventory: RoomInventory;
  rates: RoomRates;
  currency: string;
  pricingRules: PricingRules;
  restrictions: BookingRestrictions;
  blackoutDates: BlackoutDate[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Calendar-based Rate Management
export interface DateRateEntry {
  date: string; // ISO format: YYYY-MM-DD
  roomTypeId: string;
  rate: number;
  availability: number;
}

export interface RateUpdatePayload {
  storeId: string;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string; // ISO format: YYYY-MM-DD
  rates: DateRateEntry[];
  currency: string;
}

export interface CalendarDateRange {
  startDate: Date;
  endDate: Date;
}

export interface RoomTypeRate {
  roomTypeId: string;
  roomTypeName: string;
  rates: {
    [date: string]: number; // ISO date -> rate
  };
  availabilities: {
    [date: string]: number; // ISO date -> availability count
  };
}