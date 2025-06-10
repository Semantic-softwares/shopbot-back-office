import { Injectable } from '@angular/core';
import { MatDateRangeSelectionStrategy, DateRange, MatDatepickerInput, MatDatepicker } from '@angular/material/datepicker';
import { Subject } from 'rxjs';

@Injectable()
export class CustomDateRangeSelectionStrategy<D> implements MatDateRangeSelectionStrategy<D> {
  private readonly _selectedChanged = new Subject<DateRange<D>>();
  readonly selectedChanged = this._selectedChanged.asObservable();
  private _selectedRange: DateRange<D> = new DateRange<D>(null, null);
  private _isMultiSelect = false;

  constructor() {}

  setMultiSelect(isMulti: boolean) {
    this._isMultiSelect = isMulti;
  }

  selectionFinished(date: D | null, currentRange: DateRange<D>, event: Event): DateRange<D> {
    if (!this._isMultiSelect) {
      this._selectedRange = new DateRange(date, date);
    } else {
      if (!currentRange.start) {
        this._selectedRange = new DateRange(date, null);
      } else {
        const start = currentRange.start;
        this._selectedRange = new DateRange(start, date);
      }
    }
    this._selectedChanged.next(this._selectedRange);
    return this._selectedRange;
  }

  createPreview(activeDate: D | null, currentRange: DateRange<D>): DateRange<D> {
    if (!this._isMultiSelect) {
      return new DateRange(activeDate, activeDate);
    }
    if (!currentRange.start) {
      return new DateRange(activeDate, null);
    }
    return new DateRange(currentRange.start, activeDate);
  }

  onActiveDateChange(activeDate: D | null, currentRange: DateRange<D>): DateRange<D> {
      return new DateRange(activeDate, activeDate);
  }
}