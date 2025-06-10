import { Component, signal, inject, OnInit, output } from '@angular/core';
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
  selector: 'period-range-selector',
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
    <mat-form-field appearance="outline" class="w-32">
      <mat-label>Period</mat-label>
      <mat-select [(value)]="selectedPeriod" (selectionChange)="onSelectionChange($event.value)">
        <mat-option *ngFor="let period of periods" [value]="period">
          {{ period | titlecase }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
export class PeriodSelectorComponent implements OnInit {
  public selectedPeriod = 'daily';
  public periods = ['daily', 'weekly', 'monthly', 'yearly'];
  public queryParamsService = inject(QueryParamService);
  public selectionChange = output<string>();
  public periodSelector = new FormGroup({
    period: new FormControl<string | null>(this.selectedPeriod),
  });
  

  public onSelectionChange(value: string): void {
    this.selectionChange.emit(value);
    this.periodSelector.patchValue({ period: value });
  }

  ngOnInit(): void {
    this.updatePeriodsBasedOnDateRange();

    this.periodSelector?.valueChanges.subscribe((value: any) => {
      if (value.period) {
        this.queryParamsService.add({ period: value.period });
      }
    });

    const params = this.queryParamsService.getAllParamsSnapshot;
    setTimeout(() => {
      this.periodSelector?.patchValue(
        { period: params['period'] || this.selectedPeriod },
        { emitEvent: true }
      );
    }, 100);
  }

  private updatePeriodsBasedOnDateRange() {
    this.queryParamsService.getAllParams$.subscribe((params) => {
      const { start, end, period } = params;
      
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        // Update available periods based on date range
        if (diffDays <= 7) {
          this.periods = ['daily', 'weekly'];
        } else if (diffDays > 7 && diffDays < 30) {
          this.periods = ['daily', 'weekly'];
        } else if (diffDays >= 30 && diffDays <= 365) {
          this.periods = ['daily', 'weekly', 'monthly'];
        } else if (diffDays > 365) {
          this.periods = ['daily', 'weekly', 'monthly', 'yearly'];
        }

        // Only set default period if no period is selected
        if (!period) {
          if (diffDays <= 7) {
            this.selectedPeriod = 'daily';
          } else if (diffDays > 7 && diffDays < 30) {
            this.selectedPeriod = 'daily';
          } else if (diffDays >= 30 && diffDays <= 365) {
            this.selectedPeriod = 'weekly';
          } else if (diffDays > 365) {
            this.selectedPeriod = 'monthly';
          }
          this.periodSelector.patchValue({ period: this.selectedPeriod }, { emitEvent: true });
          this.selectionChange.emit(this.selectedPeriod);
        }
      }
    });
  }
}
