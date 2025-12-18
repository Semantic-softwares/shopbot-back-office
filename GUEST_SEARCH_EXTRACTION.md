# Guest Search Component Extraction

## Overview
Extracted guest search functionality into a standalone, reusable `GuestSearchComponent` that handles searching for guests and emitting selected guest details back to its parent component.

## New Component: `GuestSearchComponent`
**Location:** `/src/app/shared/components/guest-search/`

### Files Created:
- `guest-search.component.ts` - Component logic with guest search functionality
- `guest-search.component.html` - Autocomplete form field template
- `guest-search.component.scss` - Component styles

### Key Features:
- **Search Functionality**: Searches guests from the backend with debounce (300ms)
- **Minimum Search Length**: Requires at least 2 characters to search
- **Autocomplete UI**: Material autocomplete with guest display (name and email)
- **Loading State**: Shows spinner while searching
- **Guest Selection**: Emits `guestSelected` event with full guest details when a guest is selected
- **Search Clear**: Emits `searchCleared` event when search is cleared
- **Customizable**: Supports custom label and placeholder text via inputs

### Inputs:
```typescript
@Input() placeholder = 'Search for guest by name or email...';
@Input() label = 'Select Guest';
@Input() initialValue = '';
@Input() storeId: string | undefined;
```

### Outputs:
```typescript
@Output() guestSelected = new EventEmitter<Guest>();
@Output() searchCleared = new EventEmitter<void>();
```

## Updated Components

### 1. `GuestDetailsStepComponent`
**Location:** `/src/app/menu/hms/front-desk/reservations/reservation-form/steps/guest-details-step/`

**Changes:**
- Removed internal guest search logic
- Now uses `GuestSearchComponent` for primary guest selection
- Added `onPrimaryGuestSelected(guest: Guest)` handler that patches the reservation form
- Added `onPrimaryGuestSearchCleared()` handler that clears the guest field
- Added `storeId` input to pass to child guest-search component
- Removed `guestSearchChange` output (no longer needed)

**Template Changes:**
- Replaced raw autocomplete form field with `<app-guest-search>` component
- Simplified primary guest selection UI
- Maintains separate additional guests management section

### 2. `ReservationFormComponent`
**Location:** `/src/app/menu/hms/front-desk/reservations/reservation-form/`

**Changes:**
- Removed `setupGuestAutocomplete()` method
- Removed `onGuestSelected()` method
- Removed `displayGuestFn()` method
- Removed `getGuestDisplayText()` method
- Removed `populateGuestDetails()` method
- Removed `onGuestSearchClear()` method
- Removed unused `selectedGuest` signal
- Removed `guestSearchControl` FormControl
- Simplified `handleGuestAndCreateReservation()` to `createOrUpdateReservation()` - now just uses the guest ID from the form directly
- Updated `transformFormToReservationDto()` to accept only formData (removed guestId parameter)
- Removed unused imports: `FormControl`, `MatAutocompleteModule`, `debounceTime`, `distinctUntilChanged`, `switchMap`, `startWith`

**Template Changes:**
- Updated `<app-guest-details-step>` props to include `[filteredGuests]`, `[isLoadingGuests]`, and `[storeId]`

## Architecture Benefits

1. **Separation of Concerns**: Guest search logic is now isolated in its own component
2. **Reusability**: `GuestSearchComponent` can be used anywhere in the app where guest search is needed
3. **Simplified Parent Components**: Removed 200+ lines of guest search code from reservation-form
4. **Cleaner Contracts**: Components communicate via well-defined Input/Output properties
5. **Maintainability**: Guest search logic is centralized and easier to update

## Usage Example

```html
<app-guest-search
  label="Select Primary Guest"
  placeholder="Search for guest by name or email..."
  [storeId]="storeId"
  (guestSelected)="onGuestSelected($event)"
  (searchCleared)="onSearchCleared()"
></app-guest-search>
```

## TypeScript Compilation
All files compile without errors. Full validation completed on:
- `guest-search.component.ts`
- `guest-details-step.component.ts`
- `reservation-form.component.ts`
