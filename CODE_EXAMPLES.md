# Code Examples & Usage Patterns

## Table of Contents
1. [Component Usage Examples](#component-usage-examples)
2. [Event Handling Examples](#event-handling-examples)
3. [Form Manipulation Examples](#form-manipulation-examples)
4. [Service Usage Examples](#service-usage-examples)
5. [Testing Examples](#testing-examples)

---

## Component Usage Examples

### Example 1: Using Step Components in Parent

```typescript
// reservation-form-refactored.component.ts

<app-reservation-details-step
  [reservationForm]="reservationForm"
  [numberOfNights]="numberOfNights">
</app-reservation-details-step>

<app-room-selection-step
  [reservationForm]="reservationForm"
  [availableRooms]="availableRoomsResource.value() || []"
  [numberOfNights]="numberOfNights"
  (roomToggled)="onRoomToggled($event)"
  (roomRemoved)="onRoomRemoved($event)">
</app-room-selection-step>

<app-guest-details-step
  [guestDetailsForm]="getGuestDetailsGroup()"
  (guestAdded)="onAddGuest()"
  (guestRemoved)="onRemoveGuest($event)">
</app-guest-details-step>

<app-pricing-summary-step
  [reservationForm]="reservationForm">
</app-pricing-summary-step>
```

### Example 2: Accessing Form Control in Template

```html
<!-- Display form values -->
<p>{{ reservationForm.get('checkInDate')?.value | date: 'MMM d, y' }}</p>

<!-- Bind to form control -->
<input [formControl]="reservationForm.get('checkInDate')">

<!-- Check validation -->
@if (reservationForm.get('checkInDate')?.hasError('required')) {
  <mat-error>Date is required</mat-error>
}
```

### Example 3: Getting FormArray Control in Component

```typescript
// In component
get additionalGuestsArray(): FormArray {
  return this.guestDetailsForm?.get('additionalGuests') as FormArray;
}

// In template - iterate over FormArray
@for (guest of additionalGuestsArray.controls; track $index; let i = $index) {
  <div [formGroup]="guest">
    <input formControlName="firstName">
    <input formControlName="lastName">
  </div>
}
```

---

## Event Handling Examples

### Example 1: Handle Room Selection

```typescript
// Parent component
onRoomToggled(event: { roomId: string; index: number; add: boolean }) {
  const roomsArray = this.reservationForm.get('rooms') as FormArray;
  const room = this.availableRoomsResource.value()?.find(
    (r) => r._id === event.roomId
  );

  if (event.add && room) {
    // Add room to form array
    roomsArray.push(
      this.fb.group({
        roomId: [room._id, Validators.required],
        roomType: [room.roomType],
        roomNumber: [room.roomNumber],
        stayPeriod: [this.numberOfNights()],
        pricing: [room.pricePerNight || 0],
        adults: [0],
        children: [0],
        totalPrice: [room.pricePerNight || 0],
      })
    );
  } else {
    // Remove room from form array
    const index = roomsArray.controls.findIndex(
      (control) => control.get('roomId')?.value === event.roomId
    );
    if (index >= 0) {
      roomsArray.removeAt(index);
    }
  }
}
```

### Example 2: Handle Guest Addition

```typescript
// Parent component
onAddGuest() {
  const additionalGuestsArray = this.reservationForm.get(
    'guestDetails.additionalGuests'
  ) as FormArray;
  
  additionalGuestsArray.push(
    this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      relationship: [''],
    })
  );
}

// Child component emits event
addGuest(): void {
  this.guestAdded.emit();
}
```

### Example 3: Handle Guest Removal

```typescript
// Parent component
onRemoveGuest(index: number) {
  const additionalGuestsArray = this.reservationForm.get(
    'guestDetails.additionalGuests'
  ) as FormArray;
  
  additionalGuestsArray.removeAt(index);
}

// Child component emits with index
removeGuest(index: number): void {
  this.guestRemoved.emit(index);
}
```

### Example 4: Emit Event with Data

```typescript
// Child component - RoomSelectionStepComponent
toggleRoom(roomId: string, index: number): void {
  const isSelected = this.isRoomSelected(roomId);
  this.roomToggled.emit({ 
    roomId, 
    index, 
    add: !isSelected  // Toggle state
  });
}
```

---

## Form Manipulation Examples

### Example 1: Populate Form with Data

```typescript
private populateFormWithReservation(reservation: Reservation) {
  this.reservationForm.patchValue({
    guestDetails: {
      primaryGuest: reservation.guestDetails.primaryGuest,
      totalAdults: reservation.guestDetails.totalAdults,
      totalChildren: reservation.guestDetails.totalChildren,
    },
    checkInDate: new Date(reservation.checkInDate),
    checkOutDate: new Date(reservation.checkOutDate),
    expectedCheckInTime: reservation.expectedCheckInTime || '15:00',
    expectedCheckOutTime: reservation.expectedCheckOutTime || '11:00',
    paymentInfo: {
      method: reservation.paymentInfo?.method || 'card',
      status: reservation.paymentInfo?.status || 'pending',
    },
  });

  // Handle arrays separately
  if (reservation.rooms && reservation.rooms.length > 0) {
    this.populateRooms(reservation.rooms);
  }

  if (reservation.guestDetails.additionalGuests?.length > 0) {
    this.populateAdditionalGuests(
      reservation.guestDetails.additionalGuests
    );
  }
}
```

### Example 2: Clear Form Array

```typescript
private populateRooms(rooms: any[]) {
  const roomsArray = this.reservationForm.get('rooms') as FormArray;
  
  // Clear existing controls
  roomsArray.clear();
  
  // Add new ones
  rooms.forEach((room) => {
    roomsArray.push(
      this.fb.group({
        roomId: [room.roomId, Validators.required],
        roomType: [room.roomType],
        roomNumber: [room.roomNumber],
        stayPeriod: [room.stayPeriod || 1],
        pricing: [room.pricing || 0],
        adults: [room.adults || 0],
        children: [room.children || 0],
        totalPrice: [room.totalPrice || 0],
      })
    );
  });
}
```

### Example 3: Update Nested Form Group

```typescript
// Update nested form group
this.reservationForm.patchValue(
  {
    pricing: {
      subtotal: 1000,
      taxes: 100,
      serviceFee: 50,
      totalDiscount: 0,
      earlyBirdDiscount: 0,
      total: 1150,
    },
  },
  { emitEvent: false }  // Don't trigger valueChanges
);
```

### Example 4: Mark Form as Touched

```typescript
private markFormGroupTouched(formGroup: FormGroup) {
  Object.keys(formGroup.controls).forEach((key) => {
    const control = formGroup.get(key);
    
    if (control instanceof FormGroup) {
      // Recursively mark nested groups
      this.markFormGroupTouched(control);
    } else {
      control?.markAsTouched();
    }
  });
}
```

### Example 5: Get Form Value

```typescript
// Get raw value (includes disabled controls)
const formData = this.reservationForm.getRawValue();

// Get value (excludes disabled controls)
const enabledData = this.reservationForm.value;

// Get specific control value
const checkInDate = this.reservationForm.get('checkInDate')?.value;

// Get nested value
const primaryGuest = this.reservationForm.get('guestDetails.primaryGuest')?.value;
```

### Example 6: Check Form Validation

```typescript
// Check if entire form is valid
if (this.reservationForm.valid) {
  // All controls pass validation
}

// Check specific control
if (this.reservationForm.get('checkInDate')?.valid) {
  // Control is valid
}

// Check for specific error
if (this.reservationForm.get('email')?.hasError('email')) {
  // Email format is invalid
}

// Check if form is touched
if (this.reservationForm.touched) {
  // User has interacted with form
}
```

---

## Service Usage Examples

### Example 1: Calculate Pricing

```typescript
import { PricingService } from '../shared/services/pricing.service';

export class ReservationFormComponent {
  private pricingService = inject(PricingService);

  private calculatePricingFromRooms() {
    const roomsArray = this.reservationForm.get('rooms') as FormArray;
    if (!roomsArray) return;

    const rooms = roomsArray.getRawValue();
    
    // Use service to calculate pricing
    const pricing = this.pricingService.calculatePricingFromRooms(rooms, 0.1);

    // Update form with calculated values
    this.reservationForm.patchValue(
      {
        pricing: {
          subtotal: pricing.subtotal,
          taxes: pricing.taxes,
          serviceFee: pricing.serviceFee,
          totalDiscount: pricing.totalDiscount,
          earlyBirdDiscount: pricing.earlyBirdDiscount,
          total: pricing.total,
        },
      },
      { emitEvent: false }
    );
  }
}
```

### Example 2: Apply Discount

```typescript
const originalAmount = 1000;
const discountPercentage = 10;

// Apply percentage discount
const discountAmount = this.pricingService.applyPercentageDiscount(
  originalAmount,
  discountPercentage
);

console.log(`Discount: ${discountAmount}`); // 100

// Calculate final price
const finalPrice = originalAmount - discountAmount; // 900
```

### Example 3: Calculate Subtotal

```typescript
const rooms = [
  { pricing: 100, stayPeriod: 2 }, // $200
  { pricing: 150, stayPeriod: 2 }, // $300
];

const subtotal = this.pricingService.calculateSubtotal(rooms);
console.log(subtotal); // 500
```

---

## Testing Examples

### Example 1: Test Component Creation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservationDetailsStepComponent } from './reservation-details-step.component';
import { FormBuilder } from '@angular/forms';

describe('ReservationDetailsStepComponent', () => {
  let component: ReservationDetailsStepComponent;
  let fixture: ComponentFixture<ReservationDetailsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailsStepComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDetailsStepComponent);
    component = fixture.componentInstance;
    
    // Setup inputs
    const fb = TestBed.inject(FormBuilder);
    component.reservationForm = fb.group({
      checkInDate: [new Date()],
      checkOutDate: [new Date()],
      expectedCheckInTime: ['15:00'],
      expectedCheckOutTime: ['11:00'],
    });
    component.numberOfNights = () => 2;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display check-in date input', () => {
    const input = fixture.nativeElement.querySelector(
      'input[formControlName="checkInDate"]'
    );
    expect(input).toBeTruthy();
  });

  it('should display number of nights', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('2'); // 2 nights
  });
});
```

### Example 2: Test Event Emission

```typescript
it('should emit roomToggled when room is toggled', (done) => {
  component.roomToggled.subscribe((event) => {
    expect(event).toEqual({ roomId: 'room123', index: 0, add: true });
    done();
  });

  component.toggleRoom('room123', 0);
});
```

### Example 3: Test Computed Signal

```typescript
it('should compute selected rooms from form array', () => {
  const roomsArray = component.reservationForm.get('rooms') as FormArray;
  roomsArray.push(
    component.fb.group({
      roomId: 'room123',
      roomType: 'deluxe',
      roomNumber: '101',
      stayPeriod: 2,
      pricing: 100,
      totalPrice: 200,
      adults: 2,
      children: 0,
    })
  );

  const selected = component.selectedRooms();
  expect(selected.length).toBe(1);
  expect(selected[0].roomId).toBe('room123');
  expect(selected[0].totalPrice).toBe(200);
});
```

### Example 4: Test Service

```typescript
import { TestBed } from '@angular/core/testing';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PricingService);
  });

  it('should calculate pricing correctly', () => {
    const rooms = [
      { pricing: 100, stayPeriod: 2 },
      { pricing: 150, stayPeriod: 2 },
    ];

    const result = service.calculatePricingFromRooms(rooms, 0.1);

    expect(result.subtotal).toBe(500);
    expect(result.taxes).toBe(50);
    expect(result.total).toBe(550);
  });

  it('should apply percentage discount', () => {
    const discount = service.applyPercentageDiscount(1000, 10);
    expect(discount).toBe(100);
  });
});
```

---

## Advanced Patterns

### Pattern 1: Reactive Form Changes

```typescript
// Watch for room changes and recalculate pricing
this.reservationForm
  .get('rooms')
  ?.valueChanges.pipe(takeUntil(this.destroy$))
  .subscribe(() => {
    this.calculatePricingFromRooms();
  });

// Watch for date changes and calculate nights
this.reservationForm
  .get('checkInDate')
  ?.valueChanges.pipe(takeUntil(this.destroy$))
  .subscribe(() => this.calculateNights());
```

### Pattern 2: Using Resource with Auto-fetch

```typescript
// Auto-fetch available rooms when dates change
public availableRoomsResource = rxResource({
  params: () => ({ checkIn: this.checkIn(), checkOut: this.checkOut() }),
  stream: ({ params }) =>
    this.getAvailableRooms({
      checkIn: params.checkIn!,
      checkOut: params.checkOut!,
    }),
});

// Use in template
{{ availableRoomsResource.value() | json }}

// Check loading state
{{ availableRoomsResource.isLoading() }}

// Check error state
{{ availableRoomsResource.error() }}
```

### Pattern 3: Computed Signals for Derived State

```typescript
// Calculate derived state that updates automatically
roomCount = computed(() => {
  const roomsArray = this.reservationForm.get('rooms') as FormArray;
  return roomsArray?.controls.length || 0;
});

totalGuests = computed(() => {
  const adults = this.reservationForm.get('guestDetails.totalAdults')?.value || 0;
  const children = this.reservationForm.get('guestDetails.totalChildren')?.value || 0;
  return adults + children;
});

// Use in template
{{ roomCount() }} rooms selected
{{ totalGuests() }} total guests
```

### Pattern 4: Conditional Logic in Template

```html
<!-- Use computed to show/hide elements -->
@if (isEditing()) {
  <p>Editing existing reservation</p>
} @else {
  <p>Creating new reservation</p>
}

<!-- Use computed in form field binding -->
<mat-form-field>
  <mat-label>{{ isEditing() ? 'Update' : 'Create' }} Guest</mat-label>
  <input formControlName="firstName">
</mat-form-field>

<!-- Use resource states -->
@if (availableRoomsResource.isLoading()) {
  <mat-spinner></mat-spinner>
}

@if (availableRoomsResource.error()) {
  <p class="error">{{ availableRoomsResource.error()?.message }}</p>
}
```

---

## Common Patterns Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Signal** | Mutable state | `loading = signal(false)` |
| **Computed** | Derived state | `isEditing = computed(() => !!id())` |
| **Resource** | Async data fetching | `availableRoomsResource = rxResource(...)` |
| **FormGroup** | Complex form | `guestDetails: fb.group(...)` |
| **FormArray** | Dynamic arrays | `additionalGuests: fb.array([])` |
| **@Input** | Parent to child data | `@Input() form: FormGroup` |
| **@Output** | Child to parent events | `@Output() roomToggled = new EventEmitter()` |
| **Validators** | Form validation | `Validators.required, Validators.email` |
| **patchValue** | Update form | `form.patchValue({ name: 'John' })` |
| **getRawValue** | Get all values | `form.getRawValue()` |

---

## Tips & Best Practices

1. **Always use `getRawValue()`** when submitting forms with disabled fields
2. **Mark forms as touched** before showing validation errors
3. **Use `emitEvent: false`** when updating form to avoid infinite loops
4. **Clear FormArrays with `clear()`** before repopulating
5. **Unsubscribe from observables** using `takeUntil(this.destroy$)`
6. **Use `computed()`** instead of helper methods for derived state
7. **Use `rxResource`** for automatic data fetching based on params
8. **Always provide `track` in `@for`** loops for performance
9. **Validate at both form and service level**
10. **Test components independently** with mock inputs/outputs

---

**Last Updated**: Today  
**Version**: 1.0  
**Status**: Ready for Use
