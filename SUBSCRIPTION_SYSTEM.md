# ShopBot Subscription System Implementation

This implementation provides a comprehensive subscription system based on data consumption for the ShopBot ecosystem.

## Features

### Backend (NestJS)
- **MongoDB document size calculation** - Accurate BSON size tracking
- **Automatic usage tracking** - Decorators and interceptors for seamless tracking
- **Subscription tiers** - Free (500MB), Premium (5GB), Unlimited
- **Bandwidth limit enforcement** - Middleware to prevent operations when limit exceeded
- **Usage analytics** - Detailed logging and reporting

### Frontend (Angular)
- **Modern Angular 20+ features** - Uses signals, computed values, and new control flow
- **Real-time usage display** - Live progress bars and warnings
- **Subscription management** - Upgrade dialogs and plan comparison
- **Material Design** - Clean UI with Angular Material and Tailwind CSS
- **Responsive layout** - Works on all screen sizes

## Subscription Tiers

| Plan | Price | Storage | Features |
|------|-------|---------|----------|
| **Free** | $0/month | 500MB | Basic POS, Email support |
| **Premium** | $15/month | 5GB | Advanced POS, Priority support, Analytics |
| **Unlimited** | $100/month | Unlimited | Everything, 24/7 support, Custom features |

## Backend Usage

### 1. Track Usage Automatically

```typescript
@Controller('api/products')
@UseInterceptors(UsageTrackingInterceptor)
export class ProductController {
  @Post()
  @TrackUsage({ collection: 'products', operation: 'CREATE' })
  async createProduct(@Body() productData: any) {
    // Usage automatically tracked after successful creation
    return await this.productService.create(productData);
  }
}
```

### 2. Manual Usage Tracking

```typescript
// In your service
await this.usageService.trackUsage(
  storeId,
  'products',
  createdDocument,
  'CREATE'
);
```

### 3. Check Usage Limits

```typescript
const { exceeded, usage, limit } = await this.usageService.checkBandwidthLimit(storeId);
if (exceeded) {
  throw new HttpException('Storage limit exceeded', HttpStatus.PAYMENT_REQUIRED);
}
```

## Frontend Usage

### 1. Add to Your Layout

```typescript
// In your component template
<app-layout-with-sidebar [storeId]="currentStoreId">
  <!-- Your content here -->
</app-layout-with-sidebar>
```

### 2. Standalone Usage Indicator

```typescript
// Add anywhere in your app
<app-usage-indicator [storeId]="storeId" />
```

### 3. Service Usage

```typescript
export class MyComponent {
  subscriptionService = inject(SubscriptionService);

  ngOnInit() {
    this.subscriptionService.setCurrentStoreId('store-123');
    
    // Access reactive data
    const usage = this.subscriptionService.usageData();
    const subscription = this.subscriptionService.currentSubscription();
    
    // Check status
    if (this.subscriptionService.shouldShowUsageWarning()) {
      // Show warning
    }
  }
}
```

## Installation

### Backend
1. Install dependencies: `npm install`
2. Add the SubscriptionModule to your app module
3. Apply UsageCheckMiddleware to routes that create data
4. Use @TrackUsage decorator on controller methods

### Frontend
1. Import the SubscriptionFeatureModule or use standalone components
2. Add HttpClientModule to your app
3. Use the components in your templates

## Configuration

### Environment Variables
```typescript
export const environment = {
  apiUrl: 'http://localhost:3000',
  subscriptionApiUrl: 'http://localhost:3000/api/subscriptions',
  usageApiUrl: 'http://localhost:3000/api/usage',
};
```

## API Endpoints

- `GET /api/subscriptions/plans` - Get available subscription plans
- `GET /api/subscriptions/current/:storeId` - Get current subscription
- `POST /api/subscriptions/upgrade` - Upgrade subscription
- `GET /api/usage/:storeId` - Get usage statistics

## MongoDB Size Calculation

The system calculates document sizes using BSON format:
- Strings: 4 bytes (length) + UTF-8 bytes + 1 byte (null terminator)
- Numbers: 4 bytes (int32) or 8 bytes (double)
- Booleans: 1 byte
- Dates: 8 bytes
- Objects/Arrays: Recursive calculation with overhead

## Error Handling

When storage limits are exceeded, the system returns:
```json
{
  "message": "Storage limit exceeded. Please upgrade your subscription to continue.",
  "usage": "2.1 GB",
  "limit": "2.0 GB",
  "upgradeUrl": "/subscriptions/upgrade",
  "statusCode": 402
}
```

## Monitoring

The system logs all document operations and provides:
- Real-time usage tracking
- Historical usage data
- Bandwidth utilization reports
- Subscription analytics

## Security

- Store-based isolation - each store can only access its own data
- Rate limiting on subscription operations
- Secure payment processing integration ready
- Usage data privacy protection