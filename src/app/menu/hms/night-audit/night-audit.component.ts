import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatTooltipModule } from '@angular/material/tooltip';
import { TrPipe } from '../../../shared/i18n/tr.pipe';
import { AuditIssue, AuditRun, AuditStep, NightAuditService } from '../../../shared/services/night-audit.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { RolesService } from '../../../shared/services/roles.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuditRunDialogComponent, AuditSettingsDialogComponent, AuditSignOffDialogComponent } from './audit-dialogs';
import { AuditSnapshotComponent } from './audit-snapshot.component';

const STEP_META: Record<AuditStep['key'], { icon: string; title: string; hint: string }> = {
  pre_checks: { icon: 'fact_check', title: $localize`Checks before closing`, hint: $localize`Open tills, guests who should have left, arrivals who never came` },
  no_shows: { icon: 'person_off', title: $localize`No-shows`, hint: $localize`Today's arrivals who did not check in are marked as no-shows` },
  post_room_tax: { icon: 'bed', title: $localize`Room charges and taxes`, hint: $localize`Tonight's room, tax and fee lines go onto every guest's folio` },
  sync_orders: { icon: 'receipt_long', title: $localize`Room orders`, hint: $localize`Restaurant and bar orders charged to a room are brought onto the folio` },
  reconcile_payments: { icon: 'payments', title: $localize`Payments and cash`, hint: $localize`Money taken is matched to the ledger; closed tills are reviewed` },
  trial_balance: { icon: 'balance', title: $localize`Trial balance`, hint: $localize`The ledger and every guest's folio must add up to the same figure` },
  report_pack: { icon: 'summarize', title: $localize`Report pack`, hint: $localize`The day's figures are saved for the morning` },
};
const ORDER: AuditStep['key'][] = ['pre_checks', 'no_shows', 'post_room_tax', 'sync_orders', 'reconcile_payments', 'trial_balance', 'report_pack'];
const RESERVATION_CODES = new Set(['OVERDUE_DEPARTURES', 'ARRIVALS_NOT_CHECKED_IN', 'STALE_ARRIVALS', 'ZERO_RATE_ROOMS', 'NOSHOW_FAILED', 'DEPARTED_WITH_BALANCE']);

@Component({
  selector: 'app-night-audit',
  imports: [TrPipe, CurrencyPipe, DatePipe, DecimalPipe, RouterLink, PageHeaderComponent, MatButtonModule, MatCardModule, MatChipsModule, MatDividerModule, MatExpansionModule, MatListModule, MatDialogModule, MatIconModule, MatProgressBarModule, MatSnackBarModule, MatTableModule, MatTooltipModule, AuditSnapshotComponent],
  templateUrl: './night-audit.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NightAuditComponent {
  private api = inject(NightAuditService);
  private storeStore = inject(StoreStore);
  private roles = inject(RolesService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  private refresh = signal(0);
  storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  busy = signal<'run' | 'close' | null>(null);
  /** What the server said the last time a close was refused. */
  refused = signal<AuditIssue[]>([]);

  private statusRes = rxResource({
    params: () => ({ id: this.storeId(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.status(params.id) : of(null)),
  });
  private historyRes = rxResource({
    params: () => ({ id: this.storeId(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.history(params.id) : of([] as AuditRun[])),
  });

  status = computed(() => (this.statusRes.hasValue() ? this.statusRes.value() : null));
  history = computed(() => (this.historyRes.hasValue() ? (this.historyRes.value() ?? []) : []));
  loading = computed(() => this.statusRes.isLoading() && !this.status());
  failed = computed(() => !!this.statusRes.error());
  run = computed(() => this.status()?.run ?? null);

  canRun = computed(() => this.roles.hasAny(['hotel.nightaudit.run']));
  canOverride = computed(() => this.roles.hasAny(['hotel.nightaudit.override']));

  steps = computed(() =>
    ORDER.map((key) => {
      const step = this.run()?.steps?.find((s) => s.key === key) ?? null;
      return { key, ...STEP_META[key], step, shown: this.shownStatus(step) };
    }),
  );
  signedOff = computed(() => new Set((this.run()?.overrides ?? []).map((o) => o.code)));
  blockers = computed(() => (this.run()?.steps ?? []).flatMap((s) => s.issues).filter((i) => i.severity === 'blocker' && !this.signedOff().has(i.code)));
  hasRun = computed(() => (this.run()?.steps?.length ?? 0) > 0);

  /** A step whose blockers have all been signed off reads as a warning, not as stuck. */
  private shownStatus(step: AuditStep | null): string | undefined {
    if (!step) return undefined;
    if (step.status === 'blocked') {
      const open = step.issues.some((i) => i.severity === 'blocker' && !this.signedOff().has(i.code));
      return open ? 'blocked' : 'warning';
    }
    return step.status;
  }

  /** Steps that have finished (clean or with warnings only). */
  recentRuns = computed(() => this.history().slice(0, 8));
  doneCount = computed(() => this.steps().filter((s) => s.shown === 'ok' || s.shown === 'warning').length);
  progress = computed(() => Math.round((this.doneCount() / ORDER.length) * 100));
  warningCount = computed(() => (this.run()?.steps ?? []).flatMap((s) => s.issues).filter((i) => i.severity === 'warning').length);

  /** What the big panel at the top says: one state, one colour, one next step. */
  hero = computed(() => {
    if (!this.hasRun()) {
      const n = this.status()?.preflight?.length ?? 0;
      return {
        state: 'idle', icon: 'play_circle', tone: 'bg-surface-container-low', iconTone: 'bg-primary-container text-on-primary-container',
        title: $localize`Ready to start`,
        text: n ? $localize`${n} thing(s) to look at before you start. Run the checks to see them in detail.` : $localize`Run the checks to see what needs attention before you close.`,
      };
    }
    const b = this.blockers().length;
    if (b > 0) {
      return { state: 'blocked', icon: 'error', tone: 'bg-error-container text-on-error-container', iconTone: 'bg-error text-on-error', title: $localize`${b} blocker(s) stop the day from closing`, text: $localize`Fix each one, or sign it off with a reason if a manager accepts it.` };
    }
    const w = this.warningCount();
    return { state: 'ready', icon: 'task_alt', tone: 'bg-secondary-container text-on-secondary-container', iconTone: 'bg-primary text-on-primary', title: $localize`Ready to close`, text: w ? $localize`Every check passed. ${w} warning(s) are worth a look but do not stop you.` : $localize`Every check passed. Close the day when the last till is counted.` };
  });

  stepCircle(status: string | undefined): string {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-amber-100 text-amber-700';
      case 'blocked': case 'failed': return 'bg-error-container text-on-error-container';
      default: return 'border border-outline-variant text-on-surface-variant';
    }
  }

  /** The business day is a calendar date: read it at noon so no timezone can move it. */
  asDate(day: string | undefined) {
    return day ? new Date(day + 'T12:00:00') : null;
  }

  reload() {
    this.refresh.update((n) => n + 1);
  }

  statusIcon(status: string | undefined) {
    return status === 'ok' ? 'check_circle' : status === 'warning' ? 'warning' : status === 'blocked' || status === 'failed' ? 'error' : 'radio_button_unchecked';
  }
  /** Alert colours for an issue, from the Material theme so dark mode follows. */
  issueTone(issue: AuditIssue): string {
    if (issue.severity === 'blocker' && !this.signedOff().has(issue.code)) return 'bg-error-container text-on-error-container';
    if (issue.severity === 'warning') return 'bg-amber-100 text-amber-900';
    return 'bg-secondary-container text-on-secondary-container';
  }
  issueIcon(issue: AuditIssue): string {
    return issue.severity === 'blocker' ? 'block' : issue.severity === 'warning' ? 'warning' : 'info';
  }
  /** A step is worth opening when it has something to say. */
  stepHasIssues(step: AuditStep | null): boolean {
    return !!step && step.issues.length > 0;
  }

  statusColour(status: string | undefined) {
    return status === 'ok' ? 'text-green-600' : status === 'warning' ? 'text-amber-500' : status === 'blocked' || status === 'failed' ? 'text-red-600' : 'text-outline';
  }

  /** Where to go to fix something an issue points at. */
  refLink(issue: AuditIssue, id: string): string[] {
    if (RESERVATION_CODES.has(issue.code)) return ['/menu/hms/front-desk/reservations/edit', id];
    return ['/menu/hms/cashier'];
  }
  issueLink(issue: AuditIssue): string[] | null {
    if (issue.code === 'CORRECTIONS_PENDING') return ['/menu/hms/corrections'];
    return issue.code === 'OPEN_SHIFTS' || issue.code === 'CASH_VARIANCE' ? ['/menu/hms/cashier'] : null;
  }

  private fail(error: any, fallback: string) {
    this.snack.open(error?.error?.message || fallback, $localize`Close`, { duration: 6000, panelClass: ['error-snackbar'] });
  }

  async runChecks() {
    this.busy.set('run');
    this.refused.set([]);
    try {
      await firstValueFrom(this.api.run(this.storeId()));
    } catch (error) {
      this.fail(error, $localize`The checks could not run. Try again.`);
    } finally {
      this.busy.set(null);
      this.reload();
    }
  }

  async closeDay() {
    const date = this.status()?.businessDate;
    const ok = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '440px',
          maxWidth: '92vw',
          data: {
            title: $localize`Close this business day?`,
            message: $localize`All the checks run once more, the day's figures are saved, and the next business day opens. This cannot be undone.`,
            confirmText: $localize`Close the day`,
            cancelText: $localize`Not yet`,
          },
        })
        .afterClosed(),
    );
    if (!ok || !date) return;
    this.busy.set('close');
    this.refused.set([]);
    try {
      const closed = await firstValueFrom(this.api.close(this.storeId()));
      this.snack.open($localize`Business day closed. Now on ${closed.nextBusinessDate ?? ''}`, $localize`Close`, { duration: 6000 });
    } catch (error: any) {
      if (error?.error?.code === 'AUDIT_BLOCKED') {
        this.refused.set(error.error.blockers ?? []);
        this.snack.open($localize`The day cannot close yet. Resolve or sign off the blockers below.`, $localize`Close`, { duration: 6000, panelClass: ['error-snackbar'] });
      } else this.fail(error, $localize`The day could not be closed. Try again.`);
    } finally {
      this.busy.set(null);
      this.reload();
    }
  }

  async signOff(issue: AuditIssue) {
    const reason = await firstValueFrom(this.dialog.open(AuditSignOffDialogComponent, { width: '460px', maxWidth: '92vw', data: { message: issue.message } }).afterClosed());
    if (!reason) return;
    try {
      await firstValueFrom(this.api.override(this.storeId(), issue.code, reason));
      this.refused.set([]);
      this.reload();
    } catch (error) {
      this.fail(error, $localize`That could not be signed off.`);
    }
  }

  async openSettings() {
    const current = await firstValueFrom(this.api.settings(this.storeId()));
    const next = await firstValueFrom(this.dialog.open(AuditSettingsDialogComponent, { width: '480px', maxWidth: '94vw', data: current }).afterClosed());
    if (!next) return;
    try {
      await firstValueFrom(this.api.saveSettings(this.storeId(), next));
      this.snack.open($localize`Night audit settings saved`, $localize`Close`, { duration: 3000 });
      this.reload();
    } catch (error) {
      this.fail(error, $localize`The settings could not be saved.`);
    }
  }

  /** Opens at once with a skeleton (the dialog loads its own data) and never twice: one closing on screen at a time. */
  openRun(run: AuditRun) {
    if (this.dialog.getDialogById('audit-run')) return;
    this.dialog.open(AuditRunDialogComponent, { id: 'audit-run', width: '860px', maxWidth: '96vw', data: { run, currency: this.currency(), storeId: this.storeId() } });
  }

  /** Weekday and day number for the little calendar tile on each closing. */
  tileDay(day: string) {
    const d = this.asDate(day);
    return d ? { weekday: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d), day: d.getDate() } : { weekday: '', day: 0 };
  }
}
