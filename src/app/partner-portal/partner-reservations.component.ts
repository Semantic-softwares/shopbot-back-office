import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PartnerPortalApiService, PortalReservation } from './partner-portal-api.service';
import { PartnerPortalContext } from './partner-portal-context.service';
import { PartnerAmendDialogComponent } from './partner-amend-dialog';

const TONE: Record<string, string> = { confirmed: 'bg-green-100 text-green-900', pending: 'bg-amber-100 text-amber-900', checked_in: 'bg-blue-100 text-blue-900', checked_out: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-900', no_show: 'bg-red-100 text-red-900' };
const TEXT: Record<string, () => string> = {
  confirmed: () => $localize`Confirmed`, pending: () => $localize`Pending`, checked_in: () => $localize`In house`, checked_out: () => $localize`Departed`, cancelled: () => $localize`Cancelled`, no_show: () => $localize`No-show`,
};

/** The reservations this partner brought, with just what a partner needs. Changes and cancellations are asked for, not made. */
@Component({
  selector: 'app-partner-reservations',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatChipsModule, MatDialogModule, MatIconModule, MatPaginatorModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-2xl font-semibold" i18n>My reservations</h1>
      <mat-chip-listbox [value]="status()" (change)="setStatus($event.value)" aria-label="Filter by status" i18n-aria-label>
        @for (s of statuses; track s.value) { <mat-chip-option [value]="s.value">{{ s.label }}</mat-chip-option> }
      </mat-chip-listbox>
    </div>
    @if (loading() && !data()) { <mat-progress-bar mode="indeterminate" /> }
    @if (failed()) {
      <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert"><p class="m-0 font-semibold" i18n>Could not load your reservations.</p><button matButton="filled" (click)="reload()" i18n>Try again</button></div>
    } @else if (data()) {
      @if (rows().length === 0) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">event_available</mat-icon>
          <p class="m-0 font-medium" i18n>No reservations here yet.</p>
          <p class="m-0 max-w-md text-sm text-on-surface-variant" i18n>When the hotel confirms a request, the booking appears here.</p>
        </div>
      }
      <ul class="m-0 flex list-none flex-col gap-3 p-0">
        @for (r of rows(); track r._id) {
          <li class="flex flex-col gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ r.confirmationNumber }}</span>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(r.status)">{{ statusText(r.status) }}</span>
              @if (r.openRequest) { <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">@if (r.openRequest === 'cancel') { <ng-container i18n>Cancellation requested</ng-container> } @else { <ng-container i18n>Change requested</ng-container> }</span> }
              <span class="ml-auto text-xs text-on-surface-variant">{{ r.hotel }}</span>
            </div>
            <div class="text-sm"><strong>{{ r.leadGuest || '—' }}</strong> · {{ r.checkIn | date: 'EEE d MMM' }} – {{ r.checkOut | date: 'EEE d MMM y' }} · {{ r.nights }} <ng-container i18n>nights</ng-container> · {{ r.rooms.join(', ') }} · {{ r.adults }} <ng-container i18n>adult(s)</ng-container>@if (r.children) { , {{ r.children }} <ng-container i18n>child(ren)</ng-container> }</div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-on-surface-variant">@if (r.partnerReference) { <ng-container i18n>Your reference</ng-container> {{ r.partnerReference }} · } @if (r.total !== undefined) { <span class="tabular-nums">{{ r.total | currency: r.currency : 'symbol' : '1.0-2' }}</span> }</span>
              <span class="flex flex-wrap gap-1">
                <button matButton type="button" [disabled]="downloading() === r._id" (click)="download(r, false)"><mat-icon>receipt_long</mat-icon><ng-container i18n>Folio with rates</ng-container></button>
                <button matButton type="button" [disabled]="downloading() === r._id" (click)="download(r, true)"><mat-icon>visibility_off</mat-icon><ng-container i18n>Folio for the guest</ng-container></button>
              </span>
              @if ((r.status === 'confirmed' || r.status === 'pending') && !r.openRequest) {
                <span class="flex gap-1">
                  <button matButton type="button" (click)="amend(r, 'change')" i18n>Ask for a change</button>
                  <button matButton type="button" (click)="amend(r, 'cancel')" i18n>Ask to cancel</button>
                </span>
              }
            </div>
          </li>
        }
      </ul>
      <mat-paginator [length]="data()!.total" [pageSize]="pageSize" [pageIndex]="page() - 1" [hidePageSize]="true" (page)="onPage($event)" aria-label="Pages" i18n-aria-label />
    }
  `,
})
export class PartnerReservationsComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly ctx = inject(PartnerPortalContext);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly statuses = [
    { value: 'all', label: $localize`All` },
    { value: 'upcoming', label: $localize`Upcoming` },
    { value: 'checked_in', label: $localize`In house` },
    { value: 'checked_out', label: $localize`Departed` },
    { value: 'cancelled', label: $localize`Cancelled` },
  ];
  readonly status = signal('all');
  readonly downloading = signal('');
  readonly page = signal(1);
  readonly pageSize = 15;
  private readonly refresh = signal(0);

  private readonly res = rxResource({
    params: () => ({ store: this.ctx.current()?.storeId, status: this.status(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => this.api.reservations({ storeId: params.store, status: params.status, page: params.page, limit: this.pageSize }),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed<PortalReservation[]>(() => this.data()?.reservations ?? []);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  tone = (s: string) => TONE[s] ?? 'bg-gray-100 text-gray-700';
  statusText = (s: string) => TEXT[s]?.() ?? s;
  setStatus(v: string | null) { this.status.set(v ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }

  /** With rates is the agent's own copy. The guest copy has no money on it, to hand to their customer. */
  download(r: PortalReservation, hidePrices: boolean) {
    const hotel = this.ctx.hotels().find((h) => h.hotel.name === r.hotel) ?? this.ctx.current();
    if (!hotel) return;
    this.downloading.set(r._id);
    this.api.document(hotel.storeId, r._id, 'folio', hidePrices).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `folio-${r.confirmationNumber}${hidePrices ? '-guest' : ''}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.downloading.set('');
      },
      error: () => { this.downloading.set(''); this.snack.open($localize`The document could not be created. Try again.`, undefined, { duration: 5000 }); },
    });
  }

  amend(r: PortalReservation, kind: 'change' | 'cancel') {
    const hotel = this.ctx.hotels().find((h) => h.hotel.name === r.hotel) ?? this.ctx.current();
    if (!hotel || this.dialog.getDialogById('amend')) return;
    this.dialog.open(PartnerAmendDialogComponent, { id: 'amend', width: '520px', maxWidth: '96vw', data: { storeId: hotel.storeId, reservation: r, kind } })
      .afterClosed().subscribe((sent: boolean | undefined) => { if (sent) { this.snack.open($localize`Sent to the hotel.`, undefined, { duration: 3000 }); this.reload(); } });
  }
}
