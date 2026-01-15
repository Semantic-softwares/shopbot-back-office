# Auto-Print Service Refactor

## Problem
Duplicate code and socket listeners were causing redundancy:
- `auto-print.service.ts` was listening to `printJob:created` and generating receipts
- `print-jobs.component.ts` was also listening to `printJob:created` and generating receipts
- Both had their own `generateReceipt()` methods doing the same thing

## Solution
Consolidated all auto-print logic into `print-jobs.component.ts` with store-based configuration.

## Changes Made

### 1. **Removed `auto-print.service.ts`**
   - Deleted the entire service file
   - Removed all imports from `app.component.ts`

### 2. **Updated `print-jobs.component.ts`**
   - Enhanced `setupSocketListeners()` to call `handleAutoPrint()` when `printJob:created` event is received
   - Added `handleAutoPrint()` method that:
     - Validates print job and order data
     - Checks if order is complete and paid
     - **Checks store setting**: `store.posSettings.receiptSettings.printAfterFinish`
     - Checks if Bluetooth printer is connected
     - Auto-prints only if ALL conditions are met
   - Uses existing `generatePrintJobReceipt()` method (no duplication)

### 3. **Updated `app.component.ts`**
   - Removed `AutoPrintService` injection and lifecycle hooks
   - Simplified to just initialize the app
   - Added comment explaining auto-print is handled by print-jobs component

## How It Works Now

### Auto-Print Flow:
1. **Order Completion** → Backend creates print job
2. **Socket Event** → `printJob:created` emitted
3. **Print Jobs Component** → Receives event in `setupSocketListeners()`
4. **Validation** → `handleAutoPrint()` checks:
   - ✅ Order exists and is complete
   - ✅ Order is paid
   - ✅ **Store setting `printAfterFinish` is enabled**
   - ✅ Bluetooth printer is connected
5. **Auto-Print** → If all checks pass, prints receipt automatically
6. **Skip** → If any check fails, logs reason and skips

### Manual Print:
- Still available via `printJobViaBluetooth()` button in UI
- Uses same `generatePrintJobReceipt()` method

## Benefits

### 1. **DRY (Don't Repeat Yourself)**
   - Single source of truth for receipt generation
   - Single socket listener for print jobs
   - No duplicate logic

### 2. **Store-Based Configuration**
   - Respects `store.posSettings.receiptSettings.printAfterFinish` setting
   - Can enable/disable auto-print per store
   - Consistent with other receipt settings

### 3. **Better Maintainability**
   - All print logic in one place
   - Easier to debug and update
   - Clear separation of concerns

### 4. **Comprehensive Logging**
   - Detailed console logs for each validation step
   - Easy to troubleshoot auto-print issues
   - Clear visibility into why prints succeed or skip

## Configuration

To enable/disable auto-printing:

```typescript
// In store schema (backend)
posSettings: {
  receiptSettings: {
    printAfterFinish: true  // or false to disable
  }
}
```

## Testing

### Test Auto-Print:
1. Enable Bluetooth printer in Print Jobs settings
2. Ensure `printAfterFinish` is `true` in store settings
3. Create and complete an order
4. Mark order as paid
5. Verify receipt prints automatically

### Test Manual Print:
1. Navigate to Print Jobs page
2. Find any completed print job
3. Click "Print via Bluetooth" button
4. Verify receipt prints

## Migration Notes

### Before (Duplicated):
- `auto-print.service.ts` → Listened to socket, generated receipt
- `print-jobs.component.ts` → Listened to socket, generated receipt

### After (Consolidated):
- `print-jobs.component.ts` → Single listener, single generator, store-aware

### No Breaking Changes:
- All existing functionality preserved
- Print job creation flow unchanged
- Manual printing still works
- Socket events remain the same

## Future Enhancements

Possible improvements now that code is consolidated:
1. Add retry logic for failed auto-prints
2. Queue prints when printer is busy
3. Support multiple printer configurations
4. Add print preview before auto-print
5. Track auto-print success/failure stats
