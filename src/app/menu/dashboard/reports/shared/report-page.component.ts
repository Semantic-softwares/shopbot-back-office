import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

export type ExportFormat = 'pdf' | 'csv' | 'excel';

/**
 * The frame every sales report shares: a title, the export menu, one card of filters (project them with `filters`), and the
 * report itself below. Keeps the four reports looking and behaving alike on a desktop, a phone, and in dark mode.
 */
@Component({
  selector: 'app-report-page',
  imports: [PageHeaderComponent, MatButtonModule, MatCardModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="px-2 md:px-4">
    <app-page-header [title]="title()" [subtitle]="subtitle()">
      <ng-container actions>
        <ng-content select="[actions]" />
        @if (exportable()) {
          <button matButton="outlined" [matMenuTriggerFor]="menu" [disabled]="exportDisabled()" aria-label="Export" i18n-aria-label>
            <mat-icon>file_download</mat-icon><span class="max-sm:hidden"><ng-container i18n>Export</ng-container></span>
          </button>
        }
      </ng-container>
    </app-page-header>
    </div>
    <mat-menu #menu="matMenu">
      <button mat-menu-item (click)="export.emit('pdf')"><mat-icon>picture_as_pdf</mat-icon><span><ng-container i18n>Export as PDF</ng-container></span></button>
      <button mat-menu-item (click)="export.emit('csv')"><mat-icon>description</mat-icon><span><ng-container i18n>Export as CSV</ng-container></span></button>
      <button mat-menu-item (click)="export.emit('excel')"><mat-icon>table_chart</mat-icon><span><ng-container i18n>Export as Excel</ng-container></span></button>
    </mat-menu>

    <div class="flex flex-col gap-4 px-4 pb-16 md:px-6">
      <mat-card appearance="outlined">
        <mat-card-content class="!p-3 sm:!p-4">
          <div class="grid grid-cols-2 gap-x-3 gap-y-3 lg:flex lg:flex-wrap lg:items-start lg:gap-x-4 [&_mat-form-field]:w-full [&_.mat-mdc-form-field-subscript-wrapper:not(:has(mat-error))]:!hidden [&_date-range-selector]:col-span-2 [&>*:last-child:nth-child(even)]:col-span-2 lg:[&>*]:w-72 lg:[&>*:last-child:nth-child(even)]:col-span-1">
            <ng-content select="[filters]" />
          </div>
        </mat-card-content>
      </mat-card>
      <ng-content />
    </div>`,
})
export class ReportPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly exportable = input(true);
  readonly exportDisabled = input(false);
  readonly export = output<ExportFormat>();
}
