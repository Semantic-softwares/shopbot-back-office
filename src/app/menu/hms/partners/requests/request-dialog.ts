import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PartnerRequestRow, PartnerRequestService } from '../../../../shared/services/partner-request.service';

export interface RequestDialogData {
  storeId: string;
  id: string;
  currency: string;
  canProcess: boolean;
}

const EVENT_TEXT: Record<string, () => string> = {
  submitted: () => $localize`Sent by the partner`,
  accepted: () => $localize`Accepted`,
  rejected: () => $localize`Declined`,
  cancelled: () => $localize`Withdrawn by the partner`,
  accept_failed: () => $localize`Could not be accepted`,
};

/**
 * One partner request. Accepting books the stay through the normal reservation service, at the price the partner was quoted; if
 * anything has changed since (the price, the room, the partner's status, the date) it says what, and the request stays waiting.
 */
@Component({
  selector: 'app-request-dialog',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!flex !items-center !gap-2">
      @if (r(); as r) { {{ r.code }} <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(r.status)">{{ statusText(r.status) }}</span> } @else { <ng-container i18n>Request</ng-container> }
    </h2>
    <mat-dialog-content class="!pt-1">
      @if (!r()) { <mat-progress-bar mode="indeterminate" /> }
      @if (r(); as r) {
        <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Partner</div><div class="font-medium">{{ r.partner.name }}</div><div class="text-xs text-on-surface-variant">{{ r.requestedBy?.name || r.requestedBy?.email }}</div></div>
          @if (r.kind === 'new') {
            <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Rooms</div><div class="font-medium">{{ r.roomTypeName }}</div></div>
            <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Stay</div><div class="font-medium">{{ r.checkIn | date: 'd MMM' }} – {{ r.checkOut | date: 'd MMM y' }}</div></div>
            <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Guests</div><div class="font-medium">{{ r.adults }} <ng-container i18n>adult(s)</ng-container>@if (r.children) { , {{ r.children }} <ng-container i18n>child(ren)</ng-container> }</div></div>
          } @else {
            <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Reservation</div><div class="font-medium">{{ r.reservation?.confirmationNumber || '—' }}</div></div>
            <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Now</div><div class="font-medium">{{ r.checkIn | date: 'd MMM' }} – {{ r.checkOut | date: 'd MMM y' }}</div></div>
            @if (r.proposedCheckIn) { <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Asked for</div><div class="font-medium">{{ r.proposedCheckIn | date: 'd MMM' }} – {{ r.proposedCheckOut | date: 'd MMM y' }}</div></div> }
          }
        </div>
        @if (r.kind === 'new') {
          <div class="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Lead guest</div><div class="font-medium">{{ r.guest?.firstName }} {{ r.guest?.lastName }}</div><div class="text-xs text-on-surface-variant">{{ r.guest?.email }} {{ r.guest?.phone }} {{ r.guest?.nationality }}</div></div>
            @if (r.partnerReference) { <div><div class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Partner’s reference</div><div class="font-medium">{{ r.partnerReference }}</div></div> }
          </div>
          @if (r.quote; as q) {
            <div class="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-surface-container p-4 sm:grid-cols-4">
              <div><div class="text-xs text-on-surface-variant" i18n>Quoted to the partner</div><div class="text-lg font-semibold tabular-nums">{{ q.total ?? 0 | currency: q.currency || data.currency : 'symbol' : '1.0-2' }}</div></div>
              <div><div class="text-xs text-on-surface-variant" i18n>Public rate</div><div class="text-sm tabular-nums">{{ q.publicTotal ?? 0 | currency: q.currency || data.currency : 'symbol' : '1.0-2' }}</div></div>
              <div><div class="text-xs text-on-surface-variant" i18n>Agreement</div><div class="text-sm">{{ q.agreement?.code }}</div></div>
              @if (q.estimatedCommission) { <div><div class="text-xs text-on-surface-variant" i18n>Estimated commission</div><div class="text-sm tabular-nums">{{ q.estimatedCommission | currency: q.currency || data.currency : 'symbol' : '1.0-2' }}</div></div> }
            </div>
          }
        }
        @if (r.notes) { <p class="m-0 mt-3 rounded-xl bg-surface-container p-3 text-sm">“{{ r.notes }}”</p> }

        @if (r.lastCheckFailure; as f) {
          <p class="m-0 mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert"><mat-icon class="!h-5 !w-5 !text-xl !leading-none">warning</mat-icon><span><strong i18n>The last attempt to accept this did not go through:</strong> {{ f.message }}</span></p>
        }

        @if (open() && data.canProcess && r.kind === 'new' && !declining()) {
          <h3 class="m-0 mb-1 mt-4 text-sm font-semibold"><ng-container i18n>Rooms to give them</ng-container>&nbsp;<span class="font-normal text-on-surface-variant">({{ picked().length }} / {{ needed() }})</span></h3>
          @if (rooms.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
          @for (line of roomLines(); track line.index) {
            <div class="mb-2">
              <div class="text-sm font-medium">{{ line.needed }} × {{ line.roomTypeName }}</div>
              @if (line.rooms.length === 0 && !rooms.isLoading()) { <p class="m-0 text-sm text-red-800" i18n>No room of this type is free for these dates any more.</p> }
              <div class="flex flex-wrap gap-x-4">
                @for (room of line.rooms; track room._id) { <mat-checkbox [checked]="picked().includes(room._id)" (change)="toggle(room._id)">{{ room.roomNumber }}</mat-checkbox> }
              </div>
            </div>
          }
          <p class="m-0 mt-1 text-xs text-on-surface-variant" i18n>Accepting books these rooms for the partner at the quoted price. The price and the rooms are checked again as you accept.</p>
        }
        @if (declining()) {
          <mat-form-field appearance="outline" class="mt-4 w-full">
            <mat-label>@if (r.kind === 'new') { <ng-container i18n>Why are you declining? The partner will see this.</ng-container> } @else { <ng-container i18n>Note for the partner</ng-container> }</mat-label>
            <input matInput [value]="reason()" (input)="reason.set($any($event.target).value)" autocomplete="off" />
          </mat-form-field>
        }
        @if (open() && data.canProcess && r.kind !== 'new' && !declining()) {
          <p class="m-0 mt-4 text-sm text-on-surface-variant" i18n>Make the change on the reservation yourself, then mark this as done. Nothing is changed automatically.</p>
        }
        @if (r.decision?.note && !open()) { <p class="m-0 mt-3 text-sm"><span class="text-on-surface-variant" i18n>Note:</span> {{ r.decision?.note }}</p> }
        @if (r.reservation?._id && r.kind === 'new') { <p class="m-0 mt-3 text-sm"><button matButton type="button" (click)="openReservation(r.reservation!._id)"><mat-icon>open_in_new</mat-icon>{{ r.reservation?.confirmationNumber }}</button></p> }

        <h3 class="m-0 mb-1 mt-4 text-sm font-semibold" i18n>History</h3>
        <ol class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
          @for (e of events(); track $index) { <li><span class="font-medium">{{ eventText(e.type) }}</span>&nbsp;<span class="text-xs text-on-surface-variant">{{ e.at | date: 'd MMM y, HH:mm' }}@if (e.note) { · {{ e.note }} }</span></li> }
        </ol>
        @if (error()) { <p class="m-0 mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 !text-xl !leading-none text-red-600">error</mat-icon>{{ error() }}</p> }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!flex-wrap !gap-1 !px-6 !pb-4">
      <button matButton mat-dialog-close>@if (changed()) { <ng-container i18n>Done</ng-container> } @else { <ng-container i18n>Close</ng-container> }</button>
      @if (r(); as r) {
        @if (open() && data.canProcess) {
          @if (declining()) {
            <button matButton type="button" [disabled]="busy()" (click)="declining.set(false)" i18n>Back</button>
            <button matButton="filled" type="button" [disabled]="busy()" (click)="confirmDecline(r)" i18n>Send answer</button>
          } @else {
            <button matButton type="button" [disabled]="busy()" (click)="declining.set(true)">@if (r.kind === 'new') { <ng-container i18n>Decline</ng-container> } @else { <ng-container i18n>Decline…</ng-container> }</button>
            @if (r.kind === 'new') { <button matButton="filled" type="button" [disabled]="busy() || picked().length !== needed()" (click)="accept(r)" i18n>Accept and book</button> }
            @else { <button matButton="filled" type="button" [disabled]="busy()" (click)="resolve(r, 'accepted')" i18n>Mark as done</button> }
          }
        }
      }
    </mat-dialog-actions>
  `,
})
export class RequestDialogComponent {
  private readonly api = inject(PartnerRequestService);
  private readonly router = inject(Router);
  private readonly ref = inject<MatDialogRef<RequestDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<RequestDialogData>(MAT_DIALOG_DATA);

  private readonly reload = signal(0);
  private readonly res = rxResource({ params: () => ({ n: this.reload() }), stream: () => this.api.get(this.data.storeId, this.data.id) });
  readonly r = computed<PartnerRequestRow | null>(() => (this.res.hasValue() ? this.res.value() : null));
  readonly open = computed(() => ['pending', 'processing'].includes(this.r()?.status ?? ''));
  readonly events = computed(() => [...(this.r()?.events ?? [])].reverse());
  readonly needed = computed(() => this.r()?.rooms ?? 1);
  readonly roomLines = computed(() => (this.rooms.hasValue() ? this.rooms.value()?.lines ?? [] : []));

  readonly rooms = rxResource({
    params: () => ({ ok: this.open() && this.r()?.kind === 'new' && this.data.canProcess, n: this.reload() }),
    stream: ({ params }) => (params.ok ? this.api.rooms(this.data.storeId, this.data.id) : of(null)),
  });
  readonly chosen = signal<string[] | null>(null);
  /** Until the person chooses, the first rooms that are free are ticked. */
  readonly picked = computed(() => this.chosen() ?? this.roomLines().flatMap((l) => l.rooms.slice(0, l.needed).map((x) => x._id)));

  readonly busy = signal(false);
  readonly error = signal('');
  readonly changed = signal(false);
  readonly declining = signal(false);
  readonly reason = signal('');

  tone = (s: string) => ({ pending: 'bg-amber-100 text-amber-900', processing: 'bg-amber-100 text-amber-900', accepted: 'bg-green-100 text-green-900', rejected: 'bg-red-100 text-red-900', cancelled: 'bg-gray-100 text-gray-700' }[s] ?? 'bg-gray-100 text-gray-700');
  statusText = (s: string) => ({ pending: $localize`Waiting`, processing: $localize`Being answered`, accepted: $localize`Accepted`, rejected: $localize`Declined`, cancelled: $localize`Withdrawn` }[s] ?? s);
  eventText = (t: string) => EVENT_TEXT[t]?.() ?? t;

  toggle(id: string) {
    const cur = this.picked();
    this.chosen.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }
  private run(call: ReturnType<typeof this.api.accept>) {
    this.busy.set(true);
    this.error.set('');
    call.subscribe({
      next: () => { this.busy.set(false); this.changed.set(true); this.declining.set(false); this.reload.update((n) => n + 1); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? $localize`That did not go through. Try again.`); this.reload.update((n) => n + 1); },
    });
  }
  accept(r: PartnerRequestRow) { this.run(this.api.accept(this.data.storeId, r._id, this.picked())); }
  resolve(r: PartnerRequestRow, outcome: 'accepted' | 'rejected', note?: string) { this.run(this.api.resolve(this.data.storeId, r._id, outcome, note)); }
  confirmDecline(r: PartnerRequestRow) {
    if (this.reason().trim().length < 3) { this.error.set($localize`Say why, in a few words.`); return; }
    this.run(r.kind === 'new' ? this.api.reject(this.data.storeId, r._id, this.reason().trim()) : this.api.resolve(this.data.storeId, r._id, 'rejected', this.reason().trim()));
  }
  openReservation(id: string) { this.ref.close(true); this.router.navigate(['/menu/hms/front-desk/reservations/edit', id]); }
}
