/**
 * Live Booking Model
 * Represents a booking from OTA (Channex API)
 */
export interface LiveBookingModel {
  id: string;
  uniqueId: string;
  property: string;
  customerName: any;
  otaName: string;
  arrivalDate: string;
  departureDate: string;
  bookingDate: string;
  roomsCount: number;
  amount: number;
  currency: string;
  status: 'new' | 'modified' | 'cancelled';
  acknowledged: boolean;
  paymentType: string;
  paymentCollect: string;
  revisionId: string;
  raw: any;
}

/**
 * Booking Event
 */
export interface BookingEvent {
  id: string;
  type: string;
  attributes: {
    id: string;
    event: string;
    inserted_at: string;
    ip_address: string | null;
    booking_id: string;
    notes: Record<string, any>;
    user_email: string | null;
    user_name: string;
    booking_revision_id: string | null;
    cc_is_included: boolean;
  };
}

/**
 * Property from Relationships
 */
export interface Property {
  id: string;
  type: string;
  attributes: {
    id: string;
    title: string;
    email: string;
    phone: string;
    currency: string;
    is_active: boolean;
    timezone: string;
    property_type: string;
    [key: string]: any;
  };
}

/**
 * Live Bookings List Response
 */
export interface LiveBookingsListResponse {
  success: boolean;
  bookings: LiveBookingModel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Booking Filters
 */
export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  otaCodes?: string[];
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  departureDateFrom?: string;
  departureDateTo?: string;
  bookingDateFrom?: string;
  bookingDateTo?: string;
  status?: string;
}
