# Quick Fix: 404 Error on Rates & Availability Page

## The Issue
You see a 404 error when trying to access Rates & Availability because Channex doesn't know about your property yet.

## The Fix (3 Steps)

### Step 1: Go to Channel Management
From the Rates & Availability page, click "Go to Channel Management"
(Or: HMS → Channel Management from sidebar)

### Step 2: Sync Your Store to Channex
- Click the "Sync Store to Channex" button in **Step 1**
- Select hotel type, set check-in (15:00) and check-out (11:00) times
- Click "Sync"
- Wait for success message ✓

### Step 3: Return to Rates & Availability
- The warning will be gone
- You can now manage rates and availability

## What Happens Behind the Scenes

When you sync in Step 2:
- System creates your property in Channex
- Channex assigns a unique `propertyId` to your store
- This ID is saved in your database
- Now the Rates & Availability page can access Channex

## Why This Error Happens

Rates & Availability needs:
1. ✅ Your store to exist in our database
2. ✓ Your store synced to Channex with a valid propertyId
3. ✅ Channex to know about your property

The error means #2 wasn't done yet.

## Detailed Setup (Optional)

After syncing your store, you can also:

### Map Room Types (Optional but Recommended)
- Click "Sync" for each room type
- This tells Channex about your rooms

### Push Initial Availability
- Set date range (e.g., next 90 days)
- Click "Push Availability"
- Your rates and availability go to Channex

Once these are done, Channex can distribute your rates to booking sites like Booking.com, Airbnb, etc.

## Still Having Issues?

1. **Still see the warning?**
   - Refresh the page after syncing
   - Check that your store type is "hotel"

2. **Sync button doesn't work?**
   - Make sure you selected a property type
   - Check browser console for errors

3. **Need more help?**
   - See CHANNEX_INTEGRATION.md for full documentation
