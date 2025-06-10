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
import { OptionDialogComponent } from './option-dialog/option-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OptionItem } from '../../../shared/models';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
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
export class OptionsComponent {
  displayedColumns: string[] = ['name', 'price', 'inStock', 'actions'];
  dataSource!: MatTableDataSource<any>;
  searchText: string = '';
  
  private dialog = inject(MatDialog);
  private productService = inject(ProductService);
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public options = rxResource({
    request: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    loader: ({ request }) =>
      this.productService.getStoreOptions(request.storeId!).pipe(
        tap((options) => {
          this.dataSource = new MatTableDataSource(options);
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
    const dialogRef = this.dialog.open(OptionDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.options.reload();
      }
    });
  }

  editOption(option: OptionItem) {
    const dialogRef = this.dialog.open(OptionDialogComponent, {
      width: '500px',
      data: { isEdit: true, option }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.options.reload();
      }
    });
  }

  deleteOption(option: OptionItem) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete ${option.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteOptionItem(option._id).subscribe({
          next: () => {
            this.options.reload();
          }
        });
      }
    });
  }

  toggleInStock(option: OptionItem) {
    const updatedOption = { ...option, inStock: !option.inStock };
    this.productService.updateOption(updatedOption, option._id).subscribe({
      next: () => {
        this.snackBar.open('Option status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.options.reload();
      },
      error: () => {
        this.snackBar.open('Error updating option status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
