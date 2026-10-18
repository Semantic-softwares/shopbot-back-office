import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BackdatingPreview, HistoricalCorrectionService } from '../../../../../../../shared/services/historical-correction.service';

export interface HistoricalEntryState {
  /** The stay began before today. */
  isBackdated: boolean;
  /** The signed-in person may enter a past stay. */
  canBackdate: boolean;
  /** The server could not be asked, so nothing is claimed either way. */
  unknown: boolean;
  closedNights: string[];
}

const dayOf = (value: unknown): string => {
  const d = new Date(value as any);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Shown on a new reservation whose check-in is in the past. It asks the server what those dates mean (open or already
 * audited), says plainly what will and will not happen, and collects what a historical entry needs: what happened, and why.
 */
@Component({
  selector: 'app-historical-entry',
  imports: [ReactiveFormsModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (preview(); as p) {
      @if (p.isBackdated) {
        <section class="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 md:p-5" aria-labelledby="hist-title" [formGroup]="group()">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><mat-icon>history</mat-icon></span>
            <div class="min-w-0 flex-1">
              <h3 id="hist-title" class="m-0 text-base font-semibold"><ng-container i18n>You're creating a reservation for a past date</ng-container></h3>
              <p class="m-0 mt-1 text-sm">
                <ng-container i18n>The reservation will be recorded in the hotel's historical records. If the affected business dates have already been audited, any required financial corrections will follow the hotel's approval process. Completed night audits will not be rerun automatically.</ng-container>
              </p>

              @if (!p.canBackdate) {
                <p class="m-0 mt-3 flex items-start gap-2 rounded-xl bg-red-100 p-3 text-sm font-medium text-red-900" role="alert">
                  <mat-icon class="shrink-0">lock</mat-icon>
                  <span><ng-container i18n>You do not have permission to create backdated reservations. Ask a manager to enter it, or to give you that right.</ng-container></span>
                </p>
              } @else {
                <p class="m-0 mt-4 text-sm font-medium"><ng-container i18n>What happened?</ng-container></p>
                <mat-button-toggle-group class="mt-1 flex-wrap" formControlName="outcome" aria-label="What happened?" i18n-aria-label>
                  <mat-button-toggle value="checked_out"><mat-icon>logout</mat-icon><ng-container i18n>Guest already stayed</ng-container></mat-button-toggle>
                  <mat-button-toggle value="checked_in"><mat-icon>hotel</mat-icon><ng-container i18n>Still in the house</ng-container></mat-button-toggle>
                  <mat-button-toggle value="confirmed"><mat-icon>event</mat-icon><ng-container i18n>Just record the booking</ng-container></mat-button-toggle>
                </mat-button-toggle-group>

                <!-- What the dates mean -->
                @if (!p.auditEnabled) {
                  <p class="m-0 mt-3 text-sm"><ng-container i18n>Night audit is not switched on for this hotel, so no day is closed.</ng-container></p>
                } @else if (p.closedNights.length) {
                  <p class="m-0 mt-3 flex items-start gap-2 text-sm">
                    <mat-icon class="shrink-0 !text-xl">lock_clock</mat-icon>
                    <span>
                      {{ p.closedNights.length }} <ng-container i18n>night(s) fall on days that were already audited and closed</ng-container> ({{ nightsRange(p.closedNights) }}).
                      @if (p.approvalLikely) {<ng-container i18n>Their charges cannot be posted straight away: a manager will be asked to approve them, and the original audit stays exactly as it was.</ng-container>}
                      @else {<ng-container i18n>With this choice no charges are created, so nothing needs approval.</ng-container>}
                    </span>
                  </p>
                } @else {
                  <p class="m-0 mt-3 flex items-start gap-2 text-sm"><mat-icon class="shrink-0 !text-xl">check_circle</mat-icon><span><ng-container i18n>These days are still open, so the next night audit will post the charges as usual. No correction is needed.</ng-container></span></p>
                }

                <mat-form-field appearance="outline" class="mt-3 w-full" subscriptSizing="dynamic">
                  <mat-label><ng-container i18n>Why is this being entered now?</ng-container></mat-label>
                  <textarea matInput rows="2" formControlName="reason" required placeholder="e.g. Guest stayed on the 12th, not recorded at the time" i18n-placeholder></textarea>
                  @if (group().get('reason')?.touched && reasonTooShort()) {<mat-error><ng-container i18n>Say why in a few words.</ng-container></mat-error>}
                </mat-form-field>
              }
            </div>
          </div>
        </section>
      }
    }
  `,
})
export class HistoricalEntryComponent {
  private readonly api = inject(HistoricalCorrectionService);

  readonly form = input.required<FormGroup>();
  readonly storeId = input.required<string>();
  readonly isEditing = input(false);
  readonly stateChange = output<HistoricalEntryState>();

  readonly group = computed(() => this.form().get('historical') as FormGroup);
  // Plain strings, so a change elsewhere in the form never asks the server again: only these three matter.
  private readonly checkInDay = signal('');
  private readonly checkOutDay = signal('');
  private readonly outcome = signal('checked_out');

  private readonly resource = rxResource({
    params: () => {
      const checkIn = this.checkInDay(), checkOut = this.checkOutDay();
      if (this.isEditing() || !this.storeId() || !checkIn || !checkOut) return null;
      return { storeId: this.storeId(), checkIn, checkOut, status: this.outcome() };
    },
    stream: ({ params }) => (params ? this.api.preview(params.storeId, params).pipe(catchError(() => of(null))) : of(null)),
  });
  readonly preview = computed<BackdatingPreview | null>(() => (this.resource.hasValue() ? (this.resource.value() ?? null) : null));

  constructor() {
    // Follow the form's own controls (the input is only readable from here on).
    effect((onCleanup) => {
      const form = this.form();
      const read = () => {
        this.checkInDay.set(dayOf(form.get('checkInDate')?.value));
        this.checkOutDay.set(dayOf(form.get('checkOutDate')?.value));
        this.outcome.set(String(form.get('historical.outcome')?.value ?? 'checked_out'));
      };
      read();
      const sub = form.valueChanges.subscribe(read);
      onCleanup(() => sub.unsubscribe());
    });
    effect(() => {
      const p = this.preview();
      this.stateChange.emit({ isBackdated: !!p?.isBackdated, canBackdate: !!p?.canBackdate, unknown: !p && !this.isEditing(), closedNights: p?.closedNights ?? [] });
    });
  }

  reasonTooShort(): boolean {
    return String(this.group().get('reason')?.value ?? '').trim().length < 5;
  }

  nightsRange(nights: string[]): string {
    const fmt = (n: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(n + 'T12:00:00'));
    return nights.length === 1 ? fmt(nights[0]) : `${fmt(nights[0])} – ${fmt(nights[nights.length - 1])}`;
  }
}
