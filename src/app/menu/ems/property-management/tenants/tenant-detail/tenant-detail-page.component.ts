import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { rxResource } from '@angular/core/rxjs-interop';
import { TenantService } from '../../../../../shared/services/tenant.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-tenant-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  templateUrl: './tenant-detail-page.component.html',
})
export class TenantDetailPageComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tenantService = inject(TenantService);

  readonly tenantId = signal<string>(
    this.route.snapshot.paramMap.get('id') || '',
  );

  readonly tabs = [
    { label: 'Profile', link: 'profile', icon: 'badge' },
    { label: 'Leases', link: 'leases', icon: 'description' },
    { label: 'Invoices', link: 'invoices', icon: 'receipt_long' },
    { label: 'Activities', link: 'activities', icon: 'timeline' },
  ];

  tenantResource = rxResource({
    params: () => ({ id: this.tenantId() }),
    stream: ({ params }) => this.tenantService.getTenantById(params.id),
  });

  tenant = computed(() => this.tenantResource.value()?.data);

  readonly displayName = computed(() => {
    const t = this.tenant();
    if (!t) return '';
    if (t.isCompany && t.companyName) return t.companyName;
    return `${t.firstName} ${t.middleName || ''} ${t.lastName}`.replace(/\s+/g, ' ').trim();
  });

  readonly subtitleText = computed(() => {
    const t = this.tenant();
    if (!t) return '';
    const parts: string[] = [];
    if (t.isCompany) parts.push('Company');
    if (t.email) parts.push(t.email);
    if (t.phoneNumbers[0]) parts.push(t.phoneNumbers[0]);
    return parts.join(' · ');
  });

  goBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  addLease(): void {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    this.router.navigate(['/menu/ems/leases/create'], {
      queryParams: { tenantId },
    });
  }

  reload(): void {
    this.tenantResource.reload();
  }
}
