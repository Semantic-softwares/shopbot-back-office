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
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { TimesheetService } from '../../../../../shared/services/timesheet.service';
import { UserService } from '../../../../../shared/services/user.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from "../../../../../shared/components/no-record/no-record.component";
import { Timesheet, TimesheetFilters, TimesheetSummary } from '../../../../../shared/models';
import { CreateTimecardComponent } from '../modals/create-timecard/create-timecard.component';

@Component({
  selector: 'app-list-timecards',
  templateUrl: './list-timecards.component.html',
  styleUrls: ['./list-timecards.component.scss'],
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    ReactiveFormsModule,
    NoRecordComponent
  ],
})
export class ListTimecardsComponent {
  private timesheetService = inject(TimesheetService);
  private userService = inject(UserService);
  public storeStore = inject(StoreStore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  
  public searchTerm = signal('');
  public selectedEmployee = signal('all');
  public selectedStatus = signal('all');
  
  public displayedColumns: string[] = [
    'employee',
    'date',
    'clockIn',
    'clockOut',
    'totalHours',
    'breaks',
    'overtime',
    'status',
    'actions'
  ];

  public filterForm = this.fb.group({
    startDate: [null],
    endDate: [null],
    status: ['all'],
    employee: ['all']
  });

  public dataSource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
      filters: this.buildFilters()
    }),
    stream: ({ params }) =>
      this.timesheetService.getStoreTimesheets(params.storeId!, params.filters)
  });



 


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Timesheet>;

 

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onEmployeeChange(employee: string) {
    this.selectedEmployee.set(employee);
  }

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
  }

  private buildFilters(): TimesheetFilters {
    const formValue = this.filterForm.value;
    return {
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      status: formValue.status && formValue.status !== 'all' ? formValue.status : undefined,
      employeeId: formValue.employee && formValue.employee !== 'all' ? formValue.employee : undefined
    };
  }

  onFilterChange() {
    this.dataSource.reload();
  }

  createTimecard() {
    const dialogRef = this.dialog.open(CreateTimecardComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.reload();
      }
    });
  }

  editTimecard(timesheet: Timesheet) {
    const dialogRef = this.dialog.open(CreateTimecardComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { mode: 'edit', timesheet }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.reload();
      }
    });
  }

  approveTimecard(timesheet: Timesheet) {
    this.timesheetService.approveTimesheet(timesheet._id).subscribe({
      next: () => {
        this.snackBar.open('Timecard approved successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dataSource.reload();
      },
      error: (error) => {
        console.error('Error approving timecard:', error);
        this.snackBar.open('Error approving timecard', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  deleteTimecard(timesheet: Timesheet) {
    const employeeName = typeof timesheet.employee === 'object' 
      ? timesheet.employee.name 
      : 'Unknown Employee';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        message: `Are you sure you want to delete timecard for ${employeeName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.timesheetService.deleteTimesheet(timesheet._id).subscribe({
          next: () => {
            this.snackBar.open('Timecard deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dataSource.reload();
          },
          error: (error) => {
            console.error('Error deleting timecard:', error);
            this.snackBar.open('Error deleting timecard', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  exportTimecards(format: 'csv' | 'excel' = 'csv') {
    const storeId = this.storeStore.selectedStore()?._id;
    
    if (!storeId) {
      this.snackBar.open('No store selected', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    this.timesheetService.exportTimesheets(storeId, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timecards_${new Date().getTime()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Export completed successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Error exporting timecards:', error);
        this.snackBar.open('Error exporting timecards', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'clocked-in':
        return 'bg-blue-100 text-blue-800';
      case 'clocked-out':
        return 'bg-green-100 text-green-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
