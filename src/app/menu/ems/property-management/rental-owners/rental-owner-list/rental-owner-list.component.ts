import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { RentalOwnerService } from '../../../../../shared/services/rental-owner.service';
import { RentalOwner, RentalOwnerStatus } from '../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-rental-owner-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  templateUrl: './rental-owner-list.component.html',
})
export class RentalOwnerListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private rentalOwnerService = inject(RentalOwnerService);
  private storeStore = inject(StoreStore);

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  searchFilter = signal<string>('');
  statusFilter = signal<string>('');
  isUpdating = signal<boolean>(false);

  filterForm = this.fb.group({
    search: [''],
    status: [''],
  });

  displayedColumns = ['name', 'contact', 'company', 'status', 'actions'];

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: RentalOwnerStatus.ACTIVE, label: 'Active' },
    { value: RentalOwnerStatus.INACTIVE, label: 'Inactive' },
  ];

  private filterParams = computed(() => ({
    storeId: this.storeStore.selectedStore()?._id || '',
    search: this.searchFilter(),
    status: this.statusFilter(),
    page: this.currentPage(),
    limit: this.pageSize(),
  }));

  rentalOwners = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) =>
      this.rentalOwnerService.getRentalOwners(params.storeId, {
        search: params.search,
        status: params.status,
        page: params.page,
        limit: params.limit,
      }),
  });

  ownerSummary = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) =>
      this.rentalOwnerService.getRentalOwnerSummary(params.storeId),
  });

  totalOwners = computed(
    () => this.rentalOwners.value()?.data?.meta?.totalItems ?? 0,
  );
  activeCount = computed(
    () => this.ownerSummary.value()?.data?.active ?? 0,
  );
  inactiveCount = computed(
    () => this.ownerSummary.value()?.data?.inactive ?? 0,
  );

  constructor() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((values) => {
        this.currentPage.set(1);
        this.searchFilter.set(values.search || '');
        this.statusFilter.set(values.status || '');
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '' });
  }

  reloadData(): void {
    this.rentalOwners.reload();
    this.ownerSummary.reload();
  }

  createOwner(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  viewOwner(owner: RentalOwner): void {
    this.router.navigate([owner._id], { relativeTo: this.route });
  }

  editOwner(owner: RentalOwner): void {
    this.router.navigate([owner._id, 'edit'], { relativeTo: this.route });
  }

  async deleteOwner(owner: RentalOwner): Promise<void> {
    const confirmDelete = confirm(
      `Delete rental owner "${owner.firstName} ${owner.lastName}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    this.isUpdating.set(true);
    try {
      await this.rentalOwnerService.deleteRentalOwner(owner._id).toPromise();
      this.snackBar.open(`Rental owner deleted`, 'Close', { duration: 3000 });
      this.reloadData();
    } catch {
      this.snackBar.open('Failed to delete rental owner', 'Close', { duration: 5000 });
    } finally {
      this.isUpdating.set(false);
    }
  }

  getDisplayName(owner: RentalOwner): string {
    if (owner.isCompany && owner.companyName) {
      return owner.companyName;
    }
    return `${owner.firstName} ${owner.lastName}`;
  }

  getStatusClass(status: string): string {
    return status === RentalOwnerStatus.ACTIVE
      ? 'bg-green-600! text-white!'
      : 'bg-gray-500! text-white!';
  }
}
