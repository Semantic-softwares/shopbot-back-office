import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstateUnitService } from '../../../../../../../../shared/services/estate-unit.service';
import { StoreStore } from '../../../../../../../../shared/stores/store.store';
import { Unit, Property, NON_LIVABLE_UNIT_TYPES } from '../../../../../../../../shared/models/estate.model';
import { PageHeaderComponent } from '../../../../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-unit-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  templateUrl: './unit-detail.component.html',
})
export class UnitDetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private unitService = inject(EstateUnitService);
  readonly storeStore = inject(StoreStore);

  readonly unitId = signal<string>(
    this.route.snapshot.paramMap.get('unitId') || '',
  );

  readonly tabs = [
    { label: 'Summary', link: 'summary', icon: 'dashboard' },
    { label: 'Leases', link: 'leases', icon: 'description' },
    { label: 'Maintenance', link: 'maintenance', icon: 'handyman' },
  ];

  unitResource = rxResource({
    params: () => ({ id: this.unitId() }),
    stream: ({ params }) => this.unitService.getUnitById(params.id),
  });

  unit = computed(() => this.unitResource.value()?.data);

  readonly subtitleText = computed(() => {
    const u = this.unit();
    if (!u) return '';
    const typeName = u.type ? u.type.replace(/_/g, ' ') : '';
    const status = u.status ? u.status.replace(/_/g, ' ') : '';
    return [typeName, status].filter(Boolean).join(' · ');
  });

  readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');

  editUnit(): void {
    const id = this.unitId();
    if (!id) return;
    this.router.navigate(['../../../', id, 'edit'], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['../../../lists'], { relativeTo: this.route });
  }

  reload(): void {
    this.unitResource.reload();
  }
}
