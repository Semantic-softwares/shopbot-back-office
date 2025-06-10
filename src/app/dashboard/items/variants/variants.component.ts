import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { ProductService } from '../../../shared/services/product.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { VariantDialogComponent } from './variant-dialog/variant-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Option } from '../../../shared/models';

@Component({
  selector: 'app-variants',
  templateUrl: './variants.component.html',
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
    NoRecordComponent,
    FormsModule,
    MatSlideToggleModule
  ]
})
export class VariantsComponent {
  displayedColumns: string[] = ['name', 'atLeast', 'atMost', 'published', 'actions'];
  dataSource!: MatTableDataSource<any>;
  searchText: string = '';
  
  private dialog = inject(MatDialog);
  private productService = inject(ProductService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public variants = rxResource({
    request: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    loader: ({ request }) =>
      this.productService.getStoreGroupOption(request.storeId!).pipe(
        tap((variants) => {
          this.dataSource = new MatTableDataSource(variants);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        })
      ),
  });

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog() {
    const dialogRef = this.dialog.open(VariantDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.variants.reload();
      }
    });
  }

  editVariant(variant: any) {
    const dialogRef = this.dialog.open(VariantDialogComponent, {
      width: '500px',
      data: { 
        isEdit: true,
        variant: variant
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.variants.reload();
      }
    });
  }

  deleteVariant(variant: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete ${variant.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteVariant(variant._id).subscribe({
          next: () => {
            this.variants.reload();
          }
        });
      }
    });
  }

  togglePublished(variant: Option) {
    const updatedVariant = { ...variant, enabled: !variant.enabled };
    this.productService.updateVariant(updatedVariant, variant._id).subscribe({
      next: () => {
        this.snackBar.open('Variant status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.variants.reload();
      },
      error: () => {
        this.snackBar.open('Error updating variant status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
