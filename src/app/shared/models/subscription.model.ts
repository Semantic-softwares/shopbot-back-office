export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export type BillingCountry = 'NG' | 'MU' | 'USD';

export type ModuleKey = 'PMS' | 'EMS' | 'POS' | 'ERP';

export type ModuleStatus = 'ACTIVE' | 'PENDING_REMOVAL';

export interface SubscriptionModule {
  _id: string;
  subscriptionId: string;
  storeId: string;
  moduleKey: ModuleKey;
  status: ModuleStatus;
  monthlyPriceSnapshot: number;
  yearlyPriceSnapshot: number;
  billingPriceSnapshot: number;
  addedAt: string;
  activatedAt?: string;
  removedAt?: string;
}

export interface Subscription {
  _id: string;
  storeId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currency: string;
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
  totalRecurringAmount: number;
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

export interface SubscriptionWithModules {
  subscription: Subscription;
  modules: SubscriptionModule[];
  pricing: Array<{
    moduleKey: ModuleKey;
    monthly: number;
    yearly: number;
    billingPrice: number;
    status: ModuleStatus;
  }>;
  totalMonthly: number;
  totalYearly: number;
  totalRecurring: number;
  trialEndsAt: string;
  nextBillingDate: string;
}

export interface InvoiceLine {
  module: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  subscriptionId: string;
  storeId: string;
  invoiceNumber: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  type: 'SUBSCRIPTION' | 'MANUAL';
  billingCycle?: BillingCycle;
  lines: InvoiceLine[];
  amount: number;
  currency: string;
  billingDate: string;
  dueDate: string;
  paidDate?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
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
