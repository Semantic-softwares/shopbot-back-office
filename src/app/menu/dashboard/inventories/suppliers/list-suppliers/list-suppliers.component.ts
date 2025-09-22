import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { SuppliersService } from '../../../../../shared/services/suppliers.service';
import { Supplier } from '../../../../../shared/models/supplier.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap, of } from 'rxjs';

@Component({
  selector: 'app-list-suppliers',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    NoRecordComponent
  ],
  templateUrl: './list-suppliers.component.html',
  styleUrl: './list-suppliers.component.scss'
})
export class ListSuppliersComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);

  displayedColumns: string[] = ['name', 'contactInfo', 'status', 'paymentTerms', 'actions'];
  dataSource!: MatTableDataSource<Supplier>;
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public suppliers = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => {
      if (!params.storeId) {
        return of({ suppliers: [], page: 1, totalPages: 1, total: 0 });
      }
      return this.suppliersService.getSuppliers(params.storeId, 1, 1000).pipe(
        tap((response) => {
          const suppliers = response.suppliers || [];
          this.dataSource = new MatTableDataSource(suppliers);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        })
      );
    },
  });

  constructor() {}

  ngOnInit() {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog() {
    this.createSupplier();
  }

  editSupplier(id: string) {
    this.router.navigate(['/dashboard/inventory/suppliers/edit', id]);
  }

  viewSupplier(id: string) {
    this.router.navigate(['/dashboard/inventory/suppliers/details', id]);
  }

  toggleSupplierStatus(supplier: Supplier) {
    if (!supplier._id) return;
    
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    
    this.suppliersService.toggleSupplierStatus(supplier._id, storeId).subscribe({
      next: (updatedSupplier) => {
        // Update the dataSource
        const data = this.dataSource.data;
        const index = data.findIndex(s => s._id === supplier._id);
        if (index !== -1) {
          data[index] = updatedSupplier;
          this.dataSource.data = [...data];
        }
        
        this.snackBar.open('Supplier status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Error toggling supplier status:', error);
        this.snackBar.open('Failed to update supplier status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  deleteSupplier(supplier: Supplier) {
    if (!supplier._id) return;
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete supplier "${supplier.name}"?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && supplier._id) {
        const storeId = this.storeStore.selectedStore()?._id;
        if (!storeId) return;
        
        this.suppliersService.deleteSupplier(supplier._id, storeId).subscribe({
          next: () => {
            this.suppliers.reload();
            this.snackBar.open('Supplier deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          },
          error: (error) => {
            console.error('Error deleting supplier:', error);
            this.snackBar.open('Failed to delete supplier', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  createSupplier() {
    this.router.navigate(['/dashboard/inventory/suppliers/create']);
  }
}
