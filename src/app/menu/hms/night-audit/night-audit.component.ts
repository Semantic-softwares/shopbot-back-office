import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
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
  imports: [TrPipe, DatePipe, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressBarModule, MatSnackBarModule, MatTabsModule, MatTooltipModule, AuditSnapshotComponent],
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
    ORDER.map((key) => ({ key, ...STEP_META[key], step: this.run()?.steps?.find((s) => s.key === key) ?? null })),
  );
  signedOff = computed(() => new Set((this.run()?.overrides ?? []).map((o) => o.code)));
  blockers = computed(() => (this.run()?.steps ?? []).flatMap((s) => s.issues).filter((i) => i.severity === 'blocker' && !this.signedOff().has(i.code)));
  hasRun = computed(() => (this.run()?.steps?.length ?? 0) > 0);

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
  statusColour(status: string | undefined) {
    return status === 'ok' ? 'text-green-600' : status === 'warning' ? 'text-amber-500' : status === 'blocked' || status === 'failed' ? 'text-red-600' : 'text-gray-400';
  }

  /** Where to go to fix something an issue points at. */
  refLink(issue: AuditIssue, id: string): string[] {
    if (RESERVATION_CODES.has(issue.code)) return ['/menu/hms/front-desk/reservations/edit', id];
    return ['/menu/hms/cashier'];
  }
  issueLink(issue: AuditIssue): string[] | null {
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

  async openRun(run: AuditRun) {
    const full = await firstValueFrom(this.api.getRun(this.storeId(), run._id));
    this.dialog.open(AuditRunDialogComponent, { width: '860px', maxWidth: '96vw', data: { run: full, currency: this.currency() } });
  }
}
