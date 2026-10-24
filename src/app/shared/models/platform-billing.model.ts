/** Shapes of the platform billing API (seat tiers, every module included). Dates arrive as ISO strings. */

export type PlanStatus = 'ACTIVE' | 'ARCHIVED';
export type SubStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
/** PENDING is an open invoice (waiting to be paid); CANCELLED is void. */
export type InvoiceStatusV2 = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'UNCOLLECTIBLE';

export interface BillingPlan {
  _id: string;
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  currency: string;
  minSeats: number;
  maxSeats: number | null;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  contactUsOnly: boolean;
  features: string[];
  status: PlanStatus;
}

export interface SubscriptionContextV2 {
  billingVersion: number;
  status: SubStatus | null;
  planKey: string | null;
  planName: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  graceEndsAt: string | null;
  blocked: boolean;
  warn: boolean;
  daysRemaining: number | null;
  seatCount: number;
  seatCap: number | null;
  amount: number | null;
  currency: string | null;
  interval: 'MONTH' | 'YEAR' | null;
  pendingPlanKey: string | null;
  planChangesAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasCard: boolean;
  modules: string[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface InvoiceV2 {
  _id: string;
  invoiceNumber: string;
  status: InvoiceStatusV2;
  kind?: 'SUBSCRIPTION' | 'PRORATION';
  currency: string;
  total?: number;
  amount: number;
  amountPaid?: number;
  amountDue?: number;
  subtotal?: number;
  issuedAt?: string;
  billingDate: string;
  dueDate: string;
  paidDate?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  description?: string;
  planKey?: string;
  planName?: string;
  lineItems?: InvoiceLineItem[];
  proration?: Record<string, any>;
  notes?: string;
  seatCountAtIssue?: number;
  storeId?: string | { _id: string; name: string };
}

export interface PaymentV2 {
  _id: string;
  providerKey: 'paystack' | 'cash' | 'bank_transfer';
  amount: number;
  currency: string;
  receivedAt: string;
  reference?: string;
  notes?: string;
  providerPaymentRef?: string | null;
  invoiceId?: string | { _id: string; invoiceNumber: string; total: number; currency: string };
  storeId?: string | { _id: string; name: string };
}

export interface PaymentMethodV2 {
  key: string;
  displayName: string;
  isManual: boolean;
  requiresRedirect: boolean;
}

export interface PlanFit {
  planKey: string;
  fits: boolean;
  reason?: string;
}

export interface AccountContext {
  subscription: SubscriptionContextV2;
  plans: BillingPlan[];
  fit: PlanFit[];
  paymentMethods: PaymentMethodV2[];
  bankTransferInstructions: string;
  openInvoices: number;
}

export interface Proration {
  daysInPeriod: number;
  daysRemaining: number;
  chargeForRemainder: number;
  creditApplied: number;
  creditForfeited: number;
  netCharge: number;
}

export interface PlanChangeQuote {
  outcome: 'IMMEDIATE' | 'SCHEDULED' | 'REQUEST' | 'REFUSED';
  refusal?: { code: string; message: string };
  fromPlanKey: string | null;
  toPlanKey: string;
  toPlanName: string;
  fromAmount: number;
  toAmount: number | null;
  seats: number;
  maxSeats: number | null;
  proration?: Proration;
  netCharge: number;
  effectiveAt?: string;
  scheduledFor?: string;
}

// ---- super admin

export type AttentionSeverity = 'urgent' | 'soon' | 'info';

export interface AttentionItem {
  severity: AttentionSeverity;
  reason: string;
  storeId: string;
  storeName: string;
  detail: string;
}

export interface AdminOverview {
  stores: number;
  subscriptionsByStatus: Record<string, number>;
  mrr: number;
  arpa: number;
  mrrByPlan: Record<string, { mrr: number; stores: number }>;
  outstanding: number;
  collectedThisMonth: number;
  revenueByMonth: Array<{ month: string; amount: number }>;
  blocked: number;
  renewingSoon: number;
  trials: number;
  legacy: number;
  noSubscription: number;
  openRequests: number;
  attention: AttentionItem[];
  recentInvoices: InvoiceV2[];
}

export interface AdminStoreRow {
  storeId: string;
  name: string;
  storeNumber?: string;
  createdAt: string;
  email: string | null;
  status: SubStatus | null;
  legacy: boolean;
  planKey: string | null;
  amount: number | null;
  currency: string | null;
  interval: 'MONTH' | 'YEAR' | null;
  seats: number;
  seatCap: number | null;
  overCap: boolean;
  blocked: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  outstanding: number;
  hasCard: boolean;
}

export interface AdminStoreDetail {
  store: { _id: string; name: string; storeNumber?: string; storeType?: string; createdAt: string; email: string | null; currencyCode?: string };
  owner: { name?: string; email?: string; phoneNumber?: string } | null;
  subscription: Record<string, any> | null;
  context: SubscriptionContextV2;
  invoices: InvoiceV2[];
  members: Array<{ id: string; name?: string; email?: string; role?: string; status: string }>;
  modules: string[];
  upgradeRequest: { _id: string; requestedPlanKey: string; note?: string; createdAt: string } | null;
  audit: AuditRow[];
}

export interface AuditRow {
  _id: string;
  action: string;
  actorName?: string;
  storeName?: string;
  storeId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
  createdAt: string;
}

export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TrialRow {
  storeId: string;
  name?: string;
  email?: string;
  trialStartedAt: string;
  trialEndsAt: string;
  daysRemaining: number;
  planKey: string | null;
  legacy: boolean;
}

export interface UpgradeRequestRow {
  _id: string;
  requestedPlanKey: string;
  currentPlanKey?: string;
  note?: string;
  status: 'OPEN' | 'APPLIED' | 'DECLINED';
  createdAt: string;
  storeId: { _id: string; name: string } | string;
  requestedBy?: { name?: string; email?: string };
}

export interface BillingSettingsV2 {
  trialDays: number;
  graceDays: number;
  invoiceLeadDays: number;
  bankTransferInstructions: string;
}
