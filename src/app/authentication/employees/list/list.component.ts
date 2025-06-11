import { Component, ViewChild, OnInit, inject, resource } from '@angular/core';
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
import { EmployeeDialogComponent } from '../employee-dialog/employee-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StoreStore } from '../../../shared/stores/store.store';
import { UserService } from '../../../shared/services/user.service';
import { Employee } from '../../../shared/models/employee.model';

@Component({
  selector: 'app-list-employees',
  templateUrl: './list.component.html',
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
export class EmployeeListComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);  
  public storeStore = inject(StoreStore);
  displayedColumns: string[] = ['name', 'gender', 'email', 'phoneNumber', 'role', 'actions'];
  dataSource!: MatTableDataSource<Employee>;
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public employees = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) =>
      this.userService.getStoreMerchants(params.storeId!).pipe(
        tap((employees) => {
          this.dataSource = new MatTableDataSource(employees);
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
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '800px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implement create employee logic
        this.employees.reload();
      }
    });
  }

  editEmployee(employee: Employee) {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '800px',
      data: { isEdit: true, employee }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implement update employee logic
        this.employees.reload();
      }
    });
  }

  deleteEmployee(employee: Employee) {
    if (employee.role === 'Owner') {
      this.snackBar.open('Cannot delete an owner', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete ${employee.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteMerchant(employee._id!).subscribe({
          next: () => {
            this.snackBar.open('Employee deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.employees.reload();
          },
          error: () => {
            this.snackBar.open('Error deleting employee', 'Close', {
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
