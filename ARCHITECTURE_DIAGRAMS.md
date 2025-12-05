# Reservation Form Architecture - Visual Guide

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│               ReservationFormComponent (Parent)                  │
│                      (~400 lines)                                │
│                                                                   │
│  • Form initialization & state management                        │
│  • Stepper coordination                                          │
│  • Room & guest event handling                                   │
│  • API calls (create/update)                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
        ┌────────▼──────┐  ┌──▼──────────┐ │
        │                │  │             │ │
   ┌────▼─────────┐  ┌──▼──▼──────────┐  │ │
   │              │  │                │  │ │
   │  Step 1      │  │  Step 2        │  │ │
   │  Dates &     │  │  Room          │  │ │
   │  Rooms       │  │  Selection     │  │ │
   │              │  │                │  │ │
   │ ~100 lines   │  │ ~180 lines     │  │ │
   └──────────────┘  └────────────────┘  │ │
                                        │ │
                                  ┌─────▼─▼──────────┐
                                  │                  │
                              ┌───▼────────┐  ┌────▼──────────┐
                              │            │  │               │
                              │ Step 3     │  │ Step 4         │
                              │ Guest      │  │ Pricing        │
                              │ Details    │  │ Summary        │
                              │            │  │                │
                              │ ~150 lines │  │ ~180 lines     │
                              └────────────┘  └────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  Component Initialization                     │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│           Form Created & Event Listeners Setup               │
│  • Room changes → calculatePricingFromRooms()                 │
│  • Date changes → calculateNights()                           │
│  • ID present → Load existing reservation                     │
└──────────────────────────────────────────────────────────────┘
           │
           ├─────────────────────┬─────────────────────┐
           ▼                     ▼                     ▼
    ┌─────────────┐      ┌─────────────┐      ┌──────────────┐
    │   Create    │      │    Edit     │      │   Normal     │
    │ Reservation │      │ Reservation │      │   Mode       │
    └─────────────┘      └─────────────┘      └──────────────┘
           │                   │
           │                   ▼
           │            ┌──────────────────┐
           │            │ Load Reservation │
           │            │ from API         │
           │            │ (rxResource)     │
           │            └──────────────────┘
           │                   │
           │                   ▼
           │            ┌──────────────────┐
           │            │ Populate Form    │
           │            │ with Data        │
           │            └──────────────────┘
           │                   │
           └─────────┬─────────┘
                     ▼
          ┌──────────────────────┐
          │   Render Step 1      │
          │  (Dates & Rooms)     │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Date Selection      │
          │  Changes             │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Fetch Available      │
          │ Rooms               │
          │ (rxResource)        │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Display Available    │
          │ Rooms (Step 2)       │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ User Selects Rooms   │
          │ (roomToggled event)  │
          └──────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   Add Room             Update FormArray
   to FormArray         & Recalculate
                        Pricing
        │                         │
        └────────────┬────────────┘
                     ▼
          ┌──────────────────────┐
          │ Continue to Step 3   │
          │ (Guest Details)      │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Enter Guest Info     │
          │ Add/Remove Guests    │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Continue to Step 4   │
          │ (Pricing Summary)    │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Display Pricing      │
          │ Breakdown            │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Review & Confirm     │
          │ Submit Form          │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Transform Form to DTO│
          │ Call API             │
          └──────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
    Success                   Error
    Navigate                  Show Error
    to List                   Message
```

## State Management

```
┌─────────────────────────────────────────────────────┐
│           ReservationFormComponent State             │
├─────────────────────────────────────────────────────┤
│ SIGNALS (Mutable State)                             │
│ • loading: boolean                                  │
│ • error: string | null                              │
│ • editingReservation: Reservation | null            │
│ • numberOfNights: number                            │
│ • checkIn: Date (from form changes)                 │
│ • checkOut: Date (from form changes)                │
│ • id: string (from route params)                    │
│                                                     │
│ COMPUTED SIGNALS (Derived State)                    │
│ • isEditing: () => !!id()                           │
│ • currency: () => currencyCode                      │
│                                                     │
│ RESOURCES (Async Data)                              │
│ • availableRoomsResource                            │
│   └─ Auto-fetches when dates change                 │
│   └─ Params: { checkIn, checkOut }                 │
│   └─ Stream: roomsService.getAvailableRooms()       │
│                                                     │
│ • reservation                                       │
│   └─ Auto-fetches when ID changes                   │
│   └─ Params: { id }                                │
│   └─ Stream: reservationService.getReservationById()│
│                                                     │
│ FORM (Reactive Forms)                               │
│ • reservationForm: FormGroup                        │
│   ├─ guestDetails (FormGroup)                       │
│   │  ├─ primaryGuest (FormGroup)                    │
│   │  ├─ additionalGuests (FormArray)                │
│   │  ├─ totalAdults                                 │
│   │  └─ totalChildren                               │
│   ├─ checkInDate                                    │
│   ├─ checkOutDate                                   │
│   ├─ expectedCheckInTime                            │
│   ├─ expectedCheckOutTime                           │
│   ├─ rooms (FormArray)                              │
│   ├─ pricing (FormGroup)                            │
│   ├─ paymentInfo (FormGroup)                        │
│   ├─ specialRequests                                │
│   └─ (other fields...)                              │
└─────────────────────────────────────────────────────┘
```

## Event Communication

```
RoomSelectionStepComponent
    │
    ├─ @Input: reservationForm
    ├─ @Input: availableRooms
    ├─ @Input: numberOfNights
    │
    ├─ @Output: roomToggled
    │    └─> Parent.onRoomToggled(event)
    │        └─> Add/Remove room from FormArray
    │        └─> calculatePricingFromRooms()
    │        └─> PricingSummaryStepComponent updates
    │
    └─ @Output: roomRemoved
         └─> Parent.onRoomRemoved(roomId)
             └─> Remove room from FormArray

GuestDetailsStepComponent
    │
    ├─ @Input: guestDetailsForm
    │
    ├─ @Output: guestAdded
    │    └─> Parent.onAddGuest()
    │        └─> Add FormGroup to additionalGuests array
    │
    └─ @Output: guestRemoved
         └─> Parent.onRemoveGuest(index)
             └─> Remove FormGroup from additionalGuests array
```

## Computed Signals in Step Components

```
RoomSelectionStepComponent.selectedRooms
    │
    └─ computed(() => {
         const roomsArray = form.get('rooms') as FormArray;
         return roomsArray.controls.map(control => ({
           roomId,
           roomType,
           roomNumber,
           nights,
           totalPrice,
           adults,
           children,
         }));
       })
    │
    └─> Updates automatically when rooms FormArray changes
    └─> Used in template to display selected rooms

PricingSummaryStepComponent.pricing
    │
    └─ computed(() => {
         const pricing = form.get('pricing')?.value;
         return {
           subtotal,
           taxes,
           serviceFee,
           totalDiscount,
           earlyBirdDiscount,
           total,
         };
       })
    │
    └─> Updates automatically when pricing form group changes
    └─> Used in template to display pricing breakdown
```

## Event Chain: Room Selection

```
User clicks "Add Room"
    │
    ▼
RoomSelectionStepComponent.toggleRoom(roomId, index)
    │
    ▼
Component emits: roomToggled.emit({
  roomId: 'room123',
  index: 0,
  add: true
})
    │
    ▼
Parent.onRoomToggled(event)
    │
    ├─ Get available room by ID
    ├─ Create new FormGroup with room data
    └─ Add to roomsArray FormArray
    │
    ▼
roomsArray valueChanges fires
    │
    ├─ calculatePricingFromRooms()
    │  ├─ Sum room prices × nights
    │  ├─ Calculate taxes (10%)
    │  └─ Update pricing FormGroup
    │
    └─> PricingSummaryStepComponent.roomPricingBreakdown
        computed signal re-runs
        └─> Template re-renders with new pricing
```

## Service Interaction

```
┌────────────────────────────────────────────────┐
│  PricingService.calculatePricingFromRooms()    │
├────────────────────────────────────────────────┤
│                                                 │
│  INPUT: rooms[], taxRate                       │
│                                                 │
│  PROCESS:                                       │
│  1. Loop through rooms                         │
│  2. Sum (price × nights) for each room         │
│  3. Calculate subtotal                         │
│  4. Apply tax rate (default 10%)               │
│  5. Add other fees                             │
│  6. Apply discounts                            │
│  7. Calculate total                            │
│                                                 │
│  OUTPUT: PricingCalculation {                  │
│    subtotal,                                   │
│    taxes,                                      │
│    serviceFee,                                 │
│    totalDiscount,                              │
│    earlyBirdDiscount,                          │
│    total                                       │
│  }                                              │
│                                                 │
└────────────────────────────────────────────────┘
```

## Stepper Flow

```
Step 1: Reservation Details
├─ Check-in Date (required)
├─ Check-out Date (required)
├─ Expected Times (optional)
└─ Validation: Dates must be valid
   └─ Cannot proceed if invalid

   ▼ [Next Button]

Step 2: Room Selection
├─ Available Rooms Display
├─ Room Selection (required: at least 1)
└─ Validation: At least one room selected
   └─ Cannot proceed if invalid

   ▼ [Next Button]

Step 3: Guest Information
├─ Primary Guest (required)
├─ Additional Guests (optional)
└─ Validation: Primary guest complete
   └─ Cannot proceed if invalid

   ▼ [Next Button]

Step 4: Pricing Summary
├─ Room Breakdown
├─ Pricing Summary
├─ Payment Info
└─ Review Info
   └─ [Submit Button] - Creates/Updates reservation
```

## Form Validation Rules

```
guestDetails:
  ├─ primaryGuest:
  │  ├─ firstName: required, min 2 chars
  │  ├─ lastName: required, min 2 chars
  │  ├─ email: required, valid email format
  │  └─ phone: required, phone number format
  │
  ├─ additionalGuests: FormArray
  │  └─ No specific validation
  │
  ├─ totalAdults: required, min 1
  └─ totalChildren: min 0

checkInDate: required
checkOutDate: required
rooms: FormArray (at least 1 required via component logic)

pricing:
  ├─ subtotal: required, min 0
  ├─ taxes: min 0
  ├─ total: disabled (calculated)
  └─ balance: disabled (calculated)

paymentInfo:
  ├─ method: required
  └─ status: optional
```

## Responsive Breakpoints

```
Mobile (< 768px):
  └─ Stepper vertical
  └─ Single column layouts
  └─ Full-width form fields
  └─ Bottom action buttons

Tablet (768px - 1024px):
  └─ Stepper horizontal (if space)
  └─ 2-column layouts where needed
  └─ Optimized form fields

Desktop (> 1024px):
  └─ Stepper horizontal
  └─ Multi-column layouts
  └─ Side-by-side comparisons
  └─ Full-width optimizations
```

---

**Note**: All diagrams represent the refactored architecture with separated step components.
