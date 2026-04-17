import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { LeaseService } from '../../../../../../../../../../shared/services/lease.service';
import { Lease, Tenant, LeaseType } from '../../../../../../../../../../shared/models/estate.model';
import { NoRecordComponent } from '../../../../../../../../../../shared/components/no-record/no-record.component';
import { UnitDetailComponent } from '../../unit-detail.component';

@Component({
  selector: 'app-unit-leases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    NoRecordComponent,
  ],
  templateUrl: './leases.component.html',
})
export class UnitLeasesComponent {
  private readonly router = inject(Router);
  private readonly parent = inject(UnitDetailComponent);
  private readonly leaseService = inject(LeaseService);

  readonly unitId = this.parent.unitId;
  readonly currencyCode = this.parent.currencyCode;

  readonly displayedColumns: string[] = [
    'status', 'leaseNumber', 'tenant', 'duration', 'rent', 'actions',
  ];

  readonly leaseResource = rxResource({
    params: () => ({
      storeId: this.parent.storeStore.selectedStore()?._id ?? '',
      unitId: this.unitId(),
    }),
    stream: ({ params }) =>
      this.leaseService.getLeases(params.storeId, { unitId: params.unitId, limit: 50 }),
  });

  readonly leases = computed<Lease[]>(
    () => this.leaseResource.value()?.data.items ?? [],
  );

  getLeaseStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-600! text-white!',
      DRAFT: 'bg-gray-500! text-white!',
      ENDED: 'bg-blue-600! text-white!',
      TERMINATED: 'bg-red-600! text-white!',
      CANCELLED: 'bg-gray-400! text-white!',
    };
    return map[status] || 'bg-gray-500! text-white!';
  }

  getTenantName(lease: Lease): string {
    const tenants = lease.tenantIds || [];
    if (!tenants.length) return '—';
    const first = tenants[0];
    if (typeof first === 'string') return first;
    const t = first as Tenant;
    const name = `${t.firstName || ''} ${t.lastName || ''}`.trim();
    const extra = tenants.length - 1;
    return extra > 0 ? `${name} +${extra}` : name || '—';
  }

  getLeaseDuration(lease: Lease): string {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const start = lease.startDate ? fmt(lease.startDate) : '—';
    if (lease.leaseType === LeaseType.MONTH_TO_MONTH) return `${start} – Month-to-month`;
    const end = lease.endDate ? fmt(lease.endDate) : '—';
    return `${start} – ${end}`;
  }

  getLeaseRent(lease: Lease): string {
    const rent = lease.leaseTransactions?.recurringRent;
    if (!rent?.enabled || !rent.totalAmount) return '—';
    const currency = lease.currency || this.currencyCode();
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(rent.totalAmount);
    } catch {
      return `${currency} ${rent.totalAmount.toFixed(2)}`;
    }
  }

  goToLeaseDetail(id: string): void {
    this.router.navigate(['/menu/ems/leases', id]);
  }
}
