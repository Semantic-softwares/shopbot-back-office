# Payment Transaction Management System

## Overview

The payment transaction system enables comprehensive tracking and management of all payment-related activities for reservations. It includes real-time balance calculations, transaction history, and multiple payment processing scenarios.

## Architecture

### Frontend Components

#### 1. **PaymentUpdateDialogComponent**
Location: `src/app/menu/hms/front-desk/reservations/payment-update-dialog/`

**Purpose**: Standalone dialog for managing payments and viewing transaction history

**Key Features**:
- Dual-flow interface (checkout vs. edit mode)
- Real-time payment status calculation
- Transaction history with full audit trail
- Payment breakdown with progress visualization
- Multiple payment method support

**States**:
- `processing` - Transaction creation in progress
- `loadingTransactions` - Fetching transaction history
- `loadError` - User-friendly error messages
- `totalAmount`, `paidAmount`, `balanceAmount` - Computed payment metrics

**Computed Properties**:
- `paymentPercentage()` - Calculate paid percentage of total
- `getCurrentPaymentStatus()` - Determine pending/partial/paid
- `getCurrentStatusClass()` - Color coding for status display
- `hasApprovedExtensions()` - Check for extension fees

### Backend API

#### Transaction Endpoints

All endpoints require `storeId` and proper authorization:

```
POST   /api/v1/stores/:storeId/reservations/:reservationId/transactions
       Create new transaction (payment, refund, adjustment)

GET    /api/v1/stores/:storeId/reservations/:reservationId/transactions
       Fetch all transactions for a reservation

GET    /api/v1/stores/:storeId/reservations/:reservationId/transactions/:txId
       Get single transaction details

GET    /api/v1/stores/:storeId/transactions
       Get paginated store transactions with filters

POST   /api/v1/stores/:storeId/reservations/:reservationId/transactions/:txId
       Update transaction notes/status

POST   /api/v1/stores/:storeId/reservations/:reservationId/transactions/:txId/reverse
       Create refund (reverses original transaction)
```

#### Request/Response Format

**Create Transaction**:
```typescript
// Request
{
  amount: number;              // Transaction amount
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'online';
  type: 'payment' | 'refund' | 'adjustment';
  notes?: string;              // Optional transaction notes
  reference?: string;          // Optional reference (receipt ID, etc.)
  processedBy?: ObjectId;      // User creating transaction
}

// Response
{
  transaction: {
    _id: ObjectId;
    reservation: ObjectId;
    store: ObjectId;
    amount: number;
    type: 'payment' | 'refund' | 'adjustment';
    status: 'pending' | 'completed' | 'failed' | 'reversed';
    method: string;
    notes?: string;
    balanceAfterTransaction: number;
    createdAt: Date;
    updatedAt: Date;
  },
  reservation: {
    // Updated reservation with new pricing info
    pricing: {
      total: number;
      paid: number;
      balance: number;
    },
    transactions: [ObjectId]  // Array of transaction IDs
  }
}
```

## Usage Flows

### 1. Checkout Flow (Recording Payment at Check-out)

**Trigger**: Check-out button on reservation card/details

**Dialog Configuration**:
```typescript
const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
  data: {
    reservation: reservation,
    isCheckoutFlow: true  // Enable amount input
  }
});
```

**User Actions**:
1. Views payment breakdown (total, paid, balance)
2. Selects payment method
3. Enters payment amount (with quick buttons for common amounts)
4. Optionally enters reference number and notes
5. Clicks "Save Payment"

**Backend Processing**:
1. Creates `payment` transaction
2. Updates reservation `pricing.paid` and `pricing.balance`
3. Atomically updates reservation with transaction ID
4. Returns both transaction and updated reservation

**Result**:
- Dialog closes with transaction data
- Component can update reservation balance
- Transaction appears in history tab

### 2. Edit Flow (Managing Payment Status)

**Trigger**: Edit reservation or payment section

**Dialog Configuration**:
```typescript
const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
  data: {
    reservation: reservation,
    isCheckoutFlow: false  // Status dropdown instead of amount
  }
});
```

**User Actions**:
1. Views payment breakdown
2. Changes payment status (Pending → Partial → Paid)
3. Updates payment method if needed
4. Adds notes or reference
5. Clicks "Save Payment"

**Backend Processing**:
- Currently returns data to component for handling
- Can be extended to call status update endpoint

### 3. Transaction History

**Always Available** in the dialog's "Transaction History" tab

**Features**:
- Sortable/filterable transaction list
- Shows: Date, Amount, Method, Type, Status, Balance After
- Color-coded transaction types (green for payment, red for refund)
- Refund button for completed payments
- Handles loading states and errors gracefully

**Error Handling**:
- Shows user-friendly message if transactions can't load
- Allows payment processing to continue even if history load fails
- Displays 404 errors (reservation not found) clearly

## Payment Status Logic

```typescript
function getCurrentPaymentStatus(): 'pending' | 'partial' | 'paid' {
  const balance = balanceAmount();
  const paid = paidAmount();
  
  if (balance <= 0) {
    return 'paid';           // Full payment received
  } else if (paid > 0) {
    return 'partial';        // Some payment received
  } else {
    return 'pending';        // No payment received
  }
}
```

## Breakdown Display

The dialog shows a comprehensive payment breakdown:

```
Total Amount:     $X,XXX.XX
Amount Paid:      $X,XXX.XX (green)
Balance Due:      $X,XXX.XX (red if > 0, green if 0)
Payment Status:   PENDING | PARTIAL | PAID (color-coded)
Payment Progress: Visual progress bar (0-100%)
```

### Extension Costs
If reservation has approved extensions:
```
Approved Extensions: N night(s) @ $XXX.XX
```

## Integration Points

### From Reservation Details Component

```typescript
openPaymentDialog(): void {
  const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
    width: '800px',
    data: {
      reservation: this.reservation,
      isCheckoutFlow: true // or false
    }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result?.confirmed) {
      // Update local reservation state
      if (result.reservation) {
        this.reservation = result.reservation;
        // Update pricing display
        this.updateBreakdown();
      }
      
      // Show success notification
      this.toastr.success('Payment recorded successfully');
    }
  });
}
```

### From Front-Desk Check-out Flow

```typescript
async checkOutWithPayment(): Promise<void> {
  const dialogRef = this.dialog.open(PaymentUpdateDialogComponent, {
    data: {
      reservation: this.reservation,
      isCheckoutFlow: true
    }
  });

  const result = await firstValueFrom(dialogRef.afterClosed());
  
  if (result?.confirmed) {
    // Proceed with check-out
    await this.reservationService.checkOut(
      this.reservation._id,
      { actualCheckOutTime: new Date() }
    ).toPromise();
  }
}
```

## Error Handling

### Network/API Errors

**Transaction Creation Fails**:
```
Alert: "Failed to process transaction. Please try again."
Or: "[Error message from backend]"
```

**History Loading Fails**:
```
Warning: "Failed to load transaction history. You can still record new payments."
```

**Reservation Not Found**:
```
Alert: "Reservation not found"
History Tab: "Reservation not found. Please refresh and try again."
```

### Validation Errors

**Checkout Flow**:
- Amount required
- Amount > 0
- Amount ≤ Balance due
- Payment method required

**Edit Flow**:
- Status required
- Can't mark "Paid" if balance > 0
- Payment method required

## Database Schema

### ReservationTransaction Document

```typescript
{
  _id: ObjectId;
  reservation: ObjectId;           // Reference to Reservation
  store: ObjectId;                 // Reference to Store
  amount: number;                  // Transaction amount
  type: 'payment' | 'refund' | 'adjustment';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'online';
  paymentGateway?: {
    provider: string;              // e.g., 'stripe', 'paypal'
    transactionId: string;
    reference?: string;
  };
  processedBy: ObjectId;           // User who created transaction
  refundOf?: ObjectId;             // Reference to original transaction if refund
  notes?: string;
  balanceAfterTransaction: number; // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

### Reservation Schema Updates

```typescript
{
  // ... existing fields
  transactions: [ObjectId];        // Array of ReservationTransaction IDs
  pricing: {
    total: number;
    paid: number;                  // Updated atomically with transaction
    balance: number;               // Updated atomically with transaction
  }
}
```

## Best Practices

1. **Always Show Breakdown**: Display payment summary before any action
2. **Graceful Degradation**: Allow payment processing even if history fails
3. **Clear Validation**: Show specific error messages for each validation
4. **Progress Indication**: Use visual cues (progress bar, status colors)
5. **Audit Trail**: Keep transaction history immutable
6. **User Context**: Show store and confirmation number for context
7. **Quick Actions**: Provide quick-amount buttons for common scenarios

## Future Enhancements

- [ ] Payment plan support (installments)
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Automatic payment reminders
- [ ] Payment reporting dashboard
- [ ] Refund approval workflow
- [ ] Payment reconciliation tools
- [ ] Invoice generation from transactions
- [ ] Payment method validation (card tokenization, etc.)

