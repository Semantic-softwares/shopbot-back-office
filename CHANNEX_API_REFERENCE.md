# Channex ARI API Reference

Quick reference for all new API endpoints and their usage.

## Restrictions Endpoints

### Get Restrictions
Fetch current restrictions from Channex for a date range.

```
GET /admin/channex/stores/:storeId/restrictions
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)
  - restrictions: string (comma-separated) [optional]
    Default: rate,availability,min_stay_arrival,min_stay_through,max_stay,closed_to_arrival,closed_to_departure,stop_sell

Response:
{
  "success": true,
  "data": {
    "[RATE_PLAN_ID]": {
      "[DATE_YYYY-MM-DD]": {
        "rate": 30000,
        "availability": 5,
        "min_stay_arrival": 1,
        "min_stay_through": null,
        "max_stay": 30,
        "closed_to_arrival": false,
        "closed_to_departure": false,
        "stop_sell": false
      }
    }
  }
}
```

### Push Restrictions
Push restrictions and rates to Channex.

```
POST /admin/channex/stores/:storeId/restrictions
Body:
{
  "values": [
    {
      "ratePlanId": "uuid",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "days": ["mo", "tu", "we"],        // optional - specific days only
      "rate": 30000,                     // optional
      "minStayArrival": 1,               // optional
      "minStayThrough": 2,               // optional
      "minStay": null,                   // optional (use one of above)
      "maxStay": 30,                     // optional
      "closedToArrival": false,          // optional
      "closedToDeparture": false,        // optional
      "stopSell": false,                 // optional
      "availability": 10                 // optional
    }
  ]
}

Response:
{
  "success": true,
  "message": "Restrictions pushed to Channex successfully",
  "count": 1,
  "warnings": []                         // API warnings if any
}
```

**Examples:**

Basic rate update for date range:
```json
{
  "values": [{
    "ratePlanId": "abc-123",
    "dateFrom": "2026-02-01",
    "dateTo": "2026-02-28",
    "rate": 30000
  }]
}
```

Different rates for weekends vs weekdays:
```json
{
  "values": [
    {
      "ratePlanId": "abc-123",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "rate": 20000              // base rate all days
    },
    {
      "ratePlanId": "abc-123",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "days": ["sa", "su"],       // override for weekends
      "rate": 35000
    }
  ]
}
```

Multiple restrictions on date range:
```json
{
  "values": [{
    "ratePlanId": "abc-123",
    "dateFrom": "2026-02-20",
    "dateTo": "2026-02-28",
    "rate": 30000,
    "minStayArrival": 2,
    "closedToArrival": false,
    "closedToDeparture": false,
    "maxStay": 7
  }]
}
```

Block check-ins during maintenance:
```json
{
  "values": [{
    "ratePlanId": "abc-123",
    "dateFrom": "2026-03-01",
    "dateTo": "2026-03-05",
    "closedToArrival": true,
    "closedToDeparture": false
  }]
}
```

---

## Rate Plans Endpoints

### Get Rate Plans
Get available rate plans for a property.

```
GET /admin/channex/stores/:storeId/rate-plans

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Standard Room",
      "channexRatePlanId": "uuid-1"
    },
    {
      "id": "uuid-2",
      "name": "Deluxe Room",
      "channexRatePlanId": "uuid-2"
    }
  ]
}
```

---

## Pricing Draft Endpoints

### Save Draft
Save current pricing edits as a draft for recovery.

```
POST /admin/channex/stores/:storeId/pricing-draft
Body:
{
  "startDate": "2026-02-01",
  "endDate": "2026-02-28",
  "data": {
    // Your pricing data structure
  }
}

Response:
{
  "success": true,
  "message": "Draft saved successfully"
}
```

### Get Draft
Retrieve a previously saved draft.

```
GET /admin/channex/stores/:storeId/pricing-draft
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)

Response:
{
  "success": true,
  "data": {
    "startDate": "2026-02-01",
    "endDate": "2026-02-28",
    "rates": {...},
    "savedAt": "2026-01-23T10:30:00Z"
  }
}
```

If no draft exists, returns `data: null`.

### Clear Drafts
Remove all saved drafts for a store.

```
POST /admin/channex/stores/:storeId/pricing-draft/clear

Response:
{
  "success": true,
  "message": "Drafts cleared successfully"
}
```

---

## Existing Endpoints (Enhanced)

### Push Rates
Now also supports restrictions via the same endpoint as before.

```
POST /admin/channex/stores/:storeId/rates
Body:
{
  "startDate": "2026-02-01",
  "endDate": "2026-02-28",
  "rates": [
    {
      "date": "2026-02-01",
      "roomTypeId": "uuid",
      "rate": 25000,
      "availability": 5
    }
  ],
  "currency": "NGN"
}

Response:
{
  "success": true,
  "message": "Rates pushed to Channex successfully",
  "count": 10
}
```

### Push Availability
Unchanged, but can be combined with restrictions.

```
POST /admin/channex/stores/:storeId/availability
Body:
{
  "startDate": "2026-02-01",
  "endDate": "2026-02-28"
}

Response:
{
  "success": true,
  "message": "Availability pushed successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid date format. Expected YYYY-MM-DD"
}
```

### 400 Validation Error (from Channex)
```json
{
  "statusCode": 400,
  "message": "Channex API: Validation failed",
  "warnings": [
    {
      "rate": "must be greater than 0",
      "date_from": "2020-10-03",
      "date_to": "2020-10-05"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Channex API: Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to push restrictions: Store not found or not synced with Channex"
}
```

---

## Field Validation Rules

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| `rate` | integer/string | > 0 | 30000 or "300.00" |
| `minStayArrival` | integer | >= 1 | 2 |
| `minStayThrough` | integer | >= 1 | 3 |
| `maxStay` | integer | >= 0 | 14 |
| `closedToArrival` | boolean | true/false or 0/1 | true |
| `closedToDeparture` | boolean | true/false or 0/1 | false |
| `stopSell` | boolean | true/false or 0/1 | false |
| `availability` | integer | >= 0 | 5 |
| `date` | string | YYYY-MM-DD, not past | "2026-02-01" |
| `dateFrom` | string | YYYY-MM-DD, not past | "2026-02-01" |
| `dateTo` | string | YYYY-MM-DD, not past | "2026-02-28" |
| `days` | array | mo/tu/we/th/fr/sa/su | ["sa", "su"] |

---

## Common Patterns

### Set Different Rates for Different Days
```javascript
// Weekday rate
await fetch('/admin/channex/stores/123/restrictions', {
  method: 'POST',
  body: JSON.stringify({
    values: [{
      ratePlanId: 'rate-plan-id',
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
      days: ['mo', 'tu', 'we', 'th', 'fr'],
      rate: 20000
    }]
  })
});

// Weekend rate
await fetch('/admin/channex/stores/123/restrictions', {
  method: 'POST',
  body: JSON.stringify({
    values: [{
      ratePlanId: 'rate-plan-id',
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
      days: ['sa', 'su'],
      rate: 35000
    }]
  })
});
```

### Block Arrivals During Maintenance
```javascript
await fetch('/admin/channex/stores/123/restrictions', {
  method: 'POST',
  body: JSON.stringify({
    values: [{
      ratePlanId: 'rate-plan-id',
      dateFrom: '2026-03-01',
      dateTo: '2026-03-05',
      closedToArrival: true,
      stopSell: true
    }]
  })
});
```

### Set Minimum Stay Requirements
```javascript
await fetch('/admin/channex/stores/123/restrictions', {
  method: 'POST',
  body: JSON.stringify({
    values: [{
      ratePlanId: 'rate-plan-id',
      dateFrom: '2026-12-20',
      dateTo: '2027-01-05',
      minStayArrival: 3,        // 3 night minimum
      rate: 50000
    }]
  })
});
```

### High Season with Max Stay Limit
```javascript
await fetch('/admin/channex/stores/123/restrictions', {
  method: 'POST',
  body: JSON.stringify({
    values: [{
      ratePlanId: 'rate-plan-id',
      dateFrom: '2026-12-01',
      dateTo: '2026-12-31',
      rate: 75000,
      minStayArrival: 4,        // 4 night minimum
      maxStay: 14,              // 2 week maximum
      closedToArrival: false,
      closedToDeparture: false
    }]
  })
});
```

---

## cURL Examples

### Get Restrictions
```bash
curl -X GET \
  'http://localhost:3000/admin/channex/stores/store-123/restrictions?startDate=2026-02-01&endDate=2026-02-28' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Push Single Date Rate
```bash
curl -X POST \
  'http://localhost:3000/admin/channex/stores/store-123/restrictions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "values": [{
      "ratePlanId": "rate-plan-id",
      "date": "2026-02-01",
      "rate": 30000
    }]
  }'
```

### Push Date Range Rate
```bash
curl -X POST \
  'http://localhost:3000/admin/channex/stores/store-123/restrictions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "values": [{
      "ratePlanId": "rate-plan-id",
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-28",
      "rate": 30000
    }]
  }'
```

### Get Rate Plans
```bash
curl -X GET \
  'http://localhost:3000/admin/channex/stores/store-123/rate-plans' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid parameters or Channex validation error
- **401 Unauthorized** - Missing or invalid API key
- **500 Internal Server Error** - Server error, check logs
- **503 Service Unavailable** - Channex API temporarily down

---

## Rate Limiting

Channex API rate limits:
- 100 requests per minute per API key
- Bulk updates recommended to stay under limit
- Use date ranges instead of individual dates
- Batch multiple restrictions in single request

