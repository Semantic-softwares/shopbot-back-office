import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../shared/services/category.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Category } from '../../../../shared/models';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NoRecordComponent,
    FormsModule,
    DragDropModule,
    PageHeaderComponent
]
})
export class CategoriesComponent {
  displayedColumns: string[] = ['drag', 'name', 'color', 'icon', 'items', 'actions'];
  dataSource!: MatTableDataSource<any>;
  searchText: string = '';
  private dialog: MatDialog = inject(MatDialog);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  public categories = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.categoryService.getStoreMenus(params.storeId!).pipe(
        tap((categories) => {
          this.dataSource = new MatTableDataSource(categories);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        })
      ),
  });

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addCategory() {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories.reload();
        // Handle create logic here
      }
    });
  }

  onEditCategory(category: any) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { 
        isEdit: true,
        category: category
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
       this.categories.reload();
      }
    });
  }

  deleteCategory(category: Category) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete ${category.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Category to delete:', category);
        // Handle delete logic here
        this.categoryService.deleteMenu(category._id!).subscribe({
          next: () => {
            console.log('Category deleted successfully');
            // Optionally, refresh the categories list
            this.categories.reload();
          }
        });
      }
    });
  }

  reloadCategories() {
    this.categories.reload();
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Get the current data source
    const items = this.dataSource.data;
    const draggedItem = items[event.previousIndex];

    // Move item in array
    items.splice(event.previousIndex, 1);
    items.splice(event.currentIndex, 0, draggedItem);

    // Update dataSource immediately for instant UI feedback
    this.dataSource.data = [...items];

    // Update positions for all items
    const updateRequests = items.map((item, index) => {
      item.position = index;
      return this.categoryService.updateMenu(item._id!, { position: index });
    });

    // Execute all update requests concurrently
    if (updateRequests.length > 0) {
      forkJoin(updateRequests).subscribe({
        next: () => {
          this.snackBar.open('Categories sorted successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to sort categories', 'Close', { duration: 3000 });
          // Reload to reset
          this.categories.reload();
        }
      });
    }
  }
}
