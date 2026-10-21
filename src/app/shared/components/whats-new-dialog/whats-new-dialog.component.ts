import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Release, ReleaseItemType } from '../../services/release-notes.service';

export interface WhatsNewData {
  releases: Release[];
  /** `update`: a new version is waiting and the person can install it. `browse`: just reading the history. */
  mode: 'update' | 'browse';
}
export type WhatsNewResult = 'update' | 'later' | undefined;

const BADGES: Record<ReleaseItemType, { label: () => string; icon: string; tone: string }> = {
  new: { label: () => $localize`New`, icon: 'auto_awesome', tone: 'bg-green-100 text-green-900' },
  improved: { label: () => $localize`Improved`, icon: 'trending_up', tone: 'bg-blue-100 text-blue-900' },
  fixed: { label: () => $localize`Fixed`, icon: 'build', tone: 'bg-amber-100 text-amber-900' },
};

/** What is new in each release, grouped as New, Improved and Fixed. Shown before an update is installed, or from the user menu. */
@Component({
  selector: 'app-whats-new-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex items-center gap-3 px-6 pt-5">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><mat-icon>{{ data.mode === 'update' ? 'rocket_launch' : 'new_releases' }}</mat-icon></div>
      <div class="min-w-0">
        <h2 mat-dialog-title class="!m-0 !p-0">@if (data.mode === 'update') {<ng-container i18n>A new version is ready</ng-container>} @else {<ng-container i18n>What's new</ng-container>}</h2>
        <p class="m-0 text-sm text-on-surface-variant">@if (data.mode === 'update') {<ng-container i18n>Here is what changes when you update.</ng-container>} @else {<ng-container i18n>Recent updates and fixes.</ng-container>}</p>
      </div>
    </div>

    <mat-dialog-content class="!pt-4">
      @if (!data.releases.length) {
        <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>This update brings improvements and fixes. Update now to get them.</ng-container></p>
      }
      <div class="flex flex-col gap-6">
        @for (r of data.releases; track r.id) {
          <section>
            <div class="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 class="m-0 text-base font-semibold">{{ r.title }}</h3>
              <span class="text-xs text-on-surface-variant tabular-nums">{{ r.date | date: 'mediumDate' }}</span>
            </div>
            <ul class="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
              @for (i of r.items; track $index) {
                <li class="flex flex-col items-start gap-1.5 text-sm sm:flex-row sm:gap-3">
                  <span class="inline-flex w-24 shrink-0 sm:mt-0.5 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" [class]="badge(i.type).tone"><mat-icon class="!h-3.5 !w-3.5 !text-sm !leading-none">{{ badge(i.type).icon }}</mat-icon>{{ badge(i.type).label() }}</span>
                  <span class="min-w-0 flex-1">{{ i.text }}</span>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-5">
      @if (data.mode === 'update') {
        <button matButton (click)="ref.close('later')"><ng-container i18n>Later</ng-container></button>
        <button matButton="filled" (click)="ref.close('update')"><mat-icon>system_update_alt</mat-icon><ng-container i18n>Update now</ng-container></button>
      } @else {
        <button matButton="filled" (click)="ref.close()"><ng-container i18n>Close</ng-container></button>
      }
    </mat-dialog-actions>`,
})
export class WhatsNewDialogComponent {
  readonly data = inject<WhatsNewData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<WhatsNewDialogComponent, WhatsNewResult>);
  readonly badge = (t: ReleaseItemType) => BADGES[t] ?? BADGES.improved;
}
