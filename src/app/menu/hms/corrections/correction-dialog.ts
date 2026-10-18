import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CorrectionStatus, HistoricalCorrection, HistoricalCorrectionService } from '../../../shared/services/historical-correction.service';
import { RolesService } from '../../../shared/services/roles.service';

export const statusLabel = (s: CorrectionStatus | string) =>
  ({
    PENDING_REVIEW: $localize`Pending review`,
    APPROVED: $localize`Approved`,
    REJECTED: $localize`Rejected`,
    PROCESSING: $localize`Processing`,
    COMPLETED: $localize`Completed`,
    FAILED: $localize`Failed`,
  })[s as CorrectionStatus] ?? String(s);

/** Chip colours, from the app's own palette so dark mode follows. */
export const correctionTone = (s: CorrectionStatus | string) =>
  ({
    PENDING_REVIEW: 'bg-amber-100 text-amber-900',
    APPROVED: 'bg-sky-100 text-sky-900',
    PROCESSING: 'bg-sky-100 text-sky-900',
    COMPLETED: 'bg-emerald-100 text-emerald-900',
    REJECTED: 'bg-slate-200 text-slate-800',
    FAILED: 'bg-red-100 text-red-900',
  })[s as CorrectionStatus] ?? 'bg-slate-200 text-slate-800';

export const personName = (p: any): string => (p && typeof p === 'object' ? p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || '' : '');

const EVENT_LABEL: Record<string, string> = {
  created: $localize`Raised`,
  approved: $localize`Approved`,
  rejected: $localize`Rejected`,
  processing: $localize`Posting started`,
  completed: $localize`Posted`,
  failed: $localize`Posting failed`,
};

/** One correction: why it was raised, what it would add, its whole history, and the decision (for those who may make it). */
@Component({
  selector: 'app-correction-dialog',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, MatDialogModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="flex flex-wrap items-center gap-2">
      <ng-container i18n>Correction for</ng-container> {{ c().confirmationNumber || '—' }}
      <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(c().status)">{{ text(c().status) }}</span>
    </h2>
    <mat-dialog-content class="!pt-2">
      <p class="m-0 text-sm text-on-surface-variant">{{ c().reason }}</p>

      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        @for (t of tiles(); track t.label) {
          <div class="rounded-xl border border-outline-variant p-3"><div class="text-xs text-on-surface-variant">{{ t.label }}</div><div class="text-lg font-bold tabular-nums">{{ t.value | currency: data.currency : 'symbol' : '1.2-2' }}</div></div>
        }
      </div>

      @if (c().financialImpact.byNight?.length) {
        <h3 class="m-0 mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Missing charges, by night</ng-container></h3>
        <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
          @for (n of c().financialImpact.byNight; track n.night) {
            <li class="rounded-full border border-outline-variant px-3 py-1 text-xs tabular-nums">{{ night(n.night) }} · <b>{{ n.total | currency: data.currency : 'symbol' : '1.2-2' }}</b></li>
          }
        </ul>
      }

      <p class="m-0 mt-4 flex items-start gap-2 rounded-xl bg-surface-container p-3 text-sm">
        <mat-icon class="shrink-0 !text-xl">info</mat-icon>
        <span><ng-container i18n>The days this covers were already audited and closed, and they stay exactly as audited. Approving adds the missing charges to today's open business day, each marked with the night it is for.</ng-container></span>
      </p>

      @if (c().status === 'FAILED' && c().failure) {
        <p class="m-0 mt-3 rounded-xl bg-red-100 p-3 text-sm text-red-900" role="alert"><b><ng-container i18n>It could not be posted:</ng-container></b> {{ c().failure }}. <ng-container i18n>Nothing was charged. You can retry safely.</ng-container></p>
      }
      @if (c().status === 'REJECTED' && c().rejectedReason) {
        <p class="m-0 mt-3 text-sm"><b><ng-container i18n>Rejected because:</ng-container></b> {{ c().rejectedReason }}</p>
      }

      <h3 class="m-0 mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>History</ng-container></h3>
      <ol class="m-0 list-none border-l border-outline-variant p-0">
        @for (e of events(); track $index) {
          <li class="relative pb-3 pl-5 last:pb-0">
            <span class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary"></span>
            <span class="text-sm font-medium">{{ eventLabel(e.type) }}</span>
            <span class="text-xs text-on-surface-variant"> · {{ person(e.by) || '—' }} · {{ e.at | date: 'd MMM y, HH:mm' }}</span>
            @if (e.note) { <div class="text-xs text-on-surface-variant">{{ e.note }}</div> }
          </li>
        }
      </ol>

      @if (rejecting()) {
        <mat-form-field appearance="outline" class="mt-4 w-full" subscriptSizing="dynamic">
          <mat-label><ng-container i18n>Why is this being rejected?</ng-container></mat-label>
          <textarea matInput rows="2" [(ngModel)]="rejectReason"></textarea>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions class="!flex-wrap !gap-2">
      <a matButton [routerLink]="['/menu/hms/front-desk/reservations/edit', c().reservation]" mat-dialog-close><mat-icon>open_in_new</mat-icon><ng-container i18n>Open reservation</ng-container></a>
      <span class="flex-1"></span>
      <button matButton type="button" [mat-dialog-close]="changed()"><ng-container i18n>Close</ng-container></button>
      @if (canDecide()) {
        @if (rejecting()) {
          <button matButton type="button" (click)="rejecting.set(false)"><ng-container i18n>Back</ng-container></button>
          <button matButton="filled" type="button" [disabled]="busy() || rejectReason.trim().length < 5" (click)="reject()"><ng-container i18n>Reject</ng-container></button>
        } @else {
          <button matButton="outlined" type="button" [disabled]="busy()" (click)="rejecting.set(true)"><mat-icon>close</mat-icon><ng-container i18n>Reject</ng-container></button>
          <button matButton="filled" type="button" [disabled]="busy()" (click)="approve()"><mat-icon>check</mat-icon><ng-container i18n>Approve and post</ng-container></button>
        }
      }
      @if (canRetry()) {
        <button matButton="filled" type="button" [disabled]="busy()" (click)="retry()"><mat-icon>refresh</mat-icon><ng-container i18n>Retry</ng-container></button>
      }
    </mat-dialog-actions>
  `,
})
export class CorrectionDialogComponent {
  private readonly api = inject(HistoricalCorrectionService);
  private readonly roles = inject(RolesService);
  private readonly snack = inject(MatSnackBar);
  private readonly ref = inject(MatDialogRef<CorrectionDialogComponent>);
  readonly data = inject<{ correction: HistoricalCorrection; storeId: string; currency: string }>(MAT_DIALOG_DATA);

  /** Opens at once with the list row, then fills in the full history. */
  readonly c = signal<HistoricalCorrection>(this.data.correction);
  readonly busy = signal(false);
  readonly changed = signal(false);
  readonly rejecting = signal(false);
  rejectReason = '';

  readonly tone = correctionTone;
  readonly text = statusLabel;
  readonly person = personName;
  readonly eventLabel = (t: string) => EVENT_LABEL[t] ?? t;
  readonly events = computed(() => this.c().events ?? []);
  readonly canApprove = computed(() => this.roles.hasAny(['hotel.corrections.approve']));
  readonly canDecide = computed(() => this.canApprove() && this.c().status === 'PENDING_REVIEW');
  readonly canRetry = computed(() => this.canApprove() && (this.c().status === 'FAILED' || this.c().status === 'APPROVED'));
  readonly tiles = computed(() => [
    { label: $localize`Room`, value: this.c().financialImpact.room },
    { label: $localize`Taxes`, value: this.c().financialImpact.tax },
    { label: $localize`Fees`, value: this.c().financialImpact.fee },
    { label: $localize`Total`, value: this.c().financialImpact.total },
  ]);

  constructor() {
    this.api.get(this.data.storeId, this.data.correction._id).subscribe({ next: (full) => this.c.set(full), error: () => undefined });
  }

  night(day: string) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(day + 'T12:00:00'));
  }

  private run(call: () => ReturnType<HistoricalCorrectionService['approve']>, done: string) {
    this.busy.set(true);
    call().subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.changed.set(true);
        this.rejecting.set(false);
        this.snack.open(updated.status === 'FAILED' ? $localize`It could not be posted. Nothing was charged; you can retry.` : done, $localize`Close`, { duration: 5000 });
        this.api.get(this.data.storeId, updated._id).subscribe({ next: (full) => this.c.set(full), error: () => this.c.set(updated) });
      },
      error: (error) => {
        this.busy.set(false);
        this.snack.open(error?.error?.message || $localize`That did not work. Try again.`, $localize`Close`, { duration: 6000, panelClass: ['error-snackbar'] });
      },
    });
  }

  approve() { this.run(() => this.api.approve(this.data.storeId, this.c()._id), $localize`Approved and posted onto today's business day.`); }
  reject() { this.run(() => this.api.reject(this.data.storeId, this.c()._id, this.rejectReason.trim()), $localize`Correction rejected. Nothing was charged.`); }
  retry() { this.run(() => this.api.retry(this.data.storeId, this.c()._id), $localize`Posted.`); }
}
