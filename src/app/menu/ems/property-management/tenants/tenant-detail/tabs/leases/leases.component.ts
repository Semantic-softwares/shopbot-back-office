import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { LeaseService } from '../../../../../../../shared/services/lease.service';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { Lease } from '../../../../../../../shared/models/estate.model';
import { NoRecordComponent } from '../../../../../../../shared/components/no-record/no-record.component';
import { of } from 'rxjs';

@Component({
  selector: 'app-tenant-leases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    NoRecordComponent,
  ],
  templateUrl: './leases.component.html',
})
export class TenantLeasesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leaseService = inject(LeaseService);
  private readonly storeStore = inject(StoreStore);

  readonly displayedColumns: string[] = [
    'lease',
    'term',
    'status',
    'tenant',
    'actions',
  ];

  private readonly tenantId = computed(() => {
    return (
      this.route.snapshot.paramMap.get('id') ||
      this.route.parent?.snapshot.paramMap.get('id') ||
      this.route.parent?.parent?.snapshot.paramMap.get('id') ||
      ''
    );
  });

  readonly leasesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      tenantId: this.tenantId(),
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.tenantId) {
        return of({ success: true, message: '', data: { items: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } } });
      }

      return this.leaseService.getLeases(params.storeId, {
        tenantId: params.tenantId,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    },
  });

  readonly leases = computed<Lease[]>(() => this.leasesResource.value()?.data?.items || []);

  propertyName(lease: Lease): string {
    if (typeof lease.propertyId === 'string') return lease.propertyId;
    return lease.propertyId?.name || '--';
  }

  unitName(lease: Lease): string {
    if (!lease.unitId) return '--';
    if (typeof lease.unitId === 'string') return lease.unitId;
    return lease.unitId?.name || '--';
  }

  formatDate(value?: string | null): string {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  leaseTypeLabel(lease: Lease): string {
    return lease.leaseType
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join('-');
  }

  primaryTenantName(lease: Lease): string {
    const tenantRef = lease.tenantIds?.[0];
    if (!tenantRef) return '--';
    if (typeof tenantRef === 'string') return 'Tenant';
    const fullName = `${tenantRef.firstName || ''} ${tenantRef.lastName || ''}`.trim();
    return fullName || 'Tenant';
  }

  tenantInitials(lease: Lease): string {
    const name = this.primaryTenantName(lease);
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '--';
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700';
      case 'ENDED':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  viewLease(leaseId: string): void {
    this.router.navigate(['/menu/ems/leases', leaseId]);
  }
}
