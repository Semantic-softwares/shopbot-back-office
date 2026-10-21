import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** One headline number. Pass the formatted value as the content; `active` marks the one a chart is showing. */
@Component({
  selector: 'app-report-kpi',
  imports: [MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <mat-card appearance="outlined" class="h-full transition-colors" [class.!border-primary]="active()" [class.bg-primary-container]="active()" [class.cursor-pointer]="clickable()">
      <mat-card-content class="!p-4">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          @if (icon()) { <mat-icon class="!h-4 !w-4 !text-base !leading-none">{{ icon() }}</mat-icon> }
          <span class="truncate">{{ label() }}</span>
        </div>
        <div class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl" [class]="tone()"><ng-content /></div>
        @if (hint()) { <div class="mt-0.5 text-xs text-on-surface-variant tabular-nums">{{ hint() }}</div> }
      </mat-card-content>
    </mat-card>`,
})
export class ReportKpiComponent {
  readonly label = input.required<string>();
  readonly icon = input('');
  readonly hint = input('');
  readonly active = input(false);
  readonly clickable = input(false);
  readonly tone = input('');
}
