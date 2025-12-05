import { Component, inject, OnInit, signal } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TimesheetService } from '../../../../../../shared/services/timesheet.service';
import { UserService } from '../../../../../../shared/services/user.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { Timesheet, BreakRecord } from '../../../../../../shared/models';
import { Employee } from '../../../../../../shared/models/employee.model';
import { rxResource } from '@angular/core/rxjs-interop';

interface CreateTimecardData {
  mode: 'create' | 'edit';
  timesheet?: Timesheet;
}

// Custom validator to ensure clock-in time is before clock-out time
function clockTimeValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const clockInTime = control.get('clockInTime')?.value;
    const clockOutTime = control.get('clockOutTime')?.value;
    
    if (!clockInTime || !clockOutTime) {
      return null; // Don't validate if either is empty
    }
    
    const clockIn = new Date(clockInTime);
    const clockOut = new Date(clockOutTime);
    
    if (clockIn >= clockOut) {
      return { invalidTimeRange: true };
    }
    
    return null;
  };
}

// Custom validator to ensure break start time is before end time
function breakTimeValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const breakStart = control.get('breakStart')?.value;
    const breakEnd = control.get('breakEnd')?.value;
    
    if (!breakStart || !breakEnd) {
      return null; // Don't validate if either is empty
    }
    
    const start = new Date(breakStart);
    const end = new Date(breakEnd);
    
    if (start >= end) {
      return { invalidBreakTimeRange: true };
    }
    
    return null;
  };
}

@Component({
  selector: 'app-create-timecard',
  templateUrl: './create-timecard.component.html',
  styleUrls: ['./create-timecard.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule
]
})
export class CreateTimecardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private timesheetService = inject(TimesheetService);
  private userService = inject(UserService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateTimecardComponent>);
  public data = inject<CreateTimecardData>(MAT_DIALOG_DATA);

  public isLoading = signal(false);
  public isEdit = false;
  public timecardForm!: FormGroup;

  public employees = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.userService.getStoreMerchants(params.storeId!)
  });

  public breakTypes = [
    { value: 'lunch', label: 'Lunch Break' },
    { value: 'short', label: 'Short Break' },
    { value: 'other', label: 'Other' }
  ];

  public statusOptions = [
    { value: 'clocked-in', label: 'Clocked In' },
    { value: 'clocked-out', label: 'Clocked Out' },
    { value: 'incomplete', label: 'Incomplete' }
  ];

  ngOnInit() {
    this.isEdit = this.data?.mode === 'edit';
    this.initForm();
    
    if (this.isEdit && this.data.timesheet) {
      this.populateForm(this.data.timesheet);
    }
  }

  private initForm() {
    this.timecardForm = this.fb.group({
      staff: ['', Validators.required],
      clockInTime: ['', Validators.required],
      clockOutTime: [''],
      breaks: this.fb.array([]),
      status: ['clocked-out', Validators.required],
      notes: [''],
      store: [this.storeStore.selectedStore()?._id]
    }, { validators: clockTimeValidator() });
  }

  // Helper method to format date for datetime-local input
  private formatDateForInput(dateString: string | Date | undefined): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  get breaksArray(): FormArray {
    return this.timecardForm.get('breaks') as FormArray;
  }

  private populateForm(timesheet: Timesheet) {
    this.timecardForm.patchValue({
      staff: typeof timesheet.employee === 'object' ? timesheet.employee._id : timesheet.employee,
      clockInTime: this.formatDateForInput(timesheet.clockInTime),
      clockOutTime: this.formatDateForInput(timesheet.clockOutTime),
      status: timesheet.status,
      notes: timesheet.notes,
      store: typeof timesheet.store === 'object' ? timesheet.store._id : timesheet.store
    });

    // Populate breaks
    if (timesheet.breaks && timesheet.breaks.length > 0) {
      timesheet.breaks.forEach(breakRecord => {
        this.addBreak(breakRecord);
      });
    }
  }

  addBreak(existingBreak?: BreakRecord) {
    const breakGroup = this.fb.group({
      breakType: [existingBreak?.breakType || 'short', Validators.required],
      breakStart: [existingBreak?.breakStart ? this.formatDateForInput(existingBreak.breakStart) : '', Validators.required],
      breakEnd: [existingBreak?.breakEnd ? this.formatDateForInput(existingBreak.breakEnd) : ''],
      notes: [existingBreak?.notes || '']
    }, { validators: breakTimeValidator() });

    this.breaksArray.push(breakGroup);
  }

  removeBreak(index: number) {
    this.breaksArray.removeAt(index);
  }

  onSubmit() {
    if (!this.timecardForm.valid) {
      this.markFormGroupTouched(this.timecardForm);
      return;
    }

    this.isLoading.set(true);
    const formValue = this.timecardForm.value;
    
    // Process breaks - calculate duration and clean up
    if (formValue.breaks && formValue.breaks.length > 0) {
      formValue.breaks = formValue.breaks.map((breakItem: any) => {
        const processedBreak = { ...breakItem };
        
        // Calculate duration if both start and end times are provided
        if (processedBreak.breakStart && processedBreak.breakEnd) {
          const start = new Date(processedBreak.breakStart);
          const end = new Date(processedBreak.breakEnd);
          processedBreak.breakDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes
        } else {
          processedBreak.breakDuration = 0;
        }
        
        // Convert datetime-local strings to ISO strings for backend
        if (processedBreak.breakStart) {
          processedBreak.breakStart = new Date(processedBreak.breakStart).toISOString();
        }
        if (processedBreak.breakEnd) {
          processedBreak.breakEnd = new Date(processedBreak.breakEnd).toISOString();
        }
        
        return processedBreak;
      });
    }

    if (this.isEdit && this.data.timesheet) {
      this.updateTimecard(formValue);
    } else {
      this.createTimecard(formValue);
    }
  }

  private createTimecard(formValue: any) {
    // For admin timecard creation using the clock-in endpoint
    const storeId = this.storeStore.selectedStore()?._id;
    
    if (!storeId) {
      this.snackBar.open('No store selected', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      this.isLoading.set(false);
      return;
    }

    if (!formValue.staff) {
      this.snackBar.open('Employee selection is required', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      this.isLoading.set(false);
      return;
    }

    // Prepare complete clock-in data including all form fields
    const clockInDate = formValue.clockInTime ? new Date(formValue.clockInTime) : new Date();
    const clockInData = {
      staff: formValue.staff,
      store: storeId,
      clockInTime: clockInDate.toISOString(),
      clockOutTime: formValue.clockOutTime ? new Date(formValue.clockOutTime).toISOString() : undefined,
      date: clockInDate.toISOString().split('T')[0], // YYYY-MM-DD format
      status: formValue.status || (formValue.clockOutTime ? 'clocked-out' : 'clocked-in'),
      notes: formValue.notes || '',
      breaks: formValue.breaks || []
    };

    // Create timesheet with complete data in a single API call
    this.timesheetService.clockIn(clockInData).subscribe({
      next: (newTimesheet) => {
        this.snackBar.open('Timecard created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dialogRef.close(newTimesheet);
      },
      error: (error) => {
        console.error('Error creating timecard:', error);
        const errorMessage = error.status === 401
          ? 'Unauthorized: Please check your permissions.'
          : error.status === 400
          ? 'Bad request: Invalid data provided.'
          : error.status === 409
          ? 'Employee already has an active timecard.'
          : 'Error creating timecard';
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isLoading.set(false);
      }
    });
  }

  private updateTimecard(formValue: any) {
    this.timesheetService.updateTimesheet(this.data.timesheet!._id, formValue).subscribe({
      next: (result) => {
        this.snackBar.open('Timecard updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error updating timecard:', error);
        this.snackBar.open('Error updating timecard', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isLoading.set(false);
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    if (formGroup instanceof FormGroup) {
      Object.keys(formGroup.controls).forEach(key => {
        const control = formGroup.get(key);
        if (control) {
          control.markAsTouched();
          if (control instanceof FormGroup || control instanceof FormArray) {
            this.markFormGroupTouched(control);
          }
        }
      });
    } else if (formGroup instanceof FormArray) {
      formGroup.controls.forEach(control => {
        control.markAsTouched();
        if (control instanceof FormGroup || control instanceof FormArray) {
          this.markFormGroupTouched(control);
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.timecardForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    
    // Check for form-level validation errors
    if (this.timecardForm.hasError('invalidTimeRange')) {
      if (fieldName === 'clockInTime' || fieldName === 'clockOutTime') {
        return 'Clock-in time must be before clock-out time';
      }
    }
    
    return '';
  }
}
