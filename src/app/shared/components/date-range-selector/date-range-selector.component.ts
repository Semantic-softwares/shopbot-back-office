import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { QueryParamService } from '../../services/query-param.service';

@Component({
  selector: 'date-range-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
  ],

  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>Date Range</mat-label>
      <mat-date-range-input
        [formGroup]="dateRange"
        [max]="maxDate()"
        [rangePicker]="picker"
      >
        <input
          matStartDate
          formControlName="start"
          placeholder="Start date"
          required
        />
        <input
          matEndDate
          formControlName="end"
          placeholder="End date"
          required
        />
      </mat-date-range-input>
      <mat-datepicker-toggle
        matIconSuffix
        [for]="picker"
      ></mat-datepicker-toggle>
      <mat-date-range-picker #picker></mat-date-range-picker>
      <mat-error
        *ngIf="
          dateRange.get('start')?.hasError('required') ||
          dateRange.get('end')?.hasError('required')
        "
      >
        Both dates are required
      </mat-error>
    </mat-form-field>
  `,
})
export class DateRangeSelectorComponent implements OnInit {
  public queryParamsService = inject(QueryParamService);
  public maxDate = signal<Date>(new Date());
  private today = new Date();
  private firstDayOfMonth = new Date(
    this.today.getFullYear(),
    this.today.getMonth(),
    1
  );
  private lastDayOfMonth = new Date(
    this.today.getFullYear(),
    this.today.getMonth() + 1,
    0
  );
  private params = this.queryParamsService.getAllParamsSnapshot;
  public dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  ngOnInit() {
    this.dateRange.valueChanges.subscribe((value) => {
      const formatDate = (date: Date | null) =>
        date
          ? `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
          : null;
      const startDate = formatDate(value.start!);
      const endDate = formatDate(value.end!);
      this.queryParamsService.add({ start: startDate, end: endDate });
    });
    setTimeout(() => {
      this.dateRange.patchValue(
        {
          start: this.params['start']
            ? new Date(this.params['start'])
            : this.firstDayOfMonth,
          end: this.params['end']
            ? new Date(this.params['end'])
            : this.lastDayOfMonth,
        },
        { emitEvent: true }
      );
    }, 100);
  }
}
