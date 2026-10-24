import { AccountContext } from '../models/platform-billing.model';

export type BannerKind = 'past-due' | 'cancelling' | 'trial-ending' | 'over-seats' | 'invoice-ready' | 'trial';
export type BannerSeverity = 'info' | 'warn' | 'critical';

export interface Banner {
  kind: BannerKind;
  severity: BannerSeverity;
  /** Days left of whatever the banner is about (trial, grace, period). */
  days: number | null;
  /** The date the banner is about (when the account locks or the plan ends). */
  date: string | null;
}

/**
 * The one notice shown above the app, or none. Several things can be true at once (a trial ending AND a team that is too big), so they
 * are ranked: money that is late comes first, then a pending cancellation, then the trial running out, then seats, then a routine reminder.
 * A locked account shows no banner: the paywall takes over there.
 */
export function bannerFor(account: AccountContext | null): Banner | null {
  const s = account?.subscription;
  if (!s || s.billingVersion !== 2 || s.blocked || !s.status) return null;
  const days = s.daysRemaining;

  if (s.status === 'PAST_DUE') return { kind: 'past-due', severity: 'critical', days, date: s.graceEndsAt };
  if (s.cancelAtPeriodEnd) return { kind: 'cancelling', severity: 'warn', days, date: s.currentPeriodEnd };
  if (s.status === 'TRIAL' && days !== null && days <= 7) return { kind: 'trial-ending', severity: days <= 3 ? 'critical' : 'warn', days, date: s.trialEndsAt };
  if (s.seatCap !== null && s.seatCount > s.seatCap) return { kind: 'over-seats', severity: 'warn', days: null, date: null };
  if (s.status === 'ACTIVE' && (account?.openInvoices ?? 0) > 0) return { kind: 'invoice-ready', severity: days !== null && days <= 3 ? 'warn' : 'info', days, date: s.currentPeriodEnd };
  if (s.status === 'TRIAL') return { kind: 'trial', severity: 'info', days, date: s.trialEndsAt };
  return null;
}
