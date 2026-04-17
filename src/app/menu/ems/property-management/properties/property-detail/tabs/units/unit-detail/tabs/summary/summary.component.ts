import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Unit, Property, NON_LIVABLE_UNIT_TYPES } from '../../../../../../../../../../shared/models/estate.model';
import { UnitDetailComponent } from '../../unit-detail.component';

@Component({
  selector: 'app-unit-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './summary.component.html',
})
export class UnitSummaryComponent {
  private parent = inject(UnitDetailComponent);

  readonly unit = this.parent.unit;
  readonly currencyCode = this.parent.currencyCode;

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
}
