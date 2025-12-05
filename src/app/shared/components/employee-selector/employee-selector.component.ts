import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  signal,
  output,
  inject,
  OnInit,
} from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { StoreStore } from '../../stores/store.store';
import { QueryParamService } from '../../services/query-param.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-employee-selector',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>All employees</mat-label>
      <mat-select
        [(value)]="selectedEmployee"
        (selectionChange)="onSelectionChange($event.value)"
        >
        <mat-option value="all">All employees</mat-option>
        @for (emp of storeStore.selectedStore()?.staffs; track emp) {
          <mat-option
            [value]="emp._id"
            >
            {{ emp.name }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
    `,
})
export class EmployeeSelectorComponent implements OnInit {
  public queryParamsService = inject(QueryParamService);
  public storeStore = inject(StoreStore); // Adjust the type as per your store implementation
  public selectedEmployee = signal<string>('all');
  public selectionChange = output<string>();
  public employeeForm = new FormGroup({
    employee: new FormControl<string | null>(this.selectedEmployee()),
  });

  public onSelectionChange(value: string): void {
    this.selectionChange.emit(value);
    this.employeeForm.patchValue({ employee: value });
  }

  ngOnInit() {
    this.employeeForm.valueChanges.subscribe((value) => {
      this.queryParamsService.add({ employee: value.employee });
    });

    setTimeout(() => {
      this.employeeForm.patchValue(
        {
          employee: this.selectedEmployee(),
        },
        { emitEvent: true }
      );
    }, 100);
  }
}
