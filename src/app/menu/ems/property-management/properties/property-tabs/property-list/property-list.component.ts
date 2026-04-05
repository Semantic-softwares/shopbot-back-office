import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstatePropertyService } from '../../../../../../shared/services/estate-property.service';
import { Property, PropertyType, PropertyStatus } from '../../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-property-list',
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    NoRecordComponent,
  ],
  templateUrl: './property-list.component.html',
})
export class PropertyListComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private propertyService = inject(EstatePropertyService);
  private storeStore = inject(StoreStore);

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

  displayedColumns = ['name', 'type', 'location', 'units', 'status', 'actions'];

  typeOptions = [
    { value: '', label: 'All Types' },
    ...Object.values(PropertyType).map((t) => ({
      value: t,
      label: t.replace(/_/g, ' '),
    })),
  ];

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: PropertyStatus.ACTIVE, label: 'Active' },
    { value: PropertyStatus.OCCUPIED, label: 'Occupied' },
    { value: PropertyStatus.INACTIVE, label: 'Inactive' },
  ];

  private filterParams = computed(() => ({
    storeId: this.storeStore.selectedStore()?._id || '',
    search: this.searchFilter(),
    type: this.typeFilter(),
    status: this.statusFilter(),
    page: this.currentPage(),
    limit: this.pageSize(),
  }));

  properties = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) =>
      this.propertyService.getProperties(params.storeId, {
        search: params.search,
        type: params.type,
        status: params.status,
        page: params.page,
        limit: params.limit,
      }),
  });

  propertySummary = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) =>
      this.propertyService.getPropertySummary(params.storeId),
  });

  totalProperties = computed(
    () => this.properties.value()?.data?.meta?.totalItems ?? 0,
  );
  activeCount = computed(
    () => this.propertySummary.value()?.data?.active ?? 0,
  );
  inactiveCount = computed(
    () => this.propertySummary.value()?.data?.inactive ?? 0,
  );

  constructor() {
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
    this.properties.reload();
    this.propertySummary.reload();
  }

  createProperty(): void {
    this.router.navigate(['/menu/ems/properties/properties/create']);
  }

  viewProperty(property: Property): void {
    this.router.navigate(['/menu/ems/properties/properties', property._id]);
  }

  viewUnits(property: Property): void {
    this.router.navigate(['/menu/ems/properties/properties', property._id, 'units']);
  }

  editProperty(property: Property): void {
    this.router.navigate(['/menu/ems/properties/properties', property._id, 'edit']);
  }

  async deleteProperty(property: Property): Promise<void> {
    const confirmDelete = confirm(
      `Delete property "${property.name}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    this.isUpdating.set(true);
    try {
      await this.propertyService.deleteProperty(property._id).toPromise();
      this.snackBar.open(`Property "${property.name}" deleted`, 'Close', {
        duration: 3000,
      });
      this.reloadData();
    } catch {
      this.snackBar.open('Failed to delete property', 'Close', {
        duration: 5000,
      });
    } finally {
      this.isUpdating.set(false);
    }
  }

  getStatusClass(status: string): string {
    if (status === PropertyStatus.ACTIVE) {
      return 'bg-green-600! text-white!';
    }

    if (status === PropertyStatus.OCCUPIED) {
      return 'bg-emerald-600! text-white!';
    }

    return 'bg-gray-500! text-white!';
  }

  getLocationString(property: Property): string {
    const addr = property.address;
    if (!addr) return '—';
    return [addr.city, addr.state, addr.country].filter(Boolean).join(', ');
  }
}
