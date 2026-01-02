export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';

export type BillingCountry = 'NG' | 'MU' | 'USD';

export interface Subscription {
  _id: string;
  storeId: string;
  status: SubscriptionStatus;
  billingCountry: BillingCountry;
  billingEmail: string;
  trialStartDate: string;
  trialEndDate: string;
  nextBillingDate?: string;
  lastBillingDate?: string;
  hasPaymentMethod: boolean;
  paystackCustomerCode?: string;
  paystackAuthorizationCode?: string;
  failedBillingAttempts: number;
  isManualPaymentRequired: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  cardBin?: string;
  cardLast4?: string;
  cardType?: string;
  cardBrand?: string;
  cardBank?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardCountry?: string;
  roomCount?: number;
}

export interface Invoice {
  _id: string;
  subscriptionId: string;
  storeId: string;
  invoiceNumber: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  billingDate: string;
  dueDate: string;
  paidDate?: string;
  paystackTransactionReference?: string;
  paymentAttempts: string[];
  description?: string;
}

export interface PaymentAttempt {
  _id: string;
  invoiceId: string;
  subscriptionId: string;
  storeId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paystackTransactionReference?: string;
  paystackAuthorizationCode?: string;
  paystackCustomerCode?: string;
  errorMessage?: string;
  attemptedAt: string;
  completedAt?: string;
  attemptNumber: number;
}
