# Reservation Form Component Decomposition Guide

## Overview
The monolithic reservation form component has been refactored into smaller, focused step components for better maintainability, testability, and separation of concerns.

## Architecture

### New Structure

```
reservation-form/
├── reservation-form.component.ts (DEPRECATED - original ~1181 lines)
├── reservation-form.component.html (DEPRECATED)
├── reservation-form.component.scss
│
├── reservation-form-refactored.component.ts (NEW - Parent coordinator ~400 lines)
├── reservation-form-refactored.component.html (NEW - Template ~200 lines)
│
└── steps/
    ├── reservation-details-step.component.ts (Step 1)
    ├── room-selection-step.component.ts (Step 2)
    ├── guest-details-step.component.ts (Step 3)
    ├── pricing-summary-step.component.ts (Step 4)
    └── index.ts (Exports all step components)
```

### New Services

```
shared/services/
├── pricing.service.ts (NEW - Pricing calculations)
```

## Component Breakdown

### 1. ReservationFormComponent (Parent Coordinator)
**Lines of Code:** ~400 (vs original 1181)  
**Responsibility:** Orchestrate stepper, manage form state, handle submission

**Key Responsibilities:**
- Form initialization and state management
- Stepper coordination
- Data fetching and population
- Room selection and guest management
- Form submission and API calls

**Key Methods:**
- `onRoomToggled(event)` - Handles room selection/deselection
- `onRoomRemoved(roomId)` - Removes a room from the form
- `onAddGuest()` - Adds a new guest to the additional guests array
- `onRemoveGuest(index)` - Removes a guest
- `onSubmit()` - Validates and submits the reservation
- `calculatePricingFromRooms()` - Recalculates pricing
- `calculateNights()` - Calculates number of nights

**State Management:**
```typescript
loading = signal<boolean>(false);
error = signal<string | null>(null);
numberOfNights = signal<number>(0);
isEditing = computed(() => !!this.id());
```

**Resource-Based Data Fetching:**
```typescript
// Auto-fetches available rooms based on date changes
availableRoomsResource = rxResource({
  params: () => ({ checkIn: this.checkIn(), checkOut: this.checkOut() }),
  stream: ({ params }) => this.getAvailableRooms(params),
});

// Auto-loads reservation when ID changes (edit mode)
reservation = rxResource({
  params: () => ({ id: this.id() }),
  stream: ({ params }) => this.getReservation(params.id!),
});
```

---

### 2. ReservationDetailsStepComponent (Step 1)
**Lines of Code:** ~100  
**Responsibility:** Display and manage check-in/check-out dates

**Inputs:**
- `reservationForm: FormGroup` - Parent form reference
- `numberOfNights: () => number` - Computed number of nights

**Template Features:**
- Check-in date picker
- Check-out date picker
- Check-in/checkout times
- Display number of nights

**Form Fields Used:**
- `checkInDate`
- `checkOutDate`
- `expectedCheckInTime`
- `expectedCheckOutTime`

---

### 3. RoomSelectionStepComponent (Step 2)
**Lines of Code:** ~180  
**Responsibility:** Display available rooms and manage room selection

**Inputs:**
- `reservationForm: FormGroup` - Parent form reference
- `availableRooms: AvailableRoom[]` - Available rooms from resource
- `numberOfNights: () => number` - Current number of nights

**Outputs:**
- `roomToggled: EventEmitter<{ roomId, index, add: boolean }>` - Emitted when room added/removed
- `roomRemoved: EventEmitter<string>` - Emitted when room removed via UI button

**Template Features:**
- Grid display of available rooms
- Room amenities display
- Room capacity information
- Price per night display
- Selected rooms summary card
- Add/remove room buttons

**Computed Signals:**
```typescript
selectedRooms = computed(() => {
  // Maps form controls to display objects with room data
  return roomsArray.controls.map(control => ({
    roomId,
    roomType,
    roomNumber,
    nights,
    totalPrice,
    adults,
    children,
  }));
});
```

---

### 4. GuestDetailsStepComponent (Step 3)
**Lines of Code:** ~150  
**Responsibility:** Manage primary guest and additional guests information

**Inputs:**
- `guestDetailsForm: FormGroup` - The guestDetails FormGroup

**Outputs:**
- `guestAdded: EventEmitter<void>` - Emitted when "Add Guest" button clicked
- `guestRemoved: EventEmitter<number>` - Emitted when guest removed

**Template Features:**
- Primary guest information form (firstName, lastName, email, phone)
- Additional guest details (address, city, country, etc.)
- Additional guests array management
- Add/remove guest buttons

**Form Fields Used (from guestDetails):**
- `primaryGuest.firstName`
- `primaryGuest.lastName`
- `primaryGuest.email`
- `primaryGuest.phone`
- `primaryGuest.address`
- `primaryGuest.city`
- `primaryGuest.stateProvince`
- `primaryGuest.postalCode`
- `primaryGuest.country`
- `primaryGuest.nationalId`
- `additionalGuests[].firstName`
- `additionalGuests[].lastName`
- `additionalGuests[].email`
- `additionalGuests[].phone`

---

### 5. PricingSummaryStepComponent (Step 4)
**Lines of Code:** ~180  
**Responsibility:** Display pricing breakdown and summary

**Inputs:**
- `reservationForm: FormGroup` - Parent form reference (read-only display)

**Template Features:**
- Room pricing breakdown table
- Subtotal display
- Taxes display
- Service fees display
- Discount display
- Early bird discount display
- Total amount with emphasis
- Payment method and status
- Important notes section

**Computed Signals:**
```typescript
roomPricingBreakdown = computed(() => {
  // Maps rooms to pricing display objects
  return rooms.map(room => ({
    roomType,
    roomNumber,
    nights,
    pricePerNight,
    subtotal,
  }));
});

pricing = computed(() => {
  // Extracts pricing values from form
  return {
    subtotal,
    taxes,
    serviceFee,
    totalDiscount,
    earlyBirdDiscount,
    total,
  };
});
```

---

## Form Structure

The form maintains the same nested structure for backward compatibility:

```typescript
reservationForm = this.fb.group({
  // Guest Information
  guestDetails: this.fb.group({
    primaryGuest: this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      // ... additional fields
    }),
    additionalGuests: this.fb.array([]), // Managed by GuestDetailsStepComponent
    totalAdults: [1],
    totalChildren: [0],
  }),

  // Reservation Details (managed by ReservationDetailsStepComponent)
  checkInDate: [new Date()],
  checkOutDate: [new Date()],
  expectedCheckInTime: ['15:00'],
  expectedCheckOutTime: ['11:00'],

  // Rooms (managed by RoomSelectionStepComponent)
  rooms: this.fb.array([]),

  // Pricing (displayed by PricingSummaryStepComponent)
  pricing: this.fb.group({
    subtotal: [0],
    taxes: [0],
    serviceFee: [0],
    totalDiscount: [0],
    earlyBirdDiscount: [0],
    total: [{ value: 0, disabled: true }],
  }),

  // Payment Info
  paymentInfo: this.fb.group({
    method: ['card'],
    status: ['pending'],
  }),

  // Metadata
  specialRequests: [''],
  internalNotes: [''],
  bookingSource: ['walk_in'],
  status: ['pending'],
  store: [''],
  createdBy: [''],
});
```

---

## Data Flow

### 1. Creating a New Reservation

```
User fills form → Step 1 (Dates & Rooms)
  ↓
Selects rooms → Step 2 (Guest Details)
  ↓
Enters guest info → Step 3 (Pricing)
  ↓
Reviews pricing → Step 4 (Review)
  ↓
Submits → Parent validates and calls API
```

### 2. Editing an Existing Reservation

```
Load component with reservation ID
  ↓
reservation rxResource fetches data
  ↓
populateFormWithReservation() populates all fields
  ↓
Child components display data in read/edit mode
```

### 3. Room Selection Event Flow

```
User clicks room in RoomSelectionStepComponent
  ↓
Component emits roomToggled event
  ↓
Parent component onRoomToggled() handler:
   - Adds/removes room from FormArray
   - Triggers calculatePricingFromRooms()
   - Recalculates numberOfNights
  ↓
PricingSummaryStepComponent computed signals update
  ↓
UI re-renders with updated pricing
```

---

## PricingService

**New Service:** `shared/services/pricing.service.ts`

```typescript
class PricingService {
  // Calculate complete pricing from rooms array
  calculatePricingFromRooms(
    rooms: any[],
    taxRate: number = 0.1
  ): PricingCalculation

  // Calculate total with all components
  calculateTotal(
    subtotal: number,
    taxes: number,
    serviceFee: number,
    totalDiscount: number,
    earlyBirdDiscount: number
  ): number

  // Calculate subtotal from rooms
  calculateSubtotal(rooms: any[]): number

  // Apply percentage-based discount
  applyPercentageDiscount(amount: number, percentage: number): number

  // Apply fixed discount
  applyFixedDiscount(amount: number, discount: number): number
}
```

---

## Migration Steps

### Step 1: Switch Template Reference
Replace in your routing module:
```typescript
// OLD
templateUrl: './reservation-form.component.html',

// NEW
templateUrl: './reservation-form-refactored.component.html',
```

### Step 2: Update Component Imports
```typescript
import {
  ReservationDetailsStepComponent,
  RoomSelectionStepComponent,
  GuestDetailsStepComponent,
  PricingSummaryStepComponent,
} from './steps';
```

### Step 3: Update Module/Standalone Declarations
```typescript
imports: [
  // ... existing imports
  ReservationDetailsStepComponent,
  RoomSelectionStepComponent,
  GuestDetailsStepComponent,
  PricingSummaryStepComponent,
]
```

### Step 4: Test Functionality
- [ ] Create new reservation
- [ ] Edit existing reservation
- [ ] Room selection works
- [ ] Pricing calculations correct
- [ ] Guest additions/removals work
- [ ] Form validation works
- [ ] API calls succeed

---

## Benefits of Refactored Architecture

### 1. **Separation of Concerns**
Each component has a single, clear responsibility:
- ReservationDetailsStepComponent: Just dates and times
- RoomSelectionStepComponent: Just room selection UI
- GuestDetailsStepComponent: Just guest management
- PricingSummaryStepComponent: Just pricing display

### 2. **Improved Testability**
- Each component can be tested independently
- Easier to mock inputs and test outputs
- Simpler test setup with smaller components
- Better unit test coverage

### 3. **Better Code Maintainability**
- Reduced component complexity (400 lines vs 1181)
- Easier to locate and fix issues
- Clearer component responsibilities
- Reduced cognitive load when reading code

### 4. **Reusability**
- Step components can be reused in other forms
- PricingService can be used elsewhere
- Individual step logic can be extracted to custom features

### 5. **Scalability**
- Easier to add new steps without bloating component
- New features isolated to specific components
- Reduced side effects between components

### 6. **Better Performance**
- Change detection scoped to specific components
- Easier to optimize individual steps
- Computed signals prevent unnecessary recalculations

---

## Data Binding Examples

### Example 1: Display Check-in Date in Parent
```typescript
{{ reservationForm.get('checkInDate')?.value | date: 'MMM d, y' }}
```

### Example 2: Access Room Data in Child
```typescript
<div *ngFor="let room of selectedRooms()">
  {{ room.roomType }} - {{ room.totalPrice | currency }}
</div>
```

### Example 3: Listen to Room Selection Changes
```typescript
onRoomToggled(event: { roomId: string; index: number; add: boolean }) {
  if (event.add) {
    // Add room to FormArray
  } else {
    // Remove room from FormArray
  }
}
```

---

## Debugging Tips

### 1. Check Form State
```typescript
console.log('Form value:', this.reservationForm.getRawValue());
console.log('Form valid:', this.reservationForm.valid);
```

### 2. Check Computed Values
```typescript
console.log('Number of nights:', this.numberOfNights());
console.log('Is editing:', this.isEditing());
```

### 3. Check Resource Status
```typescript
console.log('Available rooms:', this.availableRoomsResource.value());
console.log('Reservation data:', this.reservation.value());
```

### 4. Verify Event Emissions
Add logging in step components:
```typescript
(roomToggled)="onRoomToggled($event); console.log('Room toggled:', $event)"
```

---

## Future Enhancements

1. **Extract pricing calculations to shared service** ✓ Done
2. **Create separate service for room operations**
3. **Add guest autocomplete/search component**
4. **Create reusable form validation service**
5. **Add payment method selection component**
6. **Create reservation summary component**

---

## File Locations

```
/workspace/frontend/shopbot-back-office/src/app/
├── menu/hms/front-desk/reservations/reservation-form/
│   ├── reservation-form.component.ts (DEPRECATED)
│   ├── reservation-form.component.html (DEPRECATED)
│   ├── reservation-form.component.scss
│   ├── reservation-form-refactored.component.ts ← NEW PRIMARY COMPONENT
│   ├── reservation-form-refactored.component.html
│   └── steps/
│       ├── index.ts
│       ├── reservation-details-step.component.ts
│       ├── room-selection-step.component.ts
│       ├── guest-details-step.component.ts
│       └── pricing-summary-step.component.ts
│
└── shared/services/
    └── pricing.service.ts ← NEW SERVICE
```

---

## Quick Reference

| Component | Lines | Responsibility |
|-----------|-------|-----------------|
| ReservationFormComponent | ~400 | Orchestrates stepper and form submission |
| ReservationDetailsStepComponent | ~100 | Manages dates and times |
| RoomSelectionStepComponent | ~180 | Displays and selects rooms |
| GuestDetailsStepComponent | ~150 | Manages guest information |
| PricingSummaryStepComponent | ~180 | Displays pricing breakdown |
| PricingService | ~100 | Pricing calculations |

**Total:** ~1110 lines of focused, organized code (vs 1181 lines monolithic)
