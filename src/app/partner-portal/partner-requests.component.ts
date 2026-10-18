import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PartnerPortalApiService, PortalRequest, messageOf } from './partner-portal-api.service';
import { PartnerPortalContext } from './partner-portal-context.service';

const STATUS_TONE: Record<string, string> = { pending: 'bg-amber-100 text-amber-900', accepted: 'bg-green-100 text-green-900', rejected: 'bg-red-100 text-red-900', cancelled: 'bg-gray-100 text-gray-700' };
const STATUS_TEXT: Record<string, () => string> = {
  pending: () => $localize`Waiting for the hotel`,
  accepted: () => $localize`Confirmed`,
  rejected: () => $localize`Declined`,
  cancelled: () => $localize`Withdrawn`,
};
const KIND_TEXT: Record<string, () => string> = { new: () => $localize`Booking request`, change: () => $localize`Change request`, cancel: () => $localize`Cancellation request` };

/** Everything the partner has asked the hotel for, and the hotel's answer. A request still waiting can be withdrawn. */
@Component({
  selector: 'app-partner-requests',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatChipsModule, MatIconModule, MatPaginatorModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-2xl font-semibold" i18n>My requests</h1>
      <mat-chip-listbox [value]="status()" (change)="setStatus($event.value)" aria-label="Filter by status" i18n-aria-label>
        @for (s of statuses; track s.value) { <mat-chip-option [value]="s.value">{{ s.label }}</mat-chip-option> }
      </mat-chip-listbox>
    </div>
    @if (loading() && !data()) { <mat-progress-bar mode="indeterminate" /> }
    @if (failed()) {
      <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert"><p class="m-0 font-semibold" i18n>Could not load your requests.</p><button matButton="filled" (click)="reload()" i18n>Try again</button></div>
    } @else if (data()) {
      @if (rows().length === 0) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">outgoing_mail</mat-icon>
          <p class="m-0 font-medium" i18n>No requests here yet.</p>
        </div>
      }
      <ul class="m-0 flex list-none flex-col gap-3 p-0">
        @for (r of rows(); track r._id) {
          <li class="flex flex-col gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ r.code }}</span>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(r.status)">{{ statusText(r.status) }}</span>
              <span class="text-xs text-on-surface-variant">{{ kindText(r.kind) }}@if (r.hotel) { · {{ r.hotel }} }</span>
              <span class="ml-auto text-xs text-on-surface-variant">{{ r.createdAt | date: 'd MMM y, HH:mm' }}</span>
            </div>
            @if (r.kind === 'new') {
              <div class="text-sm"><strong>{{ r.rooms }} × {{ r.roomTypeName }}</strong> · {{ r.checkIn | date: 'EEE d MMM' }} – {{ r.checkOut | date: 'EEE d MMM y' }} · {{ r.guest?.firstName }} {{ r.guest?.lastName }}@if (r.quote) { · <span class="tabular-nums">{{ r.quote.total | currency: r.quote.currency : 'symbol' : '1.0-2' }}</span> }</div>
            } @else {
              <div class="text-sm">@if (r.reservation) { <strong>{{ r.reservation.confirmationNumber }}</strong> · } {{ r.checkIn | date: 'd MMM' }} – {{ r.checkOut | date: 'd MMM y' }}@if (r.proposedCheckIn) { → <strong>{{ r.proposedCheckIn | date: 'd MMM' }} – {{ r.proposedCheckOut | date: 'd MMM y' }}</strong> }</div>
            }
            @if (r.notes) { <p class="m-0 text-sm text-on-surface-variant">“{{ r.notes }}”</p> }
            @if (r.status === 'accepted' && r.reservation) { <p class="m-0 flex items-center gap-1 text-sm text-green-800"><mat-icon class="!h-5 !w-5 !text-xl !leading-none">check_circle</mat-icon><ng-container i18n>Booking reference</ng-container> <strong>{{ r.reservation.confirmationNumber }}</strong></p> }
            @if (r.decisionNote) { <p class="m-0 text-sm"><span class="text-on-surface-variant" i18n>Note from the hotel:</span> {{ r.decisionNote }}</p> }
            @if (r.status === 'pending') {
              <div><button matButton type="button" [disabled]="busyId() === r._id" (click)="withdraw(r)"><mat-icon>undo</mat-icon><ng-container i18n>Withdraw request</ng-container></button></div>
            }
          </li>
        }
      </ul>
      <mat-paginator [length]="data()!.total" [pageSize]="pageSize" [pageIndex]="page() - 1" [hidePageSize]="true" (page)="onPage($event)" aria-label="Pages" i18n-aria-label />
    }
  `,
})
export class PartnerRequestsComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly ctx = inject(PartnerPortalContext);
  private readonly snack = inject(MatSnackBar);

  readonly statuses = [
    { value: 'all', label: $localize`All` },
    { value: 'pending', label: $localize`Waiting` },
    { value: 'accepted', label: $localize`Confirmed` },
    { value: 'rejected', label: $localize`Declined` },
  ];
  readonly status = signal('all');
  readonly page = signal(1);
  readonly pageSize = 15;
  readonly busyId = signal('');
  private readonly refresh = signal(0);

  private readonly res = rxResource({
    params: () => ({ store: this.ctx.current()?.storeId, status: this.status(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => this.api.requests({ storeId: params.store, status: params.status, page: params.page, limit: this.pageSize }),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed<PortalRequest[]>(() => this.data()?.requests ?? []);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  tone = (s: string) => STATUS_TONE[s] ?? STATUS_TONE['cancelled'];
  statusText = (s: string) => STATUS_TEXT[s]?.() ?? s;
  kindText = (k: string) => KIND_TEXT[k]?.() ?? k;
  setStatus(v: string | null) { this.status.set(v ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }

  withdraw(r: PortalRequest) {
    this.busyId.set(r._id);
    this.api.cancelRequest(r._id).subscribe({
      next: () => { this.busyId.set(''); this.snack.open($localize`Request withdrawn.`, undefined, { duration: 3000 }); this.reload(); },
      error: (e) => { this.busyId.set(''); this.snack.open(messageOf(e, $localize`The request could not be withdrawn.`), undefined, { duration: 5000 }); this.reload(); },
    });
  }
}
