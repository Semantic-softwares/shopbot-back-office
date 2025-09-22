import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PermissionService } from '../../../../shared/services/permission.service';
import { CreatePermissionCategoryComponent } from '../modals/create-permission-category/create-permission-category.component';
import { PermissionCategory } from '../../../../../shared/models/permission.model';
import { CdkColumnDef } from '@angular/cdk/table';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatInputModule,
  ],
  templateUrl: './categories.component.html',
  providers:[CdkColumnDef]
})
export class CategoriesComponent {
  private permissionService = inject(PermissionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  public categories = rxResource({
    loader: () => this.permissionService.getPermissionCategories()
  });

  displayedColumns: string[] = ['name', 'description', 'actions'];
  searchTerm = signal('');

  public filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.categories.value()?.filter(category => 
      category.name.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    ) || [];
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onCreate() {
    const dialogRef = this.dialog.open(CreatePermissionCategoryComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories.reload();
      }
    });
  }

  onDelete(category: PermissionCategory) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "${category.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.permissionService.deletePermissionCategory(category._id!)
          .subscribe({
            next: () => {
              this.categories.reload();
              this.snackBar.open('Category deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
            },
            error: () => {
              this.snackBar.open('Failed to delete category', 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
      }
    });
  }

  onEdit(category: PermissionCategory) {
    const dialogRef = this.dialog.open(CreatePermissionCategoryComponent, {
      width: '500px',
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories.reload();
      }
    });
  }
}
