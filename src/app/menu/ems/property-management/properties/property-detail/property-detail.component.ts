import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstatePropertyService } from '../../../../../shared/services/estate-property.service';
import { Property, PropertyCategory } from '../../../../../shared/models/estate.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-property-detail',
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
  templateUrl: './property-detail.component.html',
})
export class PropertyDetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private propertyService = inject(EstatePropertyService);

  readonly propertyId = signal<string>(
    this.route.snapshot.paramMap.get('id')
    || this.route.parent?.snapshot.paramMap.get('id')
    || '',
  );

  readonly tabs = [
    { label: 'Summary', link: 'summary', icon: 'dashboard' },
    { label: 'Units', link: 'units', icon: 'apartment' },
    { label: 'Notes', link: 'notes', icon: 'sticky_note_2' },
    { label: 'Files', link: 'files', icon: 'folder' },
    { label: 'Maintenance', link: 'maintenance', icon: 'handyman' },
  ];

  propertyResource = rxResource({
    params: () => ({ id: this.propertyId() }),
    stream: ({ params }) => this.propertyService.getPropertyById(params.id),
  });

  property = computed(() => this.propertyResource.value()?.data);

  isSingleUnit = computed(
    () => this.property()?.category === PropertyCategory.SINGLE_UNIT,
  );

  readonly subtitleText = computed(() => {
    const p = this.property();
    if (!p) return '';
    const typeName = p.type ? p.type.replace(/_/g, ' ') : '';
    const location = this.getLocationString(p);
    return [typeName, location].filter(Boolean).join(' · ');
  });

  getLocationString(property: Property): string {
    const addr = property.address;
    if (!addr) return '';
    return [addr.city, addr.state, addr.country].filter(Boolean).join(', ');
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-600! text-white!',
      OCCUPIED: 'bg-emerald-600! text-white!',
      INACTIVE: 'bg-gray-500! text-white!',
    };
    return map[status] || 'bg-gray-500! text-white!';
  }

  editProperty(): void {
    const id = this.propertyId();
    if (!id) return;
     this.router.navigate(['../', '../', 'properties', id, 'edit'], {
      relativeTo: this.route,
    });
  }


  goBack(): void {
    this.router.navigate(['..', 'tabs', 'properties'], { relativeTo: this.route });
  }

  reload(): void {
    this.propertyResource.reload();
  }
}
