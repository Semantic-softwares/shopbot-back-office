# Calendar-Based Rates & Availability Manager

## Overview
Refactored the Inventory & Rates component into a modern, calendar-based rate manager that allows room operators to set date-specific pricing and availability for distribution to Channex and OTA partners.

## Features Implemented

### 1. **Calendar Grid View**
- **14-day default view** (customizable to 7, 30, or custom date ranges)
- **Date headers** showing day of week and date
- **Room type rows** with separate rate and availability rows
- **Editable cells** for rate and availability counts
- **Sticky headers and columns** for easy scrolling on large calendars

### 2. **Date Range Selection**
- **Quick select buttons**: 7 Days, 14 Days, 30 Days
- **Custom date range picker** using Material DatePicker
- **Navigation arrows** to move between periods (previous/next)
- **Auto-updating calendar** when date range changes

### 3. **Rate Management**
- **Currency selection**: NGN (₦), USD ($), EUR (€), GBP (£)
- **Per-date, per-room pricing**: Set different rates for each date
- **Availability tracking**: Track room inventory by date
- **Edit mode toggle**: Lock/unlock editing to prevent accidental changes

### 4. **Data Synchronization**
- **Save Changes button**: Pushes updated rates to backend endpoint
- **Status messages**: Success/error feedback with auto-dismiss (3 seconds)
- **Loading states**: Spinner while saving to Channex
- **Reset button**: Clear all changes without saving

## Technical Implementation

### Component: `inventory-rates.component.ts`
**Location**: `src/app/menu/hms/channel-management/inventory-rates/`

**Key Methods**:
```typescript
- generateCalendarDates(startDate, endDate)           // Create date array
- getRate(roomTypeId, date): number                   // Retrieve rate for cell
- updateRate(roomTypeId, date, value)                 // Update rate in Map
- getAvailability(roomTypeId, date): number           // Get availability
- updateAvailability(roomTypeId, date, value)         // Update availability
- saveChanges()                                       // POST to backend
- resetChanges()                                      // Clear all changes
- navigateToPreviousPeriod() / navigateToNextPeriod() // Date navigation
- selectDateRange(days)                               // Quick select
- toggleEditMode()                                    // Lock/unlock editing
```

**State Signals**:
```typescript
dateRange                    // Current start/end dates
calendarDates               // Array of dates for grid
rateData                    // Map<roomTypeId, Map<dateStr, rate>>
availabilityData            // Map<roomTypeId, Map<dateStr, availability>>
selectedCurrency            // NGN | USD | EUR | GBP
editMode                    // true = editable, false = read-only
isSaving                    // true while posting to backend
saveStatus                  // 'success' | 'error' | null
```

### Template: `inventory-rates.component.html`
**Features**:
- Material Card containers with outline appearance
- Material DatePicker for date range selection
- HTML5 number inputs for rate/availability (with validation)
- Responsive table with sticky headers and columns
- Loading spinner during data fetch
- Error boundary for API failures
- Status notification with animations

### Styles: `inventory-rates.component.scss`
**Key Features**:
- Sticky table headers and first column
- Responsive grid adjustments for mobile
- Focus ring styling on inputs (blue-500)
- Animation for status messages (fade-in)
- Disabled state styling for locked cells

## Backend Integration

### API Endpoint
**POST** `/admin/channex/stores/{storeId}/rates`

**Payload Structure**:
```typescript
{
  storeId: string;
  startDate: "YYYY-MM-DD";
  endDate: "YYYY-MM-DD";
  rates: Array<{
    date: "YYYY-MM-DD";
    roomTypeId: string;
    rate: number;
    availability: number;
  }>;
  currency: "NGN" | "USD" | "EUR" | "GBP";
}
```

### Models Used
**From `hotel.models.ts`**:
```typescript
- DateRateEntry          // Single rate entry {date, roomTypeId, rate, availability}
- RateUpdatePayload      // Full payload for backend
- CalendarDateRange      // Date range {startDate, endDate}
```

**From `room.model.ts`**:
```typescript
- RoomType              // Room type definition (imported, not re-exported)
```

## User Workflow

1. **Set Date Range**
   - Click a quick-select button OR
   - Use the custom date pickers

2. **Toggle Edit Mode**
   - Click the lock icon to enable/disable editing

3. **Enter Rates & Availability**
   - Click on any rate or availability cell
   - Enter the value
   - Field accepts decimals for rates (e.g., 150.00)
   - Field accepts integers for availability (e.g., 5)

4. **Navigate Periods**
   - Use left/right arrows to move between date ranges
   - Calendar updates automatically

5. **Save or Reset**
   - Click "Save Changes" to push to Channex
   - Click "Reset" to clear all changes

6. **Confirm Result**
   - Green success message: "Rates synced successfully"
   - Red error message: "Failed to sync rates"
   - Messages auto-dismiss after 3 seconds

## Design Decisions

### Why Calendar Grid?
- **Modern PMS Standard**: Matches industry-standard property management systems
- **At-a-glance visibility**: See all rates for all rooms across dates in one view
- **Efficient data entry**: Easier than navigating through forms
- **OTA Distribution**: Channex API designed for date-specific rates

### Why Signal-Based State?
- **Angular 20+ best practice**: Signals provide fine-grained reactivity
- **No subscriptions needed**: Automatic cleanup and memory safety
- **Type-safe**: Full TypeScript support without RxJS complexity

### Why Map<string, Map<string, number>>?
- **Efficient lookups**: O(1) access by roomTypeId and dateStr
- **Sparse data support**: Only store rates that were changed
- **Easy serialization**: Convert to array for API payload

## Future Enhancements

- [ ] Bulk operations (apply rate to multiple dates at once)
- [ ] Rate templates (copy rates from one date range to another)
- [ ] Pricing rules by occupancy level
- [ ] Minimum stay requirements per date
- [ ] Blackout dates visualization
- [ ] Occupancy-based pricing adjustments
- [ ] Weekly/monthly view options
- [ ] Rate comparison with historical data
- [ ] Undo/redo functionality
- [ ] CSV import/export

## Files Modified

1. **inventory-rates.component.ts** - Complete rewrite with calendar logic
2. **inventory-rates.component.html** - New calendar grid template
3. **inventory-rates.component.scss** - Responsive table styling
4. **channel-management.routes.ts** - Route configuration (unchanged)
5. **hotel.models.ts** - Added DateRateEntry, RateUpdatePayload models

## Testing Checklist

- [ ] Date range selection works correctly
- [ ] Quick-select buttons update calendar
- [ ] Custom date picker works (start and end dates)
- [ ] Navigation arrows move to previous/next period
- [ ] Calendar displays correct dates
- [ ] Room types load from backend
- [ ] Edit mode toggle enables/disables input fields
- [ ] Rate input accepts decimal values
- [ ] Availability input accepts integer values
- [ ] Save button sends correct payload to backend
- [ ] Success message displays on save
- [ ] Error message displays on API failure
- [ ] Reset button clears all changes
- [ ] Table is responsive on mobile devices
- [ ] Sticky headers/columns work on scroll
- [ ] Readonly mode displays rates as text (no inputs)

