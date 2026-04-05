import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstateUnitService } from '../../../../../../../../shared/services/estate-unit.service';
import { Unit, Property, NON_LIVABLE_UNIT_TYPES } from '../../../../../../../../shared/models/estate.model';
import { PageHeaderComponent } from '../../../../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-unit-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderComponent,
  ],
  templateUrl: './unit-detail.component.html',
})
export class UnitDetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private unitService = inject(EstateUnitService);

  readonly unitId = signal<string>(
    this.route.snapshot.paramMap.get('unitId') || '',
  );

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

  readonly isNonLivable = computed(() => {
    const u = this.unit();
    return u ? NON_LIVABLE_UNIT_TYPES.includes(u.type) : false;
  });

  getPropertyName(unit: Unit): string {
    if (!unit.property) return '—';
    if (typeof unit.property === 'string') return unit.property;
    return (unit.property as Property).name ?? '—';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      VACANT: 'bg-green-600! text-white!',
      OCCUPIED: 'bg-orange-600! text-white!',
      RESERVED: 'bg-yellow-600! text-white!',
      INACTIVE: 'bg-gray-500! text-white!',
    };
    return map[status] || 'bg-gray-500! text-white!';
  }

  editUnit(): void {
    const id = this.unitId();
    if (!id) return;
    this.router.navigate(['../../', id, 'edit'], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['../../lists'], { relativeTo: this.route });
  }
}
