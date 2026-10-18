import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RolesService } from '../../../shared/services/roles.service';
import { PARTNER_TYPES, PARTNER_TYPE_LABELS, Partner, PartnerService } from '../../../shared/services/partner.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PartnerDialogComponent } from './partner-dialog';

/** The hotel's travel partners: agencies, tour operators, DMCs. Opening one shows its profile and the stays it brought. */
@Component({
  selector: 'app-partners',
  imports: [PageHeaderComponent, MatButtonModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatTableModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './partners.component.html',
})
export class PartnersComponent {
  private readonly api = inject(PartnerService);
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly roles = inject(RolesService);

  readonly types = PARTNER_TYPES;
  readonly typeLabel = (t: string) => PARTNER_TYPE_LABELS[t as keyof typeof PARTNER_TYPE_LABELS]?.() ?? t;
  readonly statuses = [
    { value: 'all', label: $localize`All` },
    { value: 'active', label: $localize`Active` },
    { value: 'inactive', label: $localize`Inactive` },
  ];
  readonly columns = ['name', 'type', 'contact', 'status', 'go'];

  readonly search = signal('');
  readonly type = signal('all');
  readonly status = signal('active');
  readonly page = signal(1);
  readonly pageSize = 20;
  private readonly refresh = signal(0);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly canManage = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.partners.manage']));

  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), q: this.search(), type: this.type(), status: this.status(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.list(params.id, { q: params.q, type: params.type, status: params.status, page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed(() => this.data()?.partners ?? []);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  private timer: ReturnType<typeof setTimeout> | undefined;
  onSearch(value: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.search.set(value.trim()); this.page.set(1); }, 300);
  }
  setType(value: string | null) { this.type.set(value ?? 'all'); this.page.set(1); }
  setStatus(value: string | null) { this.status.set(value ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }

  open(p: Partner) { this.router.navigate(['/menu/hms/partners', p._id]); }

  create() {
    if (this.dialog.getDialogById('partner')) return;
    this.dialog
      .open(PartnerDialogComponent, { id: 'partner', width: '640px', maxWidth: '96vw', data: { storeId: this.storeId() } })
      .afterClosed()
      .subscribe((saved: Partner | undefined) => { if (saved) { this.reload(); this.open(saved); } });
  }
}
