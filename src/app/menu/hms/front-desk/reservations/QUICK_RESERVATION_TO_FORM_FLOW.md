# Quick Reservation Modal to Reservation Form Flow

## Overview

This document describes the complete flow for creating a reservation starting from the Quick Reservation Modal and proceeding to the full Reservation Form with guest management.

## Architecture

### Flow Diagram

```
Quick Reservation Modal (Data Collection)
              ↓
        Closes Modal
              ↓
   Navigate with Query Params
              ↓
Reservation Form (Full Management)
              ↓
   Parse Query Params & Pre-populate
              ↓
   Guest Search & Selection
              ↓
   Submit Reservation
```

## Components Involved

### 1. Quick Reservation Modal
**Location**: `src/app/menu/hms/front-desk/reservations/quick-reservation-modal/`

**Responsibilities**:
- Collect basic reservation data quickly
- Validate dates (no past dates)
- Validate occupancy (adults + children ≤ room capacity)
- Calculate and display total amount
- Navigate to full form with data

**Data Structure**:
```typescript
interface QuickReservationData {
  bookingType: 'single' | 'group';
  checkInDate: Date;
  checkOutDate: Date;
  roomTypeFilter: string;
  selectedRoom: string;
  adults: number;
  children: number;
}
```

**Key Features**:
- Date range picker with Material
- Room type filtering
- Dynamic single/multiple room selection
- Occupancy validation
- Total amount calculation with currency formatting
- Booking type selection (single/group)

**Navigation**:
```typescript
onProceed(): void {
  const data: QuickReservationData = { /* populated data */ };
  this.dialogRef.close();
  this.router.navigate(['/reservations/new'], {
    queryParams: { quickReservation: JSON.stringify(data) }
  });
}
```

### 2. Reservation Form
**Location**: `src/app/menu/hms/front-desk/reservations/reservation-form/`

**Responsibilities**:
- Read quick reservation data from query params
- Pre-populate form with quick reservation data
- Manage guest information (search, select, edit, delete)
- Handle full reservation submission
- Support editing existing reservations

**Key Features**:

#### Query Parameter Handling
```typescript
// Reads 'quickReservation' from query params
private quickReservationQueryParam = computed(() => {
  const param = this.route.snapshot.queryParams['quickReservation'];
  if (param) {
    try {
      return JSON.parse(param) as QuickReservationData;
    } catch (e) {
      console.error('Failed to parse quickReservation query param:', e);
      return null;
    }
  }
  return null;
});

// Effect to process quick reservation data
private processQuickReservation = effect(() => {
  const quickData = this.quickReservationQueryParam();
  if (quickData && !this.isEditing()) {
    this.quickReservationData.set(quickData);
    this.populateFormWithQuickReservation(quickData);
  }
});
```

#### Form Population
```typescript
private populateFormWithQuickReservation(data: QuickReservationData) {
  // Set booking type and dates
  this.reservationForm.patchValue({
    bookingType: data.bookingType,
    checkInDate: new Date(data.checkInDate),
    checkOutDate: new Date(data.checkOutDate),
  });

  // Wait for room search to complete, then populate selected room
  setTimeout(() => {
    const availableRooms = this.availableRoomsResource.value() || [];
    const selectedRoom = availableRooms.find(r => r._id === data.selectedRoom);
    
    if (selectedRoom) {
      const roomsArray = this.reservationForm.get('rooms') as FormArray;
      roomsArray.clear();
      roomsArray.push(this.createRoomForm());
      roomsArray.at(0)?.patchValue({ roomId: data.selectedRoom });
    }

    this.calculateNights();
    this.calculateTotal();
    this.updateRoomCapacityLimits();
    this.updateStepValidation();
    this.cdr.detectChanges();
  }, 500);
}
```

#### Guest Search Functionality
```typescript
// Search for guests with debounce
onGuestSearch(searchTerm: string): void {
  if (!searchTerm || searchTerm.trim().length < 2) {
    this.guestSearchResults.set([]);
    this.filteredGuests.set([]);
    return;
  }

  this.guestSearchLoading.set(true);
  const storeId = this.storeStore.selectedStore()?._id;
  
  this.guestService
    .searchGuests(searchTerm, 1, 10, storeId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.guestSearchResults.set(response.guests || []);
        this.filteredGuests.set(response.guests || []);
        this.guestSearchLoading.set(false);
      },
      error: (error) => {
        console.error('Error searching guests:', error);
        this.guestSearchLoading.set(false);
      },
    });
}

// Handle guest selection
onGuestSelected(guest: Guest): void {
  this.reservationForm.patchValue({
    guest: guest._id,
    guestDetails: {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      nationality: guest.nationality || '',
      address: { /* populated */ },
      emergencyContact: { /* populated */ },
    },
  });

  // Clear search results
  this.guestSearchResults.set([]);
  this.filteredGuests.set([]);
}
```

### 3. Guest Details Step Component
**Location**: `src/app/menu/hms/front-desk/reservations/reservation-form/steps/guest-details-step/`

**Responsibilities**:
- Display guest search UI
- Show selected guest information
- Allow editing guest details
- Manage additional guests
- Create new guests

**Key Features**:

#### Primary Guest Management
- Guest search with autocomplete
- Display selected guest with edit/delete buttons
- Create new guest button
- Pre-populated guest details form

#### Additional Guests Management
- Add multiple additional guests
- Edit each additional guest
- Remove guests
- Select guests from existing guests list

**Template Features**:
```html
<!-- Guest Search -->
<app-guest-search
  label="Select Primary Guest"
  placeholder="Search for guest by name or email..."
  (guestSelected)="onPrimaryGuestSelected($event)"
  (searchCleared)="onPrimaryGuestSearchCleared()"
></app-guest-search>

<!-- Selected Guest with Edit/Delete -->
@if (reservationForm.get('guest')?.value) {
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-2">
        <mat-icon class="text-blue-600">check_circle</mat-icon>
        <h4 class="font-semibold text-blue-900">Selected Guest:</h4>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          mat-icon-button
          color="primary"
          (click)="editSelectedGuest()"
          matTooltip="Edit guest details"
        >
          <mat-icon>edit</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          color="warn"
          (click)="deleteSelectedGuest()"
          matTooltip="Remove selected guest"
        >
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
  </div>
}

<!-- Additional Guests with Edit/Delete -->
@for (guest of additionalGuestsArray.controls; track $index) {
  <div class="flex items-start justify-between gap-4 mb-4">
    <h4>Additional Guest {{ $index + 1 }}</h4>
    <div class="flex gap-1">
      <button
        type="button"
        mat-icon-button
        color="primary"
        (click)="editAdditionalGuest($index)"
      >
        <mat-icon>edit</mat-icon>
      </button>
      <button
        type="button"
        mat-icon-button
        color="warn"
        (click)="removeAdditionalGuest($index)"
      >
        <mat-icon>delete</mat-icon>
      </button>
    </div>
  </div>
}
```

## Form Structure

The reservation form is built with Angular Material Stepper with 4 steps:

### Step 1: Dates & Rooms
- Check-in date
- Check-out date
- Room type filter
- Room selection (single or multiple based on booking type)

### Step 2: Guest Information
- Primary guest search
- Guest details form (auto-populated)
- Additional guests management
- Edit/delete guest functionality

### Step 3: Pricing Summary
- Subtotal calculation
- Taxes
- Fees (service, cleaning, resort)
- Discounts
- Total amount
- Payment status

### Step 4: Review & Confirm
- Review all reservation details
- Confirm and submit

## Data Flow Diagram

```
User clicks "Quick Reservation" in Reservations List
                    ↓
        Quick Reservation Modal Opens
                    ↓
        User fills in basic details:
        - Booking type
        - Dates
        - Room type
        - Room selection
        - Occupancy (adults/children)
                    ↓
        Modal validates and calculates total
                    ↓
        User clicks "Proceed"
                    ↓
        Modal navigates to reservation form:
        router.navigate(['/reservations/new'], {
          queryParams: { quickReservation: JSON.stringify(data) }
        })
                    ↓
        Reservation Form loads
                    ↓
        Effect reads query params
                    ↓
        populateFormWithQuickReservation() is called
                    ↓
        Form is pre-populated with:
        - Booking type
        - Check-in/Check-out dates
        - Selected room
                    ↓
        User proceeds to Guest Information step
                    ↓
        User searches for guest (with debounce)
                    ↓
        Guest results are displayed
                    ↓
        User selects guest
                    ↓
        Guest details are auto-filled
                    ↓
        User can edit/delete guest or add additional guests
                    ↓
        User proceeds through remaining steps
                    ↓
        User submits reservation
                    ↓
        Reservation is created/updated
```

## Key Implementation Details

### Signal Usage
- `quickReservationData`: Stores the quick reservation data passed from modal
- `quickReservationQueryParam`: Computed signal that reads from query params
- `processQuickReservation`: Effect that triggers when quick data is available
- `guestSearchResults`: Stores search results
- `filteredGuests`: Filtered guest list for display
- `guestSearchLoading`: Shows loading state during search

### Reactive Forms
- Form groups for:
  - Guest details (firstName, lastName, email, phone, etc.)
  - Address information
  - Emergency contact
  - Pricing information
  - Payment information
- FormArray for rooms and additional guests
- Custom validators for occupancy and dates

### Material Components Used
- MatDateRangePickerModule: Date range selection
- MatSelectModule: Room type and guest selection
- MatAutocompleteModule: Guest search autocomplete
- MatStepperModule: Multi-step form navigation
- MatCardModule: Card layouts
- MatFormFieldModule: Form field styling
- MatButtonModule: Form actions
- MatIconModule: Visual icons
- MatProgressSpinnerModule: Loading indicators

## Error Handling

- Guest search errors are caught and displayed via snackbar
- Form validation errors are displayed inline
- Query param parsing errors are logged to console
- Room search failures fall back to empty room list

## Testing Checklist

- [ ] Quick modal opens and closes correctly
- [ ] Quick modal navigates to form with query params
- [ ] Reservation form reads and parses query params
- [ ] Form pre-populates with quick reservation data
- [ ] Date and room are correctly set
- [ ] Guest search works with debounce
- [ ] Guest selection updates form correctly
- [ ] Guest details are auto-populated
- [ ] Edit guest opens modal with guest data
- [ ] Delete guest clears selection
- [ ] Additional guests can be added/removed/edited
- [ ] Form stepper navigation works
- [ ] All validations work correctly
- [ ] Reservation submission works
- [ ] Edit existing reservation still works

## Future Enhancements

1. Add quick reservation templates (save frequently used combinations)
2. Bulk create reservations
3. Copy reservation functionality
4. Guest preferences and history
5. Special requests templates
6. Pricing rules based on date ranges
7. Overbooking alerts
8. Capacity optimization suggestions
