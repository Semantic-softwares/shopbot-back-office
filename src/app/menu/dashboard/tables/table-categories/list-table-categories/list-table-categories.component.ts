import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableCategoryService } from '../../../../../shared/services/table-category.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from "../../../../../shared/components/no-record/no-record.component";
import { TableCategory } from '../../../../../shared/models';
import { CreateTableCategoryComponent } from '../modals/create-table-category/create-table-category.component';

@Component({
  selector: 'app-list-table-categories',
  templateUrl: './list-table-categories.component.html',
  styleUrls: ['./list-table-categories.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    NoRecordComponent
  ]
})
export class ListTableCategoriesComponent {
  private tableCategoryService = inject(TableCategoryService);
  public storeStore = inject(StoreStore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  public searchTerm = signal('');
  public displayedColumns: string[] = [
    'name',
    'tables',
    'active',
    'actions'
  ];

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.tableCategoryService.getStoreTableCategories(params.storeId!)
  });

  public filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase();
    
    return this.dataSource.value()?.filter((category: TableCategory) => {
      return category.name.toLowerCase().includes(term);
    }) ?? [];
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<TableCategory>;

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  addCategory() {
    const dialogRef = this.dialog.open(CreateTableCategoryComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.reload();
      }
    });
  }

  editCategory(category: TableCategory) {
    const dialogRef = this.dialog.open(CreateTableCategoryComponent, {
      width: '500px',
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.reload();
      }
    });
  }

  deleteCategory(category: TableCategory) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        message: `Are you sure you want to delete ${category.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.tableCategoryService.deleteTableCategory(category._id).subscribe({
          next: () => {
            this.snackBar.open('Table category deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dataSource.reload();
          },
          error: (error) => {
            console.error('Error deleting table category:', error);
            this.snackBar.open('Error deleting table category', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  toggleCategoryStatus(category: TableCategory) {
    const updatedCategory = { active: !category.active };
    this.tableCategoryService.updateTableCategory(category._id, updatedCategory).subscribe({
      next: () => {
        this.snackBar.open('Table category status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dataSource.reload();
      },
      error: () => {
        this.snackBar.open('Error updating table category status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
