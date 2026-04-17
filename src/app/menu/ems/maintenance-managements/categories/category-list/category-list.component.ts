import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MaintenanceCategoryCreateDialogComponent } from '../../../../../shared/components/maintenance-category-create-dialog/maintenance-category-create-dialog.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceCategoryService } from '../../../../../shared/services/maintenance-category.service';
import { MaintenanceCategoryItem } from '../../../../../shared/models/maintenance-vendor.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeaderComponent,
    NoRecordComponent,
    DatePipe,
  ],
  templateUrl: './category-list.component.html',
})
export class CategoryListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private categoryService = inject(MaintenanceCategoryService);
  private storeStore = inject(StoreStore);

  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  searchFilter = signal<string>('');

  filterForm = this.fb.group({
    search: [''],
  });

  displayedColumns = ['name', 'description', 'icon', 'status', 'createdAt', 'actions'];

  private filterParams = computed(() => ({
    storeId: this.storeStore.selectedStore()?._id ?? '',
    search: this.searchFilter(),
    page: this.currentPage(),
    limit: this.pageSize(),
  }));

  categoriesResource = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) => {
      if (!params.storeId) return of(undefined);
      return this.categoryService.getAll(params.storeId, {
        search: params.search,
        page: params.page,
        limit: params.limit,
      });
    },
  });

  categories = computed<MaintenanceCategoryItem[]>(
    () => this.categoriesResource.value()?.data?.items ?? [],
  );

  pagination = computed(
    () =>
      this.categoriesResource.value()?.data?.meta ?? {
        totalItems: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
  );

  constructor() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((values) => {
        this.currentPage.set(1);
        this.searchFilter.set(values.search || '');
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  goToCreate(): void {
    const ref = this.dialog.open(MaintenanceCategoryCreateDialogComponent, {
      width: '480px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.categoriesResource.reload();
    });
  }

  goToEdit(category: MaintenanceCategoryItem): void {
    this.router.navigate([category._id, 'edit'], { relativeTo: this.route });
  }

  onDelete(category: MaintenanceCategoryItem): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete category "${category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.categoryService.delete(storeId, category._id).subscribe({
        next: () => {
          this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
          this.categoriesResource.reload();
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to delete category';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
    });
  }
}
