# Channex ARI Usage Examples

Real-world examples for managing rates, availability, and restrictions.

## Scenario 1: Weekend vs Weekday Pricing

Set $100/night on weekdays, $150/night on weekends for February 2026.

**Step 1: Set base weekday rate**
```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "days": ["mo", "tu", "we", "th", "fr"],
      "rate": 10000
    }]
  }'
```

**Step 2: Override weekend rates**
```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "days": ["sa", "su"],
      "rate": 15000
    }]
  }'
```

**Result:** 
- Mon-Fri: ₦10,000 
- Sat-Sun: ₦15,000

---

## Scenario 2: Block Arrivals During Maintenance

Property needs cleaning from March 1-5, 2026. Allow existing guests to stay, but block new arrivals.

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-03-01",
      "dateTo": "2026-03-05",
      "closedToArrival": true,
      "rate": 0
    }]
  }'
```

**Result:** OTA channels show property unavailable for new bookings, but departures allowed.

---

## Scenario 3: Holiday Season Peak Pricing

December 20, 2026 - January 5, 2027: Peak season with special rules.
- Rate: ₦50,000/night
- Minimum 5-night stay required
- Maximum 21-night stay allowed
- No cancellation allowed (closedToDeparture for check-in guests)

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-12-20",
      "dateTo": "2027-01-05",
      "rate": 50000,
      "minStayArrival": 5,
      "maxStay": 21,
      "availability": 10
    }]
  }'
```

**Result:** High season pricing enforced with stay restrictions.

---

## Scenario 4: Manage Inventory by Date

Set different availability for different dates (e.g., some dates have maintenance).

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [
      {
        "ratePlanId": "plan-uuid-123",
        "date": "2026-02-01",
        "availability": 8,
        "rate": 25000
      },
      {
        "ratePlanId": "plan-uuid-123",
        "date": "2026-02-02",
        "availability": 6,
        "rate": 25000
      },
      {
        "ratePlanId": "plan-uuid-123",
        "date": "2026-02-03",
        "availability": 10,
        "rate": 25000
      }
    ]
  }'
```

**Result:** Inventory controlled per date.

---

## Scenario 5: Last-Minute Discount

Promote the next 7 days with 20% discount. Current rate is ₦30,000, new rate ₦24,000.

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-01-23",
      "dateTo": "2026-01-29",
      "rate": 24000,
      "minStayArrival": 1
    }]
  }'
```

**After discount ends**, revert to regular rate for February and beyond.

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-01-30",
      "dateTo": "2026-02-28",
      "rate": 30000
    }]
  }'
```

---

## Scenario 6: Non-Refundable Rate Plan

For a specific rate plan, apply non-refundable restrictions.

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "non-refundable-plan-uuid",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "rate": 20000,
      "closedToDeparture": true
    }]
  }'
```

**Note:** Typically non-refundable is a rate plan property in Channex, not a restriction. Use with caution.

---

## Scenario 7: Progressive Pricing - Early Bird Discount

- February 1-15: Early bird ₦22,000
- February 16-28: Regular ₦28,000

```bash
# Early bird period
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-15",
      "rate": 22000
    }]
  }'

# Regular period
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-02-16",
      "dateTo": "2026-02-28",
      "rate": 28000
    }]
  }'
```

**Result:** Different prices for different booking periods.

---

## Scenario 8: Events & Group Bookings

Major conference in town March 15-20. Limited rooms available, higher rates.

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-03-15",
      "dateTo": "2026-03-20",
      "rate": 45000,
      "availability": 3,
      "minStayArrival": 2
    }]
  }'
```

**Result:** Conference dates have higher rates, lower availability, and require 2-night minimum.

---

## Scenario 9: Seasonal Closure

Property closed for renovation May 1-31, 2026. Completely unavailable.

```bash
curl -X POST http://localhost:3000/admin/channex/stores/store-123/restrictions \
  -H 'Content-Type: application/json' \
  -d '{
    "values": [{
      "ratePlanId": "plan-uuid-123",
      "dateFrom": "2026-05-01",
      "dateTo": "2026-05-31",
      "stopSell": true,
      "availability": 0
    }]
  }'
```

**Result:** Property hidden from all OTA channels during closure.

---

## Scenario 10: Recovery from Frontend UI

User made changes in the UI but browser crashed. Recover the draft.

**Get the draft:**
```bash
curl -X GET \
  'http://localhost:3000/admin/channex/stores/store-123/pricing-draft?startDate=2026-02-01&endDate=2026-02-28'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "startDate": "2026-02-01",
    "endDate": "2026-02-28",
    "rates": {...},
    "availability": {...},
    "restrictions": {...},
    "savedAt": "2026-01-23T10:30:00Z"
  }
}
```

User can manually re-enter changes or frontend auto-loads from localStorage.

---

## Frontend Usage Examples

### In the UI

**Applying weekend pricing:**

1. Select Feb 1-28 date range
2. Click lock icon to enter edit mode
3. Expand "Restrictions & Rules" panel
4. Enter min/max stay requirements
5. Click "Sa" and "Su" day buttons
6. Enter special weekend rate (150000)
7. Click "Apply Restrictions"
8. Click "Save Changes"

### Bulk Update via API (from your backend)

If you need to update multiple properties programmatically:

```typescript
async function updateChainRates(hotelIds: string[], newRate: number) {
  for (const hotelId of hotelIds) {
    await fetch(`/admin/channex/stores/${hotelId}/restrictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [{
          ratePlanId: 'default-plan',
          dateFrom: '2026-02-01',
          dateTo: '2026-02-28',
          rate: newRate
        }]
      })
    });
  }
}
```

---

## Common Mistakes to Avoid

❌ **Don't:** Set past dates
```json
{
  "dateFrom": "2025-12-01",  // ❌ INVALID - past date
  "dateTo": "2026-02-28"
}
```

✅ **Do:** Use only future dates
```json
{
  "dateFrom": "2026-02-01",  // ✅ VALID
  "dateTo": "2026-02-28"
}
```

---

❌ **Don't:** Set rate to 0 or negative
```json
{
  "rate": -5000  // ❌ INVALID
}
```

✅ **Do:** Use stopSell instead
```json
{
  "stopSell": true  // ✅ Prevents sales without rate
}
```

---

❌ **Don't:** Forget to send date_from/date_to for ranges
```json
{
  "rate": 30000
  // ❌ Missing date or date_from/date_to
}
```

✅ **Do:** Include date range or single date
```json
{
  "dateFrom": "2026-02-01",
  "dateTo": "2026-02-28",
  "rate": 30000  // ✅ Complete
}
```

---

## Checking Updates in Channex Dashboard

After pushing rates/restrictions via API:

1. Go to Channex.io dashboard
2. Navigate to your property
3. Go to "Rates & Availability" section
4. Check the date range matches your update
5. Verify values appeared correctly
6. Check "Channels" tab to see distribution status

---

## Debugging Tips

**Check LocalStorage draft:**
```javascript
// In browser console
const keys = Object.keys(localStorage);
const drafts = keys.filter(k => k.includes('pricing_draft'));
drafts.forEach(key => {
  console.log(key, JSON.parse(localStorage.getItem(key)));
});
```

**Monitor API requests:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "restrictions"
4. Watch requests/responses as you click "Save"

**Check server logs:**
```bash
# View last 20 lines of logs
tail -20 /var/log/app.log

# Search for Channex errors
grep -i "channex" /var/log/app.log | tail -50
```

---

## Performance Tips

- ✅ Use date ranges instead of individual dates (1 request vs 30)
- ✅ Batch multiple restrictions in single POST
- ✅ Keep drafts under 3 months (performance)
- ✅ Don't edit large calendars in mobile (localStorage size)

Example optimized request:
```json
{
  "values": [
    { "dateFrom": "2026-02-01", "dateTo": "2026-02-28", "rate": 30000 },
    { "dateFrom": "2026-03-01", "dateTo": "2026-03-31", "rate": 32000 },
    { "dateFrom": "2026-04-01", "dateTo": "2026-04-30", "rate": 28000 }
  ]
}
// 3 months in 1 request instead of 90 individual dates
```

