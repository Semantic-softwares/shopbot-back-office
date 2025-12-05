# Reservation Form Refactoring Implementation Checklist

## Phase 1: Preparation ✅ COMPLETE
- [x] Create step components
  - [x] ReservationDetailsStepComponent
  - [x] RoomSelectionStepComponent
  - [x] GuestDetailsStepComponent
  - [x] PricingSummaryStepComponent
- [x] Create PricingService
- [x] Create refactored parent component
- [x] Create refactored template
- [x] Create index.ts for step components
- [x] Create documentation

## Phase 2: Integration (NEXT - Ready to Execute)

### Step 2.1: Verify Component Imports
- [ ] Ensure all imports in refactored component resolve correctly
- [ ] Check that step components are properly exported from index.ts
- [ ] Verify PricingService is accessible

### Step 2.2: Run Build Test
```bash
# In /Users/alexonozor/workspace/frontend/shopbot-back-office
npm run build
# Expected: Successful build with no errors
```

### Step 2.3: Check for TypeScript Errors
```bash
# Run TypeScript compiler
npm run build
# Expected: No TS errors related to:
# - Component imports
# - Event bindings
# - Form controls
# - Template references
```

### Step 2.4: Update Routing
Currently pointing to:
```typescript
// OLD (if using original)
templateUrl: './reservation-form.component.html',
```

Change to:
```typescript
// NEW (refactored version)
templateUrl: './reservation-form-refactored.component.html',
```

**File to modify:**
- `/src/app/menu/hms/front-desk/reservations/reservation-form/reservation-form.component.ts`
- Search for: `templateUrl:`
- Update component reference if needed

## Phase 3: Testing (Ready to Execute)

### Step 3.1: Unit Tests
Create tests for each component:
- [ ] `reservation-details-step.component.spec.ts`
- [ ] `room-selection-step.component.spec.ts`
- [ ] `guest-details-step.component.spec.ts`
- [ ] `pricing-summary-step.component.spec.ts`
- [ ] `pricing.service.spec.ts`

**Test Template:**
```typescript
describe('ReservationDetailsStepComponent', () => {
  let component: ReservationDetailsStepComponent;
  let fixture: ComponentFixture<ReservationDetailsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailsStepComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ReservationDetailsStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more tests...
});
```

### Step 3.2: Integration Tests
- [ ] Test component interaction with parent
- [ ] Test event emissions
- [ ] Test form control binding
- [ ] Test computed signal updates

### Step 3.3: Manual Testing (Critical)

#### Create New Reservation
- [ ] Component loads without errors
- [ ] Date pickers work
- [ ] Available rooms load when dates are selected
- [ ] Can select/deselect rooms
- [ ] Room count updates in selected rooms section
- [ ] Pricing updates when rooms are selected
- [ ] Can proceed to Step 2 (Guest Details)
- [ ] Can add additional guests
- [ ] Can remove additional guests
- [ ] Can proceed to Step 3 (Pricing)
- [ ] Pricing summary displays correctly
- [ ] Can complete reservation creation
- [ ] Reservation appears in list

#### Edit Existing Reservation
- [ ] Loads reservation data correctly
- [ ] All fields populated with existing data
- [ ] Cannot change dates (or can, depending on business rules)
- [ ] Rooms display correctly
- [ ] Guests display correctly
- [ ] Pricing displays correctly
- [ ] Can update guest information
- [ ] Can add/remove additional guests
- [ ] Can save changes
- [ ] Changes persist

#### Error Handling
- [ ] Validation errors display correctly
- [ ] Required fields prevent submission
- [ ] API errors display in error message
- [ ] Can dismiss error message
- [ ] Loading state shows while submitting
- [ ] Success message appears after creation/update

#### Room Selection
- [ ] Available rooms load for date range
- [ ] Can select multiple rooms
- [ ] Selected rooms appear in summary
- [ ] Room details display correctly (type, number, capacity, amenities)
- [ ] Can remove selected rooms
- [ ] Pricing updates correctly per room

#### Pricing Calculations
- [ ] Subtotal calculates correctly (rooms × nights)
- [ ] Taxes calculate correctly (10% of subtotal)
- [ ] Service fees display correctly
- [ ] Discounts apply correctly
- [ ] Total calculates correctly
- [ ] Currency formatting is correct

#### Guest Management
- [ ] Primary guest fields required
- [ ] Email validation works
- [ ] Phone number validation works
- [ ] Can add additional guests
- [ ] Additional guests can be removed
- [ ] Guest count updates

## Phase 4: Verification (Ready to Execute)

### Step 4.1: Compare with Original
- [ ] All fields from original component still present
- [ ] All functionality from original component still works
- [ ] Form validation same as before
- [ ] API calls same as before
- [ ] Error handling same as before
- [ ] Success messages same as before

### Step 4.2: Performance Check
```typescript
// Before and after: Check component rendering time
// Use Chrome DevTools Performance tab
// Target: No significant performance degradation
```

### Step 4.3: Accessibility Check
- [ ] Form labels properly associated with inputs
- [ ] Tab order makes sense
- [ ] Error messages accessible to screen readers
- [ ] Buttons have proper aria labels
- [ ] Color contrast adequate

## Phase 5: Cleanup (When Ready)

### Step 5.1: Backup Original
```bash
# Keep in git or archive
git checkout reservation-form.component.ts
git checkout reservation-form.component.html
```

### Step 5.2: Update Documentation
- [ ] Update routing configuration docs
- [ ] Update component documentation
- [ ] Add to architecture guide
- [ ] Update team wiki/readme

### Step 5.3: Remove Original Component (Optional)
Only after verified everything works:
```bash
# rm /path/to/reservation-form.component.ts
# rm /path/to/reservation-form.component.html
```

## Troubleshooting Guide

### Issue: Compilation Errors

**Problem:** "Cannot find module" errors
**Solution:**
1. Check step component exports in `steps/index.ts`
2. Verify import paths in refactored component
3. Run `npm install` to ensure all dependencies installed

**Problem:** Template binding errors
**Solution:**
1. Verify all form control names match
2. Check FormGroup names match template references
3. Ensure @Input properties are defined

### Issue: Form Not Binding Data

**Problem:** Form values not updating when data loads
**Solution:**
1. Verify reservation data loads before form population
2. Check `populateFormWithReservation()` method
3. Ensure FormArray is properly managed

**Problem:** Room selection not working
**Solution:**
1. Verify event emitter is properly defined
2. Check parent component handler is called
3. Ensure FormArray updates trigger properly

### Issue: Pricing Not Calculating

**Problem:** Total always 0 or incorrect
**Solution:**
1. Verify `calculatePricingFromRooms()` is called
2. Check PricingService calculations
3. Ensure room pricing data exists
4. Verify numberOfNights is calculated

### Issue: Step Navigation Not Working

**Problem:** Cannot proceed to next step
**Solution:**
1. Check form group control names in stepper
2. Verify form validation rules
3. Ensure step completion logic is correct

## Quick Commands

```bash
# Navigate to project directory
cd /Users/alexonozor/workspace/frontend/shopbot-back-office

# Build project
npm run build

# Run tests
npm run test

# Run tests for specific component
npm run test -- --include='**/reservation-details-step.component.spec.ts'

# Start development server
npm start

# Lint code
npm run lint
```

## File Locations Quick Reference

```
/Users/alexonozor/workspace/frontend/shopbot-back-office/

src/app/
├── menu/hms/front-desk/reservations/reservation-form/
│   ├── reservation-form.component.ts (ORIGINAL - keep for reference)
│   ├── reservation-form.component.html (ORIGINAL - keep for reference)
│   ├── reservation-form.component.scss
│   │
│   ├── reservation-form-refactored.component.ts ← START HERE
│   ├── reservation-form-refactored.component.html ← NEW TEMPLATE
│   │
│   └── steps/
│       ├── index.ts
│       ├── reservation-details-step.component.ts
│       ├── room-selection-step.component.ts
│       ├── guest-details-step.component.ts
│       └── pricing-summary-step.component.ts
│
└── shared/services/
    ├── pricing.service.ts ← NEW SERVICE
    └── (other services...)

Documentation files:
├── RESERVATION_FORM_REFACTORING.md (Detailed guide)
└── REFACTORING_SUMMARY.md (Quick summary)
```

## Success Criteria

✅ **Component loads without errors**
✅ **All fields display and validate**
✅ **Room selection works correctly**
✅ **Pricing calculates accurately**
✅ **Form submission succeeds**
✅ **Editing existing reservations works**
✅ **All error messages display properly**
✅ **No console errors or warnings**
✅ **Performance is acceptable**
✅ **All tests pass**

## Timeline Estimate

- Phase 1 (Preparation): ✅ DONE
- Phase 2 (Integration): ~30 minutes
- Phase 3 (Testing): ~2-3 hours
- Phase 4 (Verification): ~1 hour
- Phase 5 (Cleanup): ~30 minutes
- **Total**: ~4-5 hours

## Notes

- Always keep original component as backup until fully verified
- Test on different browsers if possible
- Consider mobile responsiveness
- Ask for code review before cleanup phase
- Document any custom modifications made

---

**Status**: 🟢 Ready for Phase 2 Integration  
**Last Updated**: Today  
**Owner**: Your Team
