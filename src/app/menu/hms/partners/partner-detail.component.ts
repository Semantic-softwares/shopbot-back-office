import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PARTNER_TYPE_LABELS, Partner, PartnerService, channelLabel } from '../../../shared/services/partner.service';
import { RolesService } from '../../../shared/services/roles.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PartnerDialogComponent } from './partner-dialog';
import { AgreementDialogComponent } from './agreement-dialog';
import { CommissionsComponent } from './commissions/commissions.component';
import { PortalAccessComponent } from './portal-access.component';
import { PartnerAgreement, PartnerAgreementService, commissionSummary, pricingSummary } from '../../../shared/services/partner-agreement.service';

const EVENT_LABELS: Record<string, () => string> = {
  created: () => $localize`Partner created`,
  updated: () => $localize`Details edited`,
  activated: () => $localize`Activated`,
  deactivated: () => $localize`Deactivated`,
};

const STAY_TONES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-900', reserved: 'bg-indigo-100 text-indigo-900', checked_in: 'bg-green-100 text-green-900',
  checked_out: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-900', no_show: 'bg-amber-100 text-amber-900',
};
const STAY_LABELS: Record<string, () => string> = {
  confirmed: () => $localize`Confirmed`, reserved: () => $localize`Reserved`, checked_in: () => $localize`Checked in`,
  checked_out: () => $localize`Checked out`, cancelled: () => $localize`Cancelled`, no_show: () => $localize`No-show`,
};

/** One partner: its profile, activity trail and the stays it brought. Later stages add agreements, portal users and commissions. */
@Component({
  selector: 'app-partner-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, CommissionsComponent, PortalAccessComponent, PageHeaderComponent, MatButtonModule, MatDialogModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatTableModule, MatTabsModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './partner-detail.component.html',
})
export class PartnerDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: this.route.snapshot.paramMap.get('id') ?? '' });
  private readonly api = inject(PartnerService);
  private readonly agreementApi = inject(PartnerAgreementService);
  private readonly currencyPipe = new CurrencyPipe(inject(LOCALE_ID));
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly roles = inject(RolesService);

  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currencyCode ?? this.storeStore.selectedStore()?.currency ?? '');
  readonly canSeeCommissions = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.commissions.view']));
  readonly canManageUsers = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.partners.users.manage']));
  readonly canManage = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.partners.manage']));
  readonly typeLabel = (t: string) => PARTNER_TYPE_LABELS[t as keyof typeof PARTNER_TYPE_LABELS]?.() ?? t;
  readonly eventLabel = (t: string) => EVENT_LABELS[t]?.() ?? t;
  readonly stayTone = (s: string) => STAY_TONES[s] ?? 'bg-gray-100 text-gray-700';
  readonly stayLabel = (s: string) => STAY_LABELS[s]?.() ?? s;
  readonly channel = channelLabel;
  readonly stayColumns = ['confirmation', 'guest', 'stay', 'channel', 'status', 'total'];

  private readonly refresh = signal(0);
  private readonly partnerRes = rxResource({
    params: () => ({ store: this.storeId(), id: this.id(), n: this.refresh() }),
    stream: ({ params }) => (params.store && params.id ? this.api.get(params.store, params.id) : of(null)),
  });
  readonly partner = computed<Partner | null>(() => (this.partnerRes.hasValue() ? this.partnerRes.value() : null));
  readonly failed = computed(() => !!this.partnerRes.error() && !this.partner());
  readonly events = computed(() => [...(this.partner()?.events ?? [])].reverse());

  /** Which tab is open, so saving something does not send you back to the first one. */
  readonly tab = signal(0);

  // ---- agreements ----
  readonly canAgree = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.partners.agreements.manage']));
  readonly agreementColumns = ['agreement', 'period', 'rate', 'commission', 'status', 'actions'];
  money = (n: number): string => this.currencyPipe.transform(n, this.currency(), 'symbol', '1.0-2') ?? String(n);
  readonly rateText = (a: PartnerAgreement) => pricingSummary(a, this.money);
  readonly commissionText = (a: PartnerAgreement) => commissionSummary(a, this.money);
  private readonly agreementsRes = rxResource({
    params: () => ({ store: this.storeId(), id: this.id(), n: this.refresh() }),
    stream: ({ params }) => (params.store && params.id ? this.agreementApi.list(params.store, params.id) : of(null)),
  });
  readonly agreements = computed(() => (this.agreementsRes.hasValue() ? this.agreementsRes.value() : null));

  editAgreement(agreement?: PartnerAgreement) {
    if (this.dialog.getDialogById('agreement')) return;
    this.dialog
      .open(AgreementDialogComponent, { id: 'agreement', width: '720px', maxWidth: '96vw', data: { storeId: this.storeId(), partnerId: this.id(), currency: this.currency(), agreement } })
      .afterClosed()
      .subscribe((saved) => { if (saved) { this.snack.open($localize`Agreement saved.`, $localize`Close`, { duration: 3000 }); this.reload(); } });
  }

  toggleAgreement(a: PartnerAgreement) {
    const next = a.status === 'active' ? 'inactive' : 'active';
    this.agreementApi.setStatus(this.storeId(), a._id, next).subscribe({
      next: () => { this.snack.open(next === 'active' ? $localize`Agreement activated.` : $localize`Agreement deactivated. Reservations already made keep their terms.`, $localize`Close`, { duration: 4000 }); this.reload(); },
      error: (e) => this.snack.open(e?.error?.message ?? $localize`Could not change the agreement.`, $localize`Close`, { duration: 6000 }),
    });
  }

  readonly page = signal(1);
  readonly pageSize = 15;
  private readonly staysRes = rxResource({
    params: () => ({ store: this.storeId(), id: this.id(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => (params.store && params.id ? this.api.reservations(params.store, params.id, { page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly stays = computed(() => (this.staysRes.hasValue() ? this.staysRes.value() : null));

  guestName(row: { guest?: { firstName?: string; lastName?: string; companyName?: string } }): string {
    const g = row.guest;
    return g ? ([g.firstName, g.lastName].filter(Boolean).join(' ') || g.companyName || '—') : '—';
  }
  location(p: Partner): string {
    return [p.address?.city, p.address?.country].filter((x) => !!x).join(', ') || '—';
  }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  openStay(id: string) { this.router.navigate(['/menu/hms/front-desk/reservations/edit', id]); }
  reload() { this.refresh.update((n) => n + 1); }

  edit() {
    const partner = this.partner();
    if (!partner || this.dialog.getDialogById('partner')) return;
    this.dialog
      .open(PartnerDialogComponent, { id: 'partner', width: '640px', maxWidth: '96vw', data: { storeId: this.storeId(), partner } })
      .afterClosed()
      .subscribe((saved) => { if (saved) this.reload(); });
  }

  toggleStatus() {
    const partner = this.partner();
    if (!partner) return;
    const next = partner.status === 'active' ? 'inactive' : 'active';
    const apply = () => this.api.setStatus(this.storeId(), partner._id, next).subscribe({
      next: () => { this.snack.open(next === 'active' ? $localize`Partner activated.` : $localize`Partner deactivated. Existing reservations keep their partner.`, $localize`Close`, { duration: 4000 }); this.reload(); },
      error: (e) => this.snack.open(e?.error?.message ?? $localize`Could not change the status.`, $localize`Close`, { duration: 5000 }),
    });
    if (next === 'active') { apply(); return; }
    this.dialog
      .open(ConfirmDialogComponent, { data: { title: $localize`Deactivate ${partner.name}?`, message: $localize`It will no longer be offered for new bookings. Reservations it already brought keep their partner.`, confirmText: $localize`Deactivate` } })
      .afterClosed()
      .subscribe((ok) => { if (ok) apply(); });
  }
}
