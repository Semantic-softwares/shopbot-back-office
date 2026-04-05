import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { rxResource } from '@angular/core/rxjs-interop';
import { RentalOwnerService } from '../../../../../shared/services/rental-owner.service';
import { RentalOwner } from '../../../../../shared/models/estate.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-rental-owner-detail',
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
  templateUrl: './rental-owner-detail.component.html',
})
export class RentalOwnerDetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rentalOwnerService = inject(RentalOwnerService);

  readonly ownerId = signal<string>(
    this.route.snapshot.paramMap.get('id') || '',
  );

  readonly tabs = [
    { label: 'Summary', link: 'summary', icon: 'dashboard' },
    { label: 'Properties', link: 'properties', icon: 'domain' },
    { label: 'Notes', link: 'notes', icon: 'sticky_note_2' },
    { label: 'Files', link: 'files', icon: 'folder' },
  ];

  ownerResource = rxResource({
    params: () => ({ id: this.ownerId() }),
    stream: ({ params }) => this.rentalOwnerService.getRentalOwnerById(params.id),
  });

  owner = computed(() => this.ownerResource.value()?.data);

  readonly displayName = computed(() => {
    const o = this.owner();
    if (!o) return '';
    if (o.isCompany && o.companyName) return o.companyName;
    return `${o.firstName} ${o.lastName}`;
  });

  readonly subtitleText = computed(() => {
    const o = this.owner();
    if (!o) return '';
    const parts: string[] = [];
    if (o.isCompany) parts.push('Company');
    if (o.email) parts.push(o.email);
    if (o.phone) parts.push(o.phone);
    return parts.join(' · ');
  });

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-600! text-white!',
      INACTIVE: 'bg-gray-500! text-white!',
    };
    return map[status] || 'bg-gray-500! text-white!';
  }

  goBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  reload(): void {
    this.ownerResource.reload();
  }
}
