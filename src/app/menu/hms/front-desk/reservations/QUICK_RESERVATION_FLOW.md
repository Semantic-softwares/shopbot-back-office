# Quick Reservation Flow with Guest Details

## Overview
The quick reservation flow has been refactored to separate concerns and make it easier to manage guest data as a separate child component.

## Architecture

### 1. Guest Details Component (`guest-details.component.ts`)
**Location**: `/src/app/menu/hms/front-desk/reservations/guest-details/`

**Purpose**: Manages guest selection and editing in isolation

**Features**:
- Search existing guests with debounce
- Display selected guest information
- Edit guest details (first name, last name, email, phone, nationality, address)
- Create new guest or change guest
- Supports both single and group bookings

**Inputs**:
- `bookingType`: 'single' | 'group' - determines if group/company details are shown
- `guestData`: Initial guest data (if editing)
- `isEditing`: Whether the component is in edit mode

**Outputs**:
- `guestDataChange`: Emits when guest data is saved
- `guestChanged`: Emits when a guest is selected

**Form Structure**:
```typescript
guestForm = {
  firstName: string (required),
  lastName: string (required),
  email: string (email validation),
  phone: string,
  nationality: string,
  address: {
    street: string,
    city: string,
    state: string,
    country: string,
    postalCode: string
  }
}
```

### 2. Quick Reservation Modal Component (Updated)
**Location**: `/src/app/menu/hms/front-desk/reservations/quick-reservation-modal/`

**Changes**:
- Now imports and uses `GuestDetailsComponent` as a child
- Collects guest data via `onGuestDataChange()` callback
- Passes guest data with the reservation data when closing dialog

**Guest Data Output**:
```typescript
guestData: {
  guestId?: string,
  bookingType: 'single' | 'group',
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  nationality?: string,
  address?: { ... }
}
```

## Data Flow

### 1. User Opens Quick Reservation Modal
- Modal displays with empty guest details component
- User can search for existing guests or create new one

### 2. Guest Selection/Creation
- If existing guest is found → guest details are populated
- If new guest → user manually enters details
- User can edit guest information at any time

### 3. Reservation Form Completion
- User fills in dates, room selection, occupancy
- Total is calculated and displayed in header

### 4. Form Submission
- Dialog closes with `QuickReservationData` that includes:
  - Booking type, dates, room selection, occupancy
  - **Guest data (NEW)**

### 5. Navigation to Reservation Form
- Quick reservation data passed to reservation form component via query params or route state
- Reservation form pre-populates with quick reservation data + guest information

## Query Parameters

The quick reservation modal passes data to the reservation form via query params:

```url
/reservations/new?quickReservation={...}
```

Format:
```typescript
{
  bookingType: 'single' | 'group',
  checkInDate: ISO string,
  checkOutDate: ISO string,
  roomTypeFilter: string,
  selectedRoom: string | string[],
  adults: number,
  children: number,
  guestData: {
    guestId?: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    nationality?: string,
    address?: {
      street?: string,
      city?: string,
      state?: string,
      country?: string,
      postalCode?: string
    }
  }
}
```

## Implementation Notes

### Guest Search
- Debounced to 300ms to avoid excessive API calls
- Requires minimum 2 characters to search
- Uses `GuestService.searchGuests(query)`
- Handles both `Guest[]` and `GuestSearchResponse` response types

### Form Validation
- Guest form required fields: firstName, lastName
- Email is validated for proper email format
- Address fields are optional
- Cannot proceed without filling guest details

### Styling
- Uses Material Design components (mat-card, mat-form-field, etc.)
- Responsive grid layout (1 col mobile, 2 col desktop)
- Blue highlight for selected guest
- Error messages for invalid fields

## Future Enhancements

1. **Company/Group Details**: For group bookings, show company name, tax ID, contact person
2. **Guest History**: Show recent guests for quick selection
3. **Address Autocomplete**: Integration with address autocomplete API
4. **Guest Preferences**: Save room preferences, dietary restrictions, etc.
5. **Bulk Guest Import**: Support importing multiple guests at once
