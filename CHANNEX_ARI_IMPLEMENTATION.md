# Channex ARI (Availability, Rate & Inventory) Implementation

This document details the complete implementation of Channex's ARI system with support for restrictions, rates, and persistent data storage.

## Overview

The Channex ARI system allows you to manage and synchronize room rates, availability, and restrictions across all connected OTA channels. This implementation includes:

- ✅ **Rates Management** - Set prices for specific dates/date ranges
- ✅ **Availability Control** - Manage room inventory per date
- ✅ **Restrictions** - Set min/max stay, closed-to-arrival/departure, and stop-sell rules
- ✅ **Day-Specific Rules** - Apply restrictions only to specific days of the week
- ✅ **Data Persistence** - Auto-save drafts to localStorage and database
- ✅ **Multi-Currency Support** - NGN, USD, EUR, GBP
- ✅ **Rate Plans** - Support for multiple rate plans per property

## Architecture

### Backend (NestJS/Node.js)

#### New Types & Interfaces

```typescript
// Restriction data structure
interface RestrictionValue {
  propertyId: string;
  ratePlanId: string;
  date?: string;                    // Single date (YYYY-MM-DD)
  dateFrom?: string;                // Date range start
  dateTo?: string;                  // Date range end
  days?: ('mo'|'tu'|'we'|'th'|'fr'|'sa'|'su')[];  // Specific days
  rate?: number | string;           // Price (can be decimal or integer)
  minStayArrival?: number;          // Min nights on arrival
  minStayThrough?: number;          // Min nights through stay
  minStay?: number;                 // Generic min stay
  maxStay?: number;                 // Max nights allowed
  closedToArrival?: boolean;        // Block arrivals
  closedToDeparture?: boolean;      // Block departures
  stopSell?: boolean;               // Stop selling completely
  availability?: number;            // Number of available rooms
}

interface RatePlanDto {
  id: string;
  name: string;
  channexRatePlanId: string;
}
```

#### New Service Methods

**ChannexService** additions:

1. **getRestrictions()** - Fetch current restrictions from Channex
   ```typescript
   async getRestrictions(
     storeId: string,
     startDate: string,
     endDate: string,
     restrictions?: string
   ): Promise<any>
   ```

2. **pushRestrictions()** - Push restrictions to Channex
   ```typescript
   async pushRestrictions(
     storeId: string,
     values: RestrictionValue[]
   ): Promise<any>
   ```

3. **getPropertyRatePlans()** - Get available rate plans
   ```typescript
   async getPropertyRatePlans(storeId: string): Promise<RatePlanDto[]>
   ```

4. **savePricingDraft()** - Save draft for persistence
   ```typescript
   async savePricingDraft(
     storeId: string,
     startDate: string,
     endDate: string,
     data: any
   ): Promise<any>
   ```

5. **getPricingDraft()** - Retrieve saved draft
6. **clearPricingDrafts()** - Remove all drafts

#### New Admin Controller Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/channex/stores/:storeId/restrictions` | GET | Get restrictions for date range |
| `/admin/channex/stores/:storeId/restrictions` | POST | Push restrictions to Channex |
| `/admin/channex/stores/:storeId/rate-plans` | GET | Get available rate plans |
| `/admin/channex/stores/:storeId/pricing-draft` | GET | Get saved pricing draft |
| `/admin/channex/stores/:storeId/pricing-draft` | POST | Save pricing draft |
| `/admin/channex/stores/:storeId/pricing-draft/clear` | POST | Clear all drafts |

### Frontend (Angular 20+)

#### Component: InventoryRatesComponent

**Signals:**
- `rateData` - Map of room rates by date
- `availabilityData` - Map of available rooms by date
- `restrictionData` - Map of restrictions by date
- `selectedDays` - Days of week to apply restrictions to
- `hasUnsavedChanges` - Tracks if there are unsaved changes
- `showRestrictionsPanel` - Toggle restrictions UI visibility

**Methods:**

**Data Management:**
- `updateRate()` - Update rate for specific room/date
- `updateAvailability()` - Update availability for specific room/date
- `updateRestriction()` - Update restriction value
- `getRate()` / `getAvailability()` / `getRestriction()` - Retrieve values

**Restrictions:**
- `toggleDay()` - Select/deselect days of week
- `applyRestrictionsToDateRange()` - Apply restrictions to date range
- `toggleRestrictionsPanel()` - Show/hide restrictions editor

**Persistence:**
- `autoSaveToLocalStorage()` - Auto-save drafts to browser storage
- `loadPricingDraft()` - Load saved draft on date change
- `savePricingDraft()` - Save draft to backend database

**Synchronization:**
- `saveChanges()` - Push rates and restrictions to Channex
- `pushRestrictionsToChannex()` - Send restrictions to Channex API

#### UI Features

**Restrictions Panel:**
- Min/Max stay controls
- Closed-to-arrival/departure toggles
- Stop-sell checkbox
- Day-of-week selector (Mo-Su)
- Apply-to-all or apply-to-selected-days options

**Calendar View:**
- Date headers with day names
- Editable rate cells
- Editable availability cells
- Restriction indicators (CTA/CTD/SS badges)
- Unsaved changes indicator

**Persistence Indicators:**
- "Unsaved Changes" badge when editing
- Success/error messages after save
- Auto-save to localStorage in background

## Usage Guide

### Setting Rates

1. **Select date range** using quick buttons or date pickers
2. **Click lock icon** to enter edit mode
3. **Click on rate cells** to enter prices
4. **Set availability** in the availability row
5. **Click "Save Changes"** to push to Channex

### Applying Restrictions

1. **Enter edit mode** (unlock icon)
2. **Expand "Restrictions & Rules" panel**
3. **Configure restrictions:**
   - Enter min/max stay requirements
   - Check closure options (CTA/CTD)
   - Check "Stop Sell" to disable sales
4. **Select days** (leave empty for all days)
5. **Click "Apply Restrictions"**
6. **Save changes** to push to Channex

### Day-Specific Rules

Example: Set weekend rates differently

1. Set base rate for all days: Rate = 100
2. Click day buttons to select: Sa, Su
3. Enter higher rate: Rate = 150
4. Click "Apply Restrictions"
5. Now Saturdays & Sundays will have 150, others 100

### Persistence & Recovery

**LocalStorage:**
- Automatically saves drafts as you edit
- Recovers when you reload the same date range
- Key format: `pricing_draft_{storeId}_{startDate}_{endDate}`

**Database:**
- Click "Save Changes" to persist to server
- Drafts stored in `store.channex.drafts` array
- Can be retrieved later for recovery

## Channex API Integration

### Endpoints Called

All requests include authentication header:
```
user-api-key: {CHANNEX_API_KEY}
```

#### 1. Get Restrictions
```
GET /api/v1/restrictions?filter[property_id]={id}&filter[date][gte]={start}&filter[date][lte]={end}&filter[restrictions]={types}
```

**Supported restriction types:**
- `rate` - Room rate/price
- `availability` - Number of available rooms
- `min_stay_arrival` - Min nights on arrival
- `min_stay_through` - Min nights through stay
- `max_stay` - Max allowed nights
- `closed_to_arrival` - Block arrivals
- `closed_to_departure` - Block departures
- `stop_sell` - Stop selling completely

#### 2. Push Restrictions
```
POST /api/v1/restrictions
Body: {
  "values": [
    {
      "property_id": "uuid",
      "rate_plan_id": "uuid",
      "date_from": "2026-02-01",
      "date_to": "2026-02-28",
      "days": ["mo", "tu", "we"],  // optional
      "rate": 30000,
      "min_stay_arrival": 1,
      "closed_to_arrival": false,
      ...
    }
  ]
}
```

#### 3. Get Rate Plans
```
GET /api/v1/properties/{propertyId}/rate_plans
```

## Data Flow

```
Frontend (Edit Data)
    ↓
LocalStorage (Auto-save)
    ↓
Save Button Clicked
    ↓
Backend /rates endpoint (Push rates)
    ↓
Backend /restrictions endpoint (Push restrictions)
    ↓
Backend /pricing-draft endpoint (Save for recovery)
    ↓
Channex API
    ↓
Distributed to OTA Channels
```

## Error Handling

**Validation:**
- Rate > 0 (required)
- Min stay >= 1
- Max stay >= 0
- Dates cannot be in past
- At least one restriction must be present in request

**Warnings:**
- Invalid values are logged but don't block the request
- Server returns warning messages for problematic fields
- Other valid entries are processed successfully

**Retry Logic:**
- Automatic retry 3 times with 1s delay on network errors
- Full error details logged with context

## Best Practices

### Rate Management
✅ Set rates at room type level (not individual rooms)
✅ Use date ranges for bulk updates
✅ Set base rates, then override specific dates
✅ Use integer format: 30000 for 300.00 USD

### Restrictions
✅ Use min_stay_arrival for most cases
✅ Only use min_stay_through for complex rules
✅ Combine closed_to_arrival + min_stay for blackout periods
✅ Stop-sell should be temporary (seasonal closures)

### Performance
✅ Load no more than 30-60 days at a time
✅ Use day-specific rules instead of individual dates
✅ Apply bulk changes through date ranges
✅ Drafts auto-save every change (optimized)

## Troubleshooting

**Restrictions not appearing in Channex?**
- Verify rate_plan_id is correct (check /rate-plans endpoint)
- Ensure property_id matches (from store.channex.propertyId)
- Check if date is not in the past
- Review warning messages in response

**Data lost on reload?**
- Check if localStorage is enabled in browser
- Check if date range matches saved draft
- Server backup available at /pricing-draft endpoint

**Changes not syncing to OTAs?**
- Verify property is connected to channels (check Channex dashboard)
- Ensure rate plan is active on each channel
- Check Channex webhooks for sync errors
- Review warnings in API response

## Configuration

### Environment Variables
```
CHANNEX_API_URL=https://staging.channex.io/v1 (or production)
CHANNEX_API_KEY=your_api_key_here
```

### Database Schema Addition
```typescript
// Add to Store schema
channex: {
  propertyId: string;
  ratePlans: RatePlanDto[];  // NEW
  drafts: Array<{             // NEW
    startDate: string;
    endDate: string;
    data: any;
    savedAt: Date;
  }>;
  // ... existing fields
}
```

## References

- [Channex ARI Documentation](https://docs.channex.io/api-v.1-documentation/ari)
- [Restrictions Endpoint](https://docs.channex.io/api-v.1-documentation/ari#update-rate--restrictions)
- [Rate Plans](https://docs.channex.io/api-v.1-documentation/rate-plans-collection)

## Migration from Old Implementation

If migrating from simple rates-only system:

1. **Update Store schema** - Add `ratePlans` and `drafts` fields
2. **Create rate plans** - Run one-time sync for each room type
3. **Export existing data** - Save current rates from old system
4. **Import to Channex** - Use bulk update endpoint
5. **Test date ranges** - Verify all restrictions working
6. **Monitor OTA sync** - Confirm channels receiving updates

