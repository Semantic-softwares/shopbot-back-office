import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstateUnitService } from '../../../../../../../../shared/services/estate-unit.service';
import { Unit, UnitType, UnitStatus, Property } from '../../../../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderComponent,
    NoRecordComponent,
  ],
  templateUrl: './unit-list.component.html',
})
export class UnitListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private unitService = inject(EstateUnitService);
  private storeStore = inject(StoreStore);

  /** Property ID from ancestor route param :id */
  private propertyId = signal<string>('');

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  searchFilter = signal<string>('');
  typeFilter = signal<string>('');
  statusFilter = signal<string>('');
  isUpdating = signal<boolean>(false);

  filterForm = this.fb.group({
    search: [''],
    type: [''],
    status: [''],
  });

  displayedColumns = ['name', 'property', 'type', 'rent', 'status', 'actions'];

  typeOptions = [
    { value: '', label: 'All Types' },
    ...Object.values(UnitType).map((t) => ({
      value: t,
      label: t.replace(/_/g, ' '),
    })),
  ];

  statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.values(UnitStatus).map((s) => ({
      value: s,
      label: s.replace(/_/g, ' '),
    })),
  ];

  private filterParams = computed(() => ({
    storeId: this.storeStore.selectedStore()?._id || '',
    propertyId: this.propertyId(),
    search: this.searchFilter(),
    type: this.typeFilter(),
    status: this.statusFilter(),
    page: this.currentPage(),
    limit: this.pageSize(),
  }));

  units = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) =>
      this.unitService.getUnits(params.storeId, {
        propertyId: params.propertyId,
        search: params.search,
        type: params.type,
        status: params.status,
        page: params.page,
        limit: params.limit,
      }),
  });

  unitSummary = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id || '',
      propertyId: this.propertyId(),
    }),
    stream: ({ params }) =>
      this.unitService.getUnitSummary(params.storeId, params.propertyId),
  });

  totalUnits = computed(
    () => this.units.value()?.data?.meta?.totalItems ?? 0,
  );
  vacantCount = computed(
    () => this.unitSummary.value()?.data?.vacant ?? 0,
  );
  occupiedCount = computed(
    () => this.unitSummary.value()?.data?.occupied ?? 0,
  );
  reservedCount = computed(
    () => this.unitSummary.value()?.data?.reserved ?? 0,
  );

  constructor() {
    // Resolve property ID from ancestor route (properties/:id)
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const id = r.snapshot.paramMap.get('id');
      if (id) {
        this.propertyId.set(id);
        break;
      }
      r = r.parent;
    }

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((values) => {
        this.currentPage.set(1);
        this.searchFilter.set(values.search || '');
        this.typeFilter.set(values.type || '');
        this.statusFilter.set(values.status || '');
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', type: '', status: '' });
  }

  reloadData(): void {
    this.units.reload();
    this.unitSummary.reload();
  }

  createUnit(): void {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  viewUnit(unit: Unit): void {
    this.router.navigate(['../', unit._id, 'view'], {
      relativeTo: this.route,
    });
  }

  editUnit(unit: Unit): void {
    this.router.navigate(['../', unit._id, 'edit'], {
      relativeTo: this.route,
    });
  }

  async deleteUnit(unit: Unit): Promise<void> {
    const confirmDelete = confirm(
      `Delete unit "${unit.name}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    this.isUpdating.set(true);
    try {
      await this.unitService.deleteUnit(unit._id).toPromise();
      this.snackBar.open(`Unit "${unit.name}" deleted`, 'Close', {
        duration: 3000,
      });
      this.reloadData();
    } catch {
      this.snackBar.open('Failed to delete unit', 'Close', { duration: 5000 });
    } finally {
      this.isUpdating.set(false);
    }
  }

  getPropertyName(unit: Unit): string {
    if (typeof unit.property === 'string') return unit.property;
    return (unit.property as Property)?.name ?? '—';
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
