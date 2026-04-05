import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { EstatePropertyService } from '../../../../../../../shared/services/estate-property.service';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { Property, PropertyOwner } from '../../../../../../../shared/models/estate.model';
import { RentalOwnerDetailComponent } from '../../rental-owner-detail.component';

@Component({
  selector: 'app-rental-owner-properties',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './properties.component.html',
})
export class RentalOwnerPropertiesComponent {
  private parent = inject(RentalOwnerDetailComponent);
  private propertyService = inject(EstatePropertyService);
  private storeStore = inject(StoreStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly ownerId = this.parent.ownerId;
  private readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');

  readonly displayedColumns: string[] = ['name', 'address', 'type', 'status', 'ownership', 'actions'];

  propertiesResource = rxResource({
    params: () => ({ ownerId: this.ownerId(), storeId: this.storeId() }),
    stream: ({ params }) => {
      if (!params.storeId || !params.ownerId) return of([] as Property[]);
      return this.propertyService.getProperties(params.storeId, {
        ownerId: params.ownerId,
        limit: 100,
      }).pipe(map((res): Property[] => res.data.items));
    },
  });

  readonly properties = computed(() => this.propertiesResource.value() ?? []);

  getAddress(p: Property): string {
    const addr = p.address;
    if (!addr) return '—';
    return [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
  }

  getOwnershipPercentage(property: Property): number {
    const ownerEntry = property.owners?.find((o: PropertyOwner) => {
      const ownerId = typeof o.owner === 'string' ? o.owner : o.owner?._id;
      return ownerId === this.ownerId();
    });
    return ownerEntry?.ownershipPercentage ?? 0;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  navigateToProperty(property: Property): void {
    this.router.navigate(['../../../properties', property._id], {
      relativeTo: this.route,
    });
  }
}
