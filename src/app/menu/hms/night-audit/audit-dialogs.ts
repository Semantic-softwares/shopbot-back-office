import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { toDateOnly } from '../../../shared/utils/date-only';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AuditRun, AuditSettings, NightAuditService } from '../../../shared/services/night-audit.service';
import { AuditSnapshotComponent } from './audit-snapshot.component';

/** A manager signs off a blocker with a reason that is kept on the record. */
@Component({
  selector: 'app-audit-signoff-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Sign off this blocker</ng-container></h2>
    <mat-dialog-content class="!pt-2">
      <p class="mt-0 text-sm text-on-surface-variant">{{ data.message }}</p>
      <p class="text-sm text-on-surface-variant"><ng-container i18n>Closing the day despite this is recorded with your name and the reason below.</ng-container></p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label><ng-container i18n>Why is it safe to close?</ng-container></mat-label>
        <textarea matInput rows="3" [(ngModel)]="reason" cdkFocusInitial></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="reason.trim().length < 5" [mat-dialog-close]="reason.trim()"><ng-container i18n>Sign off</ng-container></button>
    </mat-dialog-actions>
  `,
})
export class AuditSignOffDialogComponent {
  data = inject<{ message: string }>(MAT_DIALOG_DATA);
  reason = '';
}

/** Turn night audit on and choose how it runs. */
@Component({
  selector: 'app-audit-settings-dialog',
  imports: [FormsModule, MatDatepickerModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Night audit settings</ng-container></h2>
    <mat-dialog-content class="!flex flex-col gap-5 !pt-3">
      @if (!model.enabled) {
        <p class="m-0 mb-1 text-sm text-on-surface-variant"><ng-container i18n>Night audit closes each business day: it posts the night's room charges, checks the books balance, and then opens the next day. Turn it on once, with the day your hotel is currently on.</ng-container></p>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>First business day</ng-container></mat-label>
          <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" placeholder="Pick the day" i18n-placeholder />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>
      } @else {
        <div class="flex items-center justify-between gap-3">
          <div><div class="font-medium"><ng-container i18n>Close the day automatically</ng-container></div><div class="text-xs text-on-surface-variant"><ng-container i18n>In the morning, if nothing blocks it. A blocked day always waits for a person.</ng-container></div></div>
          <mat-slide-toggle [(ngModel)]="model.autoRun" />
        </div>
        @if (model.autoRun) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label><ng-container i18n>Time (hotel's local time)</ng-container></mat-label>
            <input matInput type="time" [(ngModel)]="model.autoRunTime" />
          </mat-form-field>
        }
        <div class="flex items-center justify-between gap-3">
          <div><div class="font-medium"><ng-container i18n>Charge a fee for no-shows</ng-container></div><div class="text-xs text-on-surface-variant"><ng-container i18n>Off by default. Nobody is charged unless you turn this on.</ng-container></div></div>
          <mat-slide-toggle [(ngModel)]="model.noShowFee.enabled" />
        </div>
        @if (model.noShowFee.enabled) {
          <div class="grid grid-cols-2 gap-3">
            <mat-form-field appearance="outline"><mat-label><ng-container i18n>Fee is</ng-container></mat-label>
              <mat-select [(ngModel)]="model.noShowFee.mode"><mat-option value="first_night"><ng-container i18n>The first night</ng-container></mat-option><mat-option value="fixed"><ng-container i18n>A fixed amount</ng-container></mat-option></mat-select>
            </mat-form-field>
            @if (model.noShowFee.mode === 'fixed') {
              <mat-form-field appearance="outline"><mat-label><ng-container i18n>Amount</ng-container></mat-label><input matInput type="number" min="0" [(ngModel)]="model.noShowFee.amount" /></mat-form-field>
            }
          </div>
        }
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Cash difference to ignore</ng-container></mat-label>
          <input matInput type="number" min="0" [(ngModel)]="model.cashVarianceTolerance" />
          <mat-hint><ng-container i18n>Cash-ups off by this much or less are not flagged.</ng-container></mat-hint>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="!model.enabled && !startDate" (click)="save()">
        @if (model.enabled) {<ng-container i18n>Save</ng-container>} @else {<ng-container i18n>Turn on night audit</ng-container>}
      </button>
    </mat-dialog-actions>
  `,
})
export class AuditSettingsDialogComponent {
  private ref = inject(MatDialogRef<AuditSettingsDialogComponent>);
  model: AuditSettings = structuredClone(inject<AuditSettings>(MAT_DIALOG_DATA));
  /** The first business day, as a real date for the picker (read at noon so no timezone moves it). */
  startDate: Date | null = this.model.businessDate ? new Date(this.model.businessDate + 'T12:00:00') : null;

  save() {
    this.ref.close(this.model.enabled ? this.model : { ...this.model, enabled: true, startDate: this.startDate ? toDateOnly(this.startDate) : undefined });
  }
}

/** A past audit: its report pack, who closed it, and anything that was signed off. Opens at once and fills in as the run arrives. */
@Component({
  selector: 'app-audit-run-dialog',
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule, AuditSnapshotComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ asDate(data.run.businessDate) | date: 'EEEE d MMMM y' }}</h2>
    <mat-dialog-content class="!pt-2">
      <p class="mb-4 mt-0 text-sm text-on-surface-variant">
        @if (data.run.status === 'closed') {
          <ng-container i18n>Closed</ng-container> {{ data.run.closedAt | date: 'd MMM y, HH:mm' }} · @if (data.run.trigger === 'auto') {<ng-container i18n>automatically</ng-container>} @else {<ng-container i18n>by a person</ng-container>}
        } @else {
          <ng-container i18n>Not closed</ng-container>
        }
      </p>
      @if (full(); as run) {
        <app-audit-snapshot [snapshot]="run.snapshot" [currency]="data.currency" />
      } @else if (failed()) {
        <div class="flex flex-col items-center gap-2 py-8 text-center" role="alert">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-error">error</mat-icon>
          <p class="m-0 text-sm"><ng-container i18n>This day's figures could not be loaded.</ng-container></p>
          <button matButton type="button" (click)="load()"><ng-container i18n>Try again</ng-container></button>
        </div>
      } @else {
        <div class="flex flex-col gap-4" aria-busy="true" aria-label="Loading" i18n-aria-label>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">@for (i of [1, 2, 3, 4]; track i) { <div class="h-24 animate-pulse rounded-xl bg-surface-container-high"></div> }</div>
          <div class="h-40 animate-pulse rounded-xl bg-surface-container-high"></div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button matButton mat-dialog-close><ng-container i18n>Close</ng-container></button></mat-dialog-actions>
  `,
})
export class AuditRunDialogComponent {
  private api = inject(NightAuditService);
  data = inject<{ run: AuditRun; currency: string; storeId: string }>(MAT_DIALOG_DATA);
  full = signal<AuditRun | null>(null);
  failed = signal(false);

  constructor() {
    this.load();
  }

  load() {
    this.failed.set(false);
    this.api.getRun(this.data.storeId, this.data.run._id).subscribe({
      next: (run) => this.full.set(run),
      error: () => this.failed.set(true),
    });
  }

  /** A business day is a calendar date: read it at noon so no timezone can move it. */
  asDate(day: string) {
    return new Date(day + 'T12:00:00');
  }
}
