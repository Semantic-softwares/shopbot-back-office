import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PartnerRequestRow, PartnerRequestService } from '../../../../shared/services/partner-request.service';
import { RolesService } from '../../../../shared/services/roles.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { RequestDialogComponent } from './request-dialog';

const TONE: Record<string, string> = { pending: 'bg-amber-100 text-amber-900', processing: 'bg-amber-100 text-amber-900', accepted: 'bg-green-100 text-green-900', rejected: 'bg-red-100 text-red-900', cancelled: 'bg-gray-100 text-gray-700' };

/** What travel partners have asked for through the portal. Open one to accept (it books the stay), decline, or mark a change done. */
@Component({
  selector: 'app-partner-requests-admin',
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, MatButtonModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatTableModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Partner requests" i18n-title subtitle="Booking, change and cancellation requests sent by your travel partners through the portal." i18n-subtitle>
      <ng-container actions>
        <button matIconButton (click)="reload()" [disabled]="loading()" aria-label="Refresh" i18n-aria-label matTooltip="Refresh" i18n-matTooltip><mat-icon [class.animate-spin]="loading()">refresh</mat-icon></button>
      </ng-container>
    </app-page-header>
    <div class="flex flex-col gap-4 p-4 pb-16 md:p-6">
      <div class="flex flex-wrap items-center gap-3">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-72">
          <mat-icon matPrefix class="ml-3 text-on-surface-variant">search</mat-icon>
          <input matInput [value]="search()" (input)="onSearch($any($event.target).value)" placeholder="Search code, partner or guest" i18n-placeholder autocomplete="off" />
        </mat-form-field>
        <mat-chip-listbox [value]="status()" (change)="setStatus($event.value)" aria-label="Filter by status" i18n-aria-label>
          @for (s of statuses; track s.value) { <mat-chip-option [value]="s.value">{{ s.label }}@if (s.value === 'pending' && pending() > 0) { <span class="ml-1 rounded-full bg-amber-200 px-1.5 text-xs text-amber-900">{{ pending() }}</span> }</mat-chip-option> }
        </mat-chip-listbox>
      </div>
      @if (loading() && !data()) { <mat-progress-bar mode="indeterminate" /> }
      @if (failed()) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert"><p class="m-0 font-semibold" i18n>Could not load the requests.</p><button matButton="filled" (click)="reload()" i18n>Try again</button></div>
      } @else if (data()) {
        @if (rows().length === 0) {
          <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
            <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">outgoing_mail</mat-icon>
            <p class="m-0 font-medium" i18n>No requests here.</p>
            <p class="m-0 max-w-md text-sm text-on-surface-variant" i18n>Requests appear when a partner you have invited to the portal asks to book. Invite people from a partner’s Portal access tab.</p>
          </div>
        } @else {
          <div class="overflow-x-auto rounded-3xl border border-outline-variant/60 bg-surface-container-lowest">
            <table mat-table [dataSource]="rows()" class="w-full min-w-[820px]">
              <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef i18n>Request</th><td mat-cell *matCellDef="let r"><div class="font-semibold">{{ r.code }}</div><div class="text-xs text-on-surface-variant">{{ r.createdAt | date: 'd MMM, HH:mm' }}</div></td></ng-container>
              <ng-container matColumnDef="partner"><th mat-header-cell *matHeaderCellDef i18n>Partner</th><td mat-cell *matCellDef="let r"><div class="text-sm">{{ r.partner.name }}</div><div class="text-xs text-on-surface-variant">{{ kind(r) }}</div></td></ng-container>
              <ng-container matColumnDef="what"><th mat-header-cell *matHeaderCellDef i18n>What</th><td mat-cell *matCellDef="let r" class="text-sm"><div>@if (r.kind === 'new') { {{ r.roomTypeName }} } @else { {{ r.notes }} }</div><div class="text-xs text-on-surface-variant">{{ r.checkIn | date: 'd MMM' }} – {{ r.checkOut | date: 'd MMM y' }}@if (r.guest) { · {{ r.guest.firstName }} {{ r.guest.lastName }} }</div></td></ng-container>
              <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef class="!text-right" i18n>Quoted</th><td mat-cell *matCellDef="let r" class="!text-right tabular-nums">@if (r.quote) { {{ r.quote.total ?? 0 | currency: r.quote.currency || currency() : 'symbol' : '1.0-2' }} }</td></ng-container>
              <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef i18n>Status</th><td mat-cell *matCellDef="let r"><span class="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(r.status)">{{ statusText(r.status) }}</span>@if (r.lastCheckFailure && r.status === 'pending') { <mat-icon class="ml-1 !h-5 !w-5 !align-middle !text-xl !leading-none text-amber-600" matTooltip="The last attempt to accept it did not go through" i18n-matTooltip>warning</mat-icon> }</td></ng-container>
              <ng-container matColumnDef="go"><th mat-header-cell *matHeaderCellDef class="!w-10"></th><td mat-cell *matCellDef="let r"><mat-icon class="text-on-surface-variant">chevron_right</mat-icon></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" class="cursor-pointer hover:bg-surface-container" tabindex="0" (click)="open(row)" (keydown.enter)="open(row)"></tr>
            </table>
          </div>
          <mat-paginator [length]="data()!.total" [pageSize]="pageSize" [pageIndex]="page() - 1" [hidePageSize]="true" (page)="onPage($event)" aria-label="Pages" i18n-aria-label />
        }
      }
    </div>
  `,
})
export class PartnerRequestsAdminComponent {
  private readonly api = inject(PartnerRequestService);
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly roles = inject(RolesService);

  readonly statuses = [
    { value: 'pending', label: $localize`Waiting` },
    { value: 'accepted', label: $localize`Accepted` },
    { value: 'rejected', label: $localize`Declined` },
    { value: 'all', label: $localize`All` },
  ];
  readonly columns = ['code', 'partner', 'what', 'total', 'status', 'go'];
  readonly search = signal('');
  readonly status = signal('pending');
  readonly page = signal(1);
  readonly pageSize = 25;
  private readonly refresh = signal(0);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currencyCode ?? this.storeStore.selectedStore()?.currency ?? '');
  readonly canProcess = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.partners.requests.process']));

  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), q: this.search(), status: this.status(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.list(params.id, { q: params.q, status: params.status, page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed(() => this.data()?.requests ?? []);
  readonly pending = computed(() => this.data()?.pending ?? 0);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  tone = (s: string) => TONE[s] ?? TONE['cancelled'];
  statusText = (s: string) => ({ pending: $localize`Waiting`, processing: $localize`Being answered`, accepted: $localize`Accepted`, rejected: $localize`Declined`, cancelled: $localize`Withdrawn` }[s] ?? s);
  kind = (r: PartnerRequestRow) => ({ new: $localize`Booking request`, change: $localize`Change request`, cancel: $localize`Cancellation request` }[r.kind] ?? r.kind);

  private timer: ReturnType<typeof setTimeout> | undefined;
  onSearch(value: string) { clearTimeout(this.timer); this.timer = setTimeout(() => { this.search.set(value.trim()); this.page.set(1); }, 300); }
  setStatus(value: string | null) { this.status.set(value ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }

  open(r: PartnerRequestRow) {
    if (this.dialog.getDialogById('partner-request')) return;
    this.dialog.open(RequestDialogComponent, { id: 'partner-request', width: '760px', maxWidth: '96vw', data: { storeId: this.storeId(), id: r._id, currency: this.currency(), canProcess: this.canProcess() } }).afterClosed().subscribe(() => this.reload());
  }
}
