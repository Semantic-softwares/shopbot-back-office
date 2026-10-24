import { AccountContext, SubscriptionContextV2 } from '../models/platform-billing.model';
import { bannerFor } from './subscription-banner.state';

const sub = (over: Partial<SubscriptionContextV2> = {}): SubscriptionContextV2 => ({
  billingVersion: 2, status: 'ACTIVE', planKey: 'starter', planName: 'Starter', currentPeriodEnd: '2026-12-01', trialEndsAt: null, graceEndsAt: null,
  blocked: false, warn: false, daysRemaining: 20, seatCount: 2, seatCap: 5, amount: 49, currency: 'USD', interval: 'MONTH', pendingPlanKey: null,
  planChangesAt: null, cancelAtPeriodEnd: false, hasCard: false, modules: ['POS'], ...over,
});
const acct = (s: Partial<SubscriptionContextV2> = {}, openInvoices = 0): AccountContext => ({ subscription: sub(s), plans: [], fit: [], paymentMethods: [], bankTransferInstructions: '', openInvoices });

describe('bannerFor', () => {
  it('shows nothing for a healthy active store, an unknown store or an old-billing store', () => {
    expect(bannerFor(acct())).toBeNull();
    expect(bannerFor(null)).toBeNull();
    expect(bannerFor(acct({ billingVersion: 1 }))).toBeNull();
  });
  it('shows nothing once the account is locked: the paywall takes over', () => {
    expect(bannerFor(acct({ status: 'EXPIRED', blocked: true }))).toBeNull();
  });
  it('a late payment outranks everything and is critical', () => {
    const b = bannerFor(acct({ status: 'PAST_DUE', cancelAtPeriodEnd: true, seatCount: 9 }));
    expect(b?.kind).toBe('past-due');
    expect(b?.severity).toBe('critical');
  });
  it('a pending cancellation outranks a trial ending', () => {
    expect(bannerFor(acct({ status: 'TRIAL', daysRemaining: 2, cancelAtPeriodEnd: true }))?.kind).toBe('cancelling');
  });
  it('the trial gets louder as it runs out', () => {
    expect(bannerFor(acct({ status: 'TRIAL', daysRemaining: 12 }))).toEqual(jasmine.objectContaining({ kind: 'trial', severity: 'info' }));
    expect(bannerFor(acct({ status: 'TRIAL', daysRemaining: 6 }))).toEqual(jasmine.objectContaining({ kind: 'trial-ending', severity: 'warn' }));
    expect(bannerFor(acct({ status: 'TRIAL', daysRemaining: 3 }))).toEqual(jasmine.objectContaining({ kind: 'trial-ending', severity: 'critical' }));
  });
  it('a team over its plan limit is flagged, and outranks a routine invoice reminder', () => {
    expect(bannerFor(acct({ seatCount: 7, seatCap: 5 }, 1))?.kind).toBe('over-seats');
  });
  it('an unlimited plan is never over its seats', () => {
    expect(bannerFor(acct({ seatCount: 500, seatCap: null }))).toBeNull();
  });
  it('an open invoice on an active store is a reminder', () => {
    expect(bannerFor(acct({ daysRemaining: 6 }, 1))).toEqual(jasmine.objectContaining({ kind: 'invoice-ready', severity: 'info' }));
  });
});
