import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoRecordComponent } from '../../../shared/components/no-record/no-record.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StoreStore } from '../../../shared/stores/store.store';
import { CustomerService } from '../../../shared/services/customer.service';
import { User } from '../../../shared/models';
import { CustomerDialogComponent } from '../modals/customer-dialog.component';

@Component({
  selector: 'app-list-customers',
  templateUrl: './customer-list.component.html',
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
    MatDialogModule,
    MatSnackBarModule,
    FormsModule
  ]
})
export class CustomerListComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private customerService = inject(CustomerService);  
  public storeStore = inject(StoreStore);
  displayedColumns: string[] = ['name',  'email', 'phoneNumber', 'totalAmountSpent', 'totalOrders', 'avgAmountSpent', 'country', 'actions'];
  dataSource!: MatTableDataSource<User>;
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public customers = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) =>
      this.customerService.getStoreCustomers(params.storeId!).pipe(
        tap((customers) => {
          this.dataSource = new MatTableDataSource(customers);
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
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '800px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customers.reload();
      }
    });
  }

  editCustomer(customer: User) {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '800px',
      data: { isEdit: true, customer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implement update customer logic
        this.customers.reload();
      }
    });
  }

  deleteCustomer(customer: User) {
    if (customer.role === 'Owner') {
      this.snackBar.open('Cannot delete an owner', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete ${customer.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.deleteCustomer(customer._id!).subscribe({
          next: () => {
            this.snackBar.open('Customer deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.customers.reload();
          },
          error: () => {
            this.snackBar.open('Error deleting customer', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }
}
