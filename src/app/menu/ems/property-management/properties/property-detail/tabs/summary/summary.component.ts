import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { PropertyDetailComponent } from '../../property-detail.component';
import { Property, PropertyCategory, PropertyOwner } from '../../../../../../../shared/models/estate.model';

@Component({
  selector: 'app-property-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
    MatListModule,
  ],
  templateUrl: './summary.component.html',
})
export class PropertySummaryComponent {
  private parent = inject(PropertyDetailComponent);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly property = this.parent.property;

  readonly isSingleUnit = computed(
    () => this.property()?.category === PropertyCategory.SINGLE_UNIT,
  );

  readonly owners = computed(() => this.property()?.owners ?? []);

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-600',
      VACANT: 'bg-blue-100 text-blue-800',
      OCCUPIED: 'bg-emerald-100 text-emerald-800',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getFullAddress(): string {
    const addr = this.property()?.address;
    if (!addr) return '—';
    return [addr.street, addr.city, addr.state, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(', ');
  }

  getManagerName(p: Property): string {
    if (!p.propertyManager) return '';
    if (typeof p.propertyManager === 'object') return (p.propertyManager as any).name || '';
    return '';
  }

  getOwnerDisplayName(ownerEntry: PropertyOwner): string {
    const o = ownerEntry.owner;
    if (!o || typeof o === 'string') return 'Unknown';
    if (o.isCompany && o.companyName) return o.companyName;
    return `${o.firstName} ${o.lastName}`;
  }

  getOwnerEmail(ownerEntry: PropertyOwner): string {
    const o = ownerEntry.owner;
    if (!o || typeof o === 'string') return '';
    return o.email ?? '';
  }

  getOwnerId(ownerEntry: PropertyOwner): string {
    const o = ownerEntry.owner;
    if (!o) return '';
    if (typeof o === 'string') return o;
    return o._id;
  }

  isCompanyOwner(ownerEntry: PropertyOwner): boolean {
    const o = ownerEntry.owner;
    if (!o || typeof o === 'string') return false;
    return o.isCompany;
  }

  navigateToOwner(ownerEntry: PropertyOwner): void {
    const id = this.getOwnerId(ownerEntry);
    if (id) {
      this.router.navigate(['../../../rental-owners', id], { relativeTo: this.route });
    }
  }

  openMap(): void {
    const loc = this.property()?.location;
    if (loc?.coordinates?.length === 2) {
      const [lng, lat] = loc.coordinates;
      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    } else {
      const addr = this.getFullAddress();
      window.open(`https://maps.google.com/?q=${encodeURIComponent(addr)}`, '_blank');
    }
  }
}
