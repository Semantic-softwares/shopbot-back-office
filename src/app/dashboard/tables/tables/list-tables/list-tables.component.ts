import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableService } from '../../../../shared/services/table.service';
import { TableCategoryService } from '../../../../shared/services/table-category.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from "../../../../shared/components/no-record/no-record.component";
import { Table } from '../../../../shared/models';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateTableComponent } from '../modals/create-table/create-table.component';

@Component({
  selector: 'app-list-tables',
  templateUrl: './list-tables.component.html',
  styleUrls: ['./list-tables.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    NoRecordComponent
  ],
})
export class ListTablesComponent {
  private tableService = inject(TableService);
  private tableCategoryService = inject(TableCategoryService);
  public storeStore = inject(StoreStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  public searchTerm = signal('');
  public selectedCategory = signal('all');
  public displayedColumns: string[] = [
    'name',
    'category',
    'numberOfGuest',
    'order',
    'active',
    'actions'
  ];

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.tableService.getStoreTables(params.storeId!)
  });

  public categories = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.tableCategoryService.getStoreTableCategories(params.storeId!)
  });

  public filteredTables = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const categoryId = this.selectedCategory();
    
    return this.dataSource.value()?.filter((table: Table) => {
      const matchesSearch = table.name.toLowerCase().includes(term);
      const matchesCategory = categoryId === 'all' || table?.category?._id === categoryId;
      return matchesSearch && matchesCategory;
    }) ?? [];
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Table>;

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onCategoryChange(category: string) {
    this.selectedCategory.set(category);
  }

  addTable() {
    const dialogRef = this.dialog.open(CreateTableComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.reload();
      }
    });
  }

  editTable(table: Table) {
    const dialogRef = this.dialog.open(CreateTableComponent, {
      width: '500px',
      data: { mode: 'edit', table }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.reload();
      }
    });
  }

  deleteTable(table: Table) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        message: `Are you sure you want to delete ${table.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.tableService.deleteTable(table._id).subscribe({
          next: () => {
            this.snackBar.open('Table deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dataSource.reload();
          },
          error: (error) => {
            console.error('Error deleting table:', error);
            this.snackBar.open('Error deleting table', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  toggleTableStatus(table: Table) {
    const updatedTable = { active: !table.active };
    this.tableService.updateTable(table._id, updatedTable).subscribe({
      next: () => {
        this.snackBar.open('Table status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dataSource.reload();
      },
      error: () => {
        this.snackBar.open('Error updating table status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
