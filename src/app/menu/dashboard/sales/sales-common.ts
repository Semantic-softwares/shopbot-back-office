import { ReconciliationStatus, SessionStatus } from '../../../shared/register/register.models';

/** Words and colours the Sales pages share, so a status reads the same wherever it appears. */
export const sessionStatusLabel = (s: SessionStatus): string => (s === 'open' ? $localize`Open` : s === 'closing' ? $localize`Closing` : $localize`Closed`);

export const reconciliationLabel = (r: ReconciliationStatus | undefined): string =>
  r === 'reconciled' ? $localize`Reconciled` : r === 'provisional' ? $localize`Provisional` : r === 'late_entries' ? $localize`Late entries` : $localize`Not reconciled`;

/** A chip's colours from the Material tokens (they flip in dark mode). */
export const chipTone = (kind: 'good' | 'warn' | 'bad' | 'neutral'): string =>
  kind === 'good' ? 'bg-primary-container text-on-primary-container' : kind === 'warn' ? 'bg-amber-100 text-amber-900' : kind === 'bad' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface-variant';

export const sessionTone = (s: SessionStatus): 'good' | 'warn' | 'neutral' => (s === 'open' ? 'good' : s === 'closing' ? 'warn' : 'neutral');
export const reconciliationTone = (r: ReconciliationStatus | undefined): 'good' | 'warn' | 'neutral' => (r === 'reconciled' ? 'good' : r === 'provisional' || r === 'late_entries' ? 'warn' : 'neutral');

/** A difference in the drawer: nothing is neutral, a shortage is bad, a surplus is a warning (it is still money that should be explained). */
export const varianceTone = (minor: number | null | undefined): 'good' | 'warn' | 'bad' | 'neutral' => (minor === null || minor === undefined ? 'neutral' : minor === 0 ? 'good' : minor < 0 ? 'bad' : 'warn');
