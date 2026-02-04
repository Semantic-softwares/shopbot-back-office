# Channex Rates & Availability 404 Error - Root Cause & Solution

## Problem

When accessing the **Rates & Availability** page, users encountered a **404 error** from Channex API:

```
GET https://staging.channex.io/api/v1/properties/3f9db275-0c52-42a0-8ff2-085ddcb29d7a/rate_plans
Response: 404 Not Found - Resource Not Found
```

## Root Cause

**The store has not been synced to Channex yet.** The propertyId (`3f9db275-0c52-42a0-8ff2-085ddcb29d7a`) does not exist in the Channex staging environment.

Channex requires a 3-step setup process:

1. **Sync Store to Channex** - Creates a property and generates a valid `propertyId`
2. **Sync Room Types** - Maps PMS room types to Channex room types
3. **Push Availability** - Sends rates/restrictions to Channex

The Rates & Availability page assumes **Step 1 is already complete**, but it wasn't.

## Solution Implemented

### Backend Changes

Enhanced error handling in `ChannexService` to provide better diagnostics:

**File:** `/src/channex/channex.service.ts`

1. **getPropertyRatePlans()** method now:
   - Checks if store has a valid `propertyId` before calling Channex
   - Logs a warning with store name if propertyId is missing
   - Falls back to empty rate plans instead of crashing
   - Includes debug logging for successful API calls

2. **savePricingDraft()** method now:
   - Validates data parameter before processing
   - Handles Map objects that may be serialized differently from frontend
   - Includes fallback values for all fields
   - Logs warnings for data format issues

### Frontend Changes

**File:** `/src/app/menu/hms/channel-management/inventory-rates/inventory-rates.component.ts`

Added prerequisite validation:

1. **New Signal:** `isStoreChannexSynced` - Tracks if store has a valid propertyId
2. **New Signal:** `channexSyncError` - Stores error message for template
3. **Constructor Effect:** Checks store sync status on load and whenever store changes
4. **Conditional Loading:** Calendar dates and rate plans only load if store is synced

**File:** `/src/app/menu/hms/channel-management/inventory-rates/inventory-rates.component.html`

Added user-friendly warning message:

- Shows orange warning card when store is not synced
- Disables all date range buttons and inputs
- Provides link to Channel Management where user can complete sync
- Explains what's required in clear language

## How to Fix

### For End Users

1. **Navigate to Channel Management**
   - Click the "Go to Channel Management" button on the Rates & Availability page
   - Or use the sidebar menu: HMS → Channel Management

2. **Complete Channex Setup (if not already done)**
   - **Step 1: Sync Property** - Click "Sync Store to Channex"
     - Select property type (Hotel, Resort, etc.)
     - Set check-in/check-out times
     - Click "Sync"
     - System will create a property in Channex and assign a propertyId
   
   - **Step 2: Sync Room Types** - For each room type:
     - Click "Sync" button
     - Optionally provide a code (e.g., "DLX" for Deluxe)
     - System will map room types to Channex
   
   - **Step 3: Push Availability** - After syncing:
     - Select date range (e.g., next 90 days)
     - Click "Push Availability"
     - System will send rates and restrictions to Channex

3. **Return to Rates & Availability**
   - Once synced, the warning will disappear
   - You can now manage rates, availability, and restrictions

## Technical Details

### What Gets Synced

#### Store Sync (`POST /admin/channex/stores/{storeId}/sync`)

Creates a property in Channex with:
- Store name → Channex property title
- Currency code
- Timezone
- Address and contact info
- Check-in/Check-out times
- Property type

**Response includes the propertyId**, which is saved in:
```
Store.channex.propertyId
```

#### Room Type Sync (`POST /admin/channex/stores/{storeId}/room-types/{roomTypeId}/sync`)

Maps each room type to Channex with:
- Room type name
- Optional code (SKU)

**Response includes the mapping**, saved in:
```
ChannelRoomMapping { pmsRoomTypeId, channexRoomTypeId }
```

#### Availability Push (`POST /admin/channex/stores/{storeId}/availability`)

Pushes rates and restrictions for:
- Date range
- All room types
- Current rates, availability, and restrictions

### Data Structure

**Store Channex Configuration:**
```typescript
store.channex = {
  propertyId: string;      // From Step 1: Sync Store
  syncEnabled: boolean;
  lastSyncAt: Date;
  syncStatus: 'synced' | 'error' | 'pending';
  connectedChannels: string[]; // OTAs connected (Booking, Airbnb, etc.)
  metadata: {
    channelManager: 'channex';
    propertyType: 'hotel';
    currency: string;
    timezone: string;
  }
}
```

**Room Type Mapping:**
```typescript
ChannelRoomMapping {
  pmsRoomTypeId: string;       // From your PMS
  channexRoomTypeId: string;   // From Channex (Step 2)
}
```

## Files Modified

### Backend
- `/src/channex/channex.service.ts`
  - Enhanced `getPropertyRatePlans()` with better error handling
  - Enhanced `savePricingDraft()` with defensive checks

### Frontend
- `/src/app/menu/hms/channel-management/inventory-rates/inventory-rates.component.ts`
  - Added ChannexService injection
  - Added sync validation signals
  - Added sync check in constructor effect
  - Added RouterLink import

- `/src/app/menu/hms/channel-management/inventory-rates/inventory-rates.component.html`
  - Added warning card when not synced
  - Disabled controls when not synced
  - Added link to Channel Management

## Testing the Fix

### Test Scenario 1: Store Not Synced

1. Use a store without `channex.propertyId`
2. Navigate to Rates & Availability
3. ✅ Should see warning message: "This store is not synced with Channex..."
4. ✅ All controls should be disabled
5. ✅ Click "Go to Channel Management" should navigate correctly

### Test Scenario 2: Store Already Synced

1. Use a store with valid `channex.propertyId`
2. Navigate to Rates & Availability
3. ✅ Warning should NOT appear
4. ✅ All controls should be enabled
5. ✅ Rate plans should load without 404 errors

### Test Scenario 3: Complete Sync Workflow

1. Start with unsynced store
2. Go to Channel Management
3. Complete Step 1: Sync Store
4. Return to Rates & Availability
5. ✅ Warning should disappear
6. ✅ Date pickers should work
7. ✅ Rate plans should load

## Prevention

Future issues can be prevented by:

1. **UI Validation** ✅ - Done in this fix (warning + disabled controls)
2. **API Validation** ✅ - Done in backend (defensive checks)
3. **Documentation** ✅ - Provided in this document
4. **Error Messages** ✅ - Improved in both frontend and backend

## References

- Channex Integration Guide: [CHANNEX_INTEGRATION.md](./CHANNEX_INTEGRATION.md)
- Channex API Documentation: [CHANNEX_API_REFERENCE.md](./CHANNEX_API_REFERENCE.md)
- Channel Management Component: [channel-management-mapping.ts](./src/app/menu/hms/channel-management/channel-management-mapping/)
