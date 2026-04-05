import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { LeaseDetailPageComponent } from '../../lease-detail-page.component';
import { Tenant } from '../../../../../../shared/models/estate.model';
import { MatButton } from '@angular/material/button';

interface TenantDisplay {
  name: string;
  initials: string;
  email: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-lease-tenants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatExpansionModule, MatIconModule, MatButton],
  templateUrl: './tenants.component.html',
})
export class LeaseTenantsComponent {
  private parent = inject(LeaseDetailPageComponent);
  lease = this.parent.lease;

  private readonly avatarColors = [
    '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c', '#f39c12', '#16a085',
  ];

  readonly tenants = computed<TenantDisplay[]>(() => {
    const lease = this.lease();
    const legacyTenant = (lease as unknown as { tenantId?: string | Tenant })?.tenantId;
    const raw = lease?.tenantIds?.length
      ? lease.tenantIds
      : legacyTenant
        ? [legacyTenant]
        : [];

    return raw.map((t, i) => {
      if (typeof t === 'string') {
        return { name: t, initials: t.slice(0, 2).toUpperCase(), email: '', status: 'Pending', color: this.avatarColors[i % this.avatarColors.length] };
      }
      const first = t.firstName ?? '';
      const last = t.lastName ?? '';
      const name = `${first} ${t.middleName ?? ''} ${last}`.replace(/\s+/g, ' ').trim();
      const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
      const status = t.status === 'ACTIVE' ? 'Active' : 'Pending';
      return { name, initials, email: t.email ?? '', status, color: this.avatarColors[i % this.avatarColors.length] };
    });
  });

  readonly detailsSummary = computed<string>(() => {
    const lease = this.lease();
    if (!lease) return '';
    const parts: string[] = [];
    const typeLabel = lease.leaseType === 'FIXED_TERM' ? 'Fixed lease type' : 'Month-to-month lease type';
    parts.push(typeLabel);
    const invoicing = lease.leaseTransactions?.invoicingType;
    if (invoicing === 'INDIVIDUAL') {
      parts.push('Separated invoicing');
    } else {
      parts.push('Joint invoicing');
    }
    return parts.join('. ') + '.';
  });
}
