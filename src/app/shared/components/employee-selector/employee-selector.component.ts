import {
  Component,
  signal,
  output,
  inject,
  computed,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl } from '@angular/forms';
import { StoreStore } from '../../stores/store.store';
import { QueryParamService } from '../../services/query-param.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-employee-selector',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>All employees</mat-label>
      <mat-select
        [value]="selectedEmployee()"
        (selectionChange)="onSelectionChange($event.value)"
        >
        <mat-option value="all">All employees</mat-option>
        @for (employee of employees(); track employee._id) {
          <mat-option [value]="employee._id">
            {{ employee.name }}@if (employee.deactivated) { (deactivated)}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
    `,
})
export class EmployeeSelectorComponent implements OnInit {
  public queryParamsService = inject(QueryParamService);
  public storeStore = inject(StoreStore);
  private userService = inject(UserService);

  public selectedEmployee = signal<string>(this.queryParamsService.getAllParamsSnapshot['employee'] || 'all');
  public selectionChange = output<string>();
  public employeeForm = new FormGroup({
    employee: new FormControl<string | null>(this.selectedEmployee()),
  });

  // Store.staffs[] is the pre-membership list and now only holds bare ids,
  // so the team comes from memberships — the same source as Team settings.
  private team = rxResource({
    params: () => this.storeStore.selectedStore()?._id,
    stream: ({ params: storeId }) => this.userService.getTeamForStore(storeId),
  });

  // Invited people haven't joined, so they can't have sales. Deactivated
  // staff stay listed — their past sales still need to be filterable.
  protected readonly employees = computed(() =>
    (this.team.hasValue() ? this.team.value() : [])
      .filter((member) => member.status !== 'INVITED' && !!member.merchant?._id)
      .map((member) => ({
        _id: member.merchant._id,
        name: member.merchant.name || member.merchant.email,
        deactivated: member.status === 'SUSPENDED',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  public onSelectionChange(value: string): void {
    this.selectedEmployee.set(value);
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
