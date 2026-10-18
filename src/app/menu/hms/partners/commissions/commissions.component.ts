import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RolesService } from '../../../../shared/services/roles.service';
import { PartnerService } from '../../../../shared/services/partner.service';
import { COMMISSION_STATUS_TONES, Commission, PartnerCommissionService, commissionStatusLabel } from '../../../../shared/services/partner-commission.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { CommissionDialogComponent } from './commission-dialog';

/**
 * What the hotel owes its travel partners, one line per reservation. Open a line to approve it, resolve a flagged change, or record
 * that it was settled. Used as its own page, and inside a partner's page where it is limited to that partner.
 */
@Component({
  selector: 'app-commissions',
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, MatButtonModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatTableModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './commissions.component.html',
})
export class CommissionsComponent {
  /** When set, the list is limited to this partner and shown without the page header. */
  readonly partnerId = input<string | null>(null);

  private readonly api = inject(PartnerCommissionService);
  private readonly partnersApi = inject(PartnerService);
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly roles = inject(RolesService);

  readonly statuses = [
    { value: 'all', label: $localize`All` },
    { value: 'estimated', label: $localize`Estimated` },
    { value: 'pending_review', label: $localize`Awaiting approval` },
    { value: 'review', label: $localize`Needs a look` },
    { value: 'approved', label: $localize`Approved` },
    { value: 'paid', label: $localize`Paid` },
    { value: 'void', label: $localize`Void` },
  ];
  readonly columns = ['reservation', 'partner', 'stay', 'status', 'amount', 'owed', 'go'];

  readonly search = signal('');
  readonly status = signal('all');
  readonly partner = signal('all');
  readonly page = signal(1);
  readonly pageSize = 25;
  private readonly refresh = signal(0);

  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currencyCode ?? this.storeStore.selectedStore()?.currency ?? '');
  readonly canApprove = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.commissions.approve']));
  readonly canPay = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.commissions.pay']));
  readonly embedded = computed(() => !!this.partnerId());

  private readonly partnerList = rxResource({
    params: () => ({ id: this.storeId(), embedded: this.embedded() }),
    stream: ({ params }) => (params.id && !params.embedded ? this.partnersApi.list(params.id, { limit: 200 }) : of(null)),
  });
  readonly partnerOptions = computed(() => (this.partnerList.hasValue() ? this.partnerList.value()?.partners ?? [] : []));

  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), q: this.search(), status: this.status(), partner: this.partnerId() ?? this.partner(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.list(params.id, { q: params.q, status: params.status, partner: params.partner, page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed(() => this.data()?.rows ?? []);
  readonly totals = computed(() => this.data()?.totals ?? null);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  tone = (s: string) => COMMISSION_STATUS_TONES[s] ?? 'bg-gray-100 text-gray-700';
  statusText = commissionStatusLabel;
  cur = (c: Commission) => c.currency || this.currency();

  private timer: ReturnType<typeof setTimeout> | undefined;
  onSearch(value: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.search.set(value.trim()); this.page.set(1); }, 300);
  }
  setStatus(value: string | null) { this.status.set(value ?? 'all'); this.page.set(1); }
  setPartner(value: string | null) { this.partner.set(value ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }

  open(c: Commission) {
    if (this.dialog.getDialogById('commission')) return;
    this.dialog
      .open(CommissionDialogComponent, { id: 'commission', width: '720px', maxWidth: '96vw', data: { storeId: this.storeId(), id: c._id, currency: this.currency(), canApprove: this.canApprove(), canPay: this.canPay() } })
      .afterClosed()
      .subscribe(() => this.reload());
  }
}
