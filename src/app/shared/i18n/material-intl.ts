import { Injectable } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** Angular Material ships English-only strings; these route them through $localize. */
@Injectable()
export class AppPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = $localize`:@@material.paginator.itemsPerPage:Items per page:`;
  override nextPageLabel = $localize`:@@material.paginator.next:Next page`;
  override previousPageLabel = $localize`:@@material.paginator.previous:Previous page`;
  override firstPageLabel = $localize`:@@material.paginator.first:First page`;
  override lastPageLabel = $localize`:@@material.paginator.last:Last page`;

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return $localize`:@@material.paginator.rangeEmpty:0 of ${length}:length:`;
    }
    const total = Math.max(length, 0);
    const start = page * pageSize;
    const end = start < total ? Math.min(start + pageSize, total) : start + pageSize;
    return $localize`:@@material.paginator.range:${start + 1}:start: – ${end}:end: of ${total}:total:`;
  };
}

@Injectable()
export class AppDatepickerIntl extends MatDatepickerIntl {
  override calendarLabel = $localize`:@@material.datepicker.calendar:Calendar`;
  override openCalendarLabel = $localize`:@@material.datepicker.open:Open calendar`;
  override closeCalendarLabel = $localize`:@@material.datepicker.close:Close calendar`;
  override prevMonthLabel = $localize`:@@material.datepicker.prevMonth:Previous month`;
  override nextMonthLabel = $localize`:@@material.datepicker.nextMonth:Next month`;
  override prevYearLabel = $localize`:@@material.datepicker.prevYear:Previous year`;
  override nextYearLabel = $localize`:@@material.datepicker.nextYear:Next year`;
  override prevMultiYearLabel = $localize`:@@material.datepicker.prev24Years:Previous 24 years`;
  override nextMultiYearLabel = $localize`:@@material.datepicker.next24Years:Next 24 years`;
  override switchToMonthViewLabel = $localize`:@@material.datepicker.chooseDate:Choose date`;
  override switchToMultiYearViewLabel = $localize`:@@material.datepicker.chooseMonthYear:Choose month and year`;
  override startDateLabel = $localize`:@@material.datepicker.startDate:Start date`;
  override endDateLabel = $localize`:@@material.datepicker.endDate:End date`;
}
