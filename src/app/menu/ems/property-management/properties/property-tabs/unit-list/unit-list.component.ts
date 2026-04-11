import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstatePropertyService } from '../../../../../../shared/services/estate-property.service';
import { EstateUnitService } from '../../../../../../shared/services/estate-unit.service';
import {
  Property,
  PropertyStatus,
  PropertyType,
  Unit,
  UnitStatus,
  UnitType,
} from '../../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';

type UnitGroup = {
  property: Property;
  units: Unit[];
};

@Component({
  selector: 'app-property-tabs-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
    NoRecordComponent,
  ],
  templateUrl: './unit-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyTabsUnitListComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(EstatePropertyService);
  private readonly unitService = inject(EstateUnitService);
  private readonly storeStore = inject(StoreStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly deleting = signal<string | null>(null);

  readonly searchFilter = signal('');
  readonly propertyFilter = signal('');
  readonly typeFilter = signal('');
  readonly statusFilter = signal('');

  readonly filterForm = this.fb.group({
    search: [''],
    propertyId: [''],
    type: [''],
    status: [''],
  });

  readonly unitTypeOptions = [
    { value: '', label: 'All Types' },
    ...Object.values(UnitType).map((value) => ({
      value,
      label: value.replace(/_/g, ' '),
    })),
  ];

  readonly statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.values(UnitStatus).map((value) => ({
      value,
      label: value.replace(/_/g, ' '),
    })),
  ];

  private readonly storeId = computed(() => this.storeStore.selectedStore()?._id || '');

  readonly propertiesResource = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) =>
      this.propertyService.getProperties(params.storeId, {
        limit: 500,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  readonly unitsResource = rxResource({
    params: () => ({
      storeId: this.storeId(),
      search: this.searchFilter(),
      propertyId: this.propertyFilter(),
      type: this.typeFilter(),
      status: this.statusFilter(),
    }),
    stream: ({ params }) =>
      this.unitService.getUnits(params.storeId, {
        limit: 500,
        search: params.search,
        propertyId: params.propertyId,
        type: params.type,
        status: params.status,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  readonly properties = computed(() => this.propertiesResource.value()?.data?.items ?? []);
  readonly units = computed(() => this.unitsResource.value()?.data?.items ?? []);

  readonly propertyOptions = computed(() => [
    { value: '', label: 'All Properties' },
    ...this.properties().map((property) => ({
      value: property._id,
      label: property.name,
    })),
  ]);

  readonly unitGroups = computed<UnitGroup[]>(() => {
    const propertyMap = new Map(this.properties().map((property) => [property._id, property]));
    const grouped = new Map<string, UnitGroup>();

    for (const unit of this.units()) {
      const propertyRef = unit.property;
      const propertyId = typeof propertyRef === 'string' ? propertyRef : propertyRef?._id;
      if (!propertyId) {
        continue;
      }

      const property =
        (typeof propertyRef === 'object' ? propertyRef : undefined) || propertyMap.get(propertyId);
      if (!property) {
        continue;
      }

      const existing = grouped.get(propertyId);
      if (existing) {
        existing.units.push(unit);
      } else {
        grouped.set(propertyId, { property, units: [unit] });
      }
    }

    return Array.from(grouped.values());
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value) => {
        this.searchFilter.set(value.search || '');
        this.propertyFilter.set(value.propertyId || '');
        this.typeFilter.set(value.type || '');
        this.statusFilter.set(value.status || '');
      });
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', propertyId: '', type: '', status: '' });
  }

  reloadData(): void {
    this.propertiesResource.reload();
    this.unitsResource.reload();
  }

  viewProperty(property: Property): void {
    this.router.navigate(['/menu/ems/properties/properties', property._id]);
  }

  viewUnit(unit: Unit): void {
    const propertyId = typeof unit.property === 'string' ? unit.property : unit.property?._id;
    if (!propertyId) {
      return;
    }

    this.router.navigate(['/menu/ems/properties/properties', propertyId, 'units', unit._id, 'view']);
  }

  addLease(unit: Unit): void {
    const propertyId = typeof unit.property === 'string' ? unit.property : unit.property?._id;
    if (!propertyId) {
      return;
    }

    this.router.navigate(['/menu/ems/leases/create'], {
      queryParams: {
        propertyId,
        unitId: unit._id,
      },
    });
  }

  getPropertyStatusClass(status: string): string {
    const map: Record<string, string> = {
      [PropertyStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [PropertyStatus.OCCUPIED]: 'bg-emerald-100 text-emerald-800',
      [PropertyStatus.INACTIVE]: 'bg-gray-100 text-gray-600',
    };

    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getUnitStatusClass(status: string): string {
    const map: Record<string, string> = {
      [UnitStatus.VACANT]: 'bg-amber-100 text-amber-800',
      [UnitStatus.OCCUPIED]: 'bg-emerald-100 text-emerald-800',
      [UnitStatus.RESERVED]: 'bg-sky-100 text-sky-800',
      [UnitStatus.INACTIVE]: 'bg-gray-100 text-gray-600',
    };

    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getPropertyImage(property: Property): string | null {
    return property.coverPhoto || property.gallery?.[0] || property.photos?.[0] || null;
  }

  getUnitImage(unit: Unit): string | null {
    return unit.coverPhoto || unit.gallery?.[0] || unit.photos?.[0] || null;
  }

  getPropertyAddress(property: Property): string {
    return [
      property.address?.street,
      property.address?.city,
      property.address?.state,
      property.address?.postalCode,
      property.address?.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  getUnitMeta(unit: Unit): string[] {
    const meta: string[] = [];

    if (unit.bedrooms != null) {
      meta.push(`${unit.bedrooms} beds`);
    }

    if (unit.bathrooms != null) {
      meta.push(`${unit.bathrooms} baths`);
    }

    if (unit.sizeValue != null) {
      meta.push(`${unit.sizeValue} ${unit.sizeUnit || 'sq.ft'}`);
    }

    return meta;
  }

  trackGroup(_index: number, group: UnitGroup): string {
    return group.property._id;
  }

  trackUnit(_index: number, unit: Unit): string {
    return unit._id;
  }

  shouldShowAddLease(unit: Unit): boolean {
    return unit.status !== UnitStatus.OCCUPIED && unit.status !== UnitStatus.INACTIVE;
  }

  deleteUnit(unit: Unit): void {
    if (!confirm(`Are you sure you want to delete unit "${unit.name}"? This action cannot be undone.`)) {
      return;
    }

    this.deleting.set(unit._id);
    this.unitService.deleteUnit(unit._id).subscribe({
      next: () => {
        this.snackBar.open(`Unit "${unit.name}" deleted successfully`, 'Close', { duration: 3000 });
        this.deleting.set(null);
        this.reloadData();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete unit';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.deleting.set(null);
      },
    });
  }
}