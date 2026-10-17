import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/** Take cash out of the till to the safe. */
@Component({
  selector: 'app-cashier-drop-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Drop cash to the safe</ng-container></h2>
    <mat-dialog-content class="!flex flex-col !pt-2">
      <mat-form-field appearance="outline"><mat-label><ng-container i18n>Amount taken out</ng-container></mat-label><input matInput type="number" min="0" inputmode="decimal" [(ngModel)]="amount" cdkFocusInitial /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label><ng-container i18n>Note (optional)</ng-container></mat-label><input matInput [(ngModel)]="note" /></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" [disabled]="!(amount > 0)" [mat-dialog-close]="{ amount, note }"><ng-container i18n>Record drop</ng-container></button>
    </mat-dialog-actions>
  `,
})
export class CashierDropDialogComponent {
  amount = 0;
  note = '';
}

interface Row {
  value: number | null;
  count: number | null;
}

/** Count the till. The expected figure is deliberately not shown: a blind count cannot be nudged to fit. */
@Component({
  selector: 'app-cashier-close-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title><ng-container i18n>Close your shift</ng-container></h2>
    <mat-dialog-content class="!flex flex-col gap-3 !pt-2">
      <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Count the cash in your till and enter the total. The system's figure is shown after you close, so the count stays honest.</ng-container></p>

      @if (!breakdown()) {
        <mat-form-field appearance="outline" class="w-full"><mat-label><ng-container i18n>Cash counted</ng-container></mat-label><input matInput type="number" min="0" inputmode="decimal" [(ngModel)]="counted" cdkFocusInitial /></mat-form-field>
        <button type="button" matButton class="self-start" (click)="breakdown.set(true)"><mat-icon>calculate</mat-icon><ng-container i18n>Count note by note instead</ng-container></button>
      } @else {
        <div class="flex flex-col gap-1">
          @for (row of rows(); track $index) {
            <div class="flex flex-wrap items-center gap-2">
              <mat-form-field appearance="outline" class="w-28" subscriptSizing="dynamic"><mat-label><ng-container i18n>Note / coin</ng-container></mat-label><input matInput type="number" min="0" [(ngModel)]="row.value" /></mat-form-field>
              <span aria-hidden="true">×</span>
              <mat-form-field appearance="outline" class="w-24" subscriptSizing="dynamic"><mat-label><ng-container i18n>How many</ng-container></mat-label><input matInput type="number" min="0" [(ngModel)]="row.count" /></mat-form-field>
              <span class="ml-auto tabular-nums text-sm">{{ (row.value ?? 0) * (row.count ?? 0) }}</span>
            </div>
          }
          <div class="flex items-center justify-between">
            <button type="button" matButton (click)="addRow()"><mat-icon>add</mat-icon><ng-container i18n>Add a line</ng-container></button>
            <div class="text-sm"><ng-container i18n>Total counted</ng-container> <b class="tabular-nums">{{ total() }}</b></div>
          </div>
        </div>
      }

      <mat-form-field appearance="outline" class="w-full"><mat-label><ng-container i18n>Notes (optional)</ng-container></mat-label><textarea matInput rows="2" [(ngModel)]="notes"></textarea></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" (click)="submit()"><ng-container i18n>Close shift</ng-container></button>
    </mat-dialog-actions>
  `,
})
export class CashierCloseDialogComponent {
  private ref = inject(MatDialogRef<CashierCloseDialogComponent>);
  counted: number | null = 0;
  notes = '';
  breakdown = signal(false);
  rows = signal<Row[]>([{ value: null, count: null }, { value: null, count: null }, { value: null, count: null }]);
  total = computed(() => this.rows().reduce((s, r) => s + (r.value ?? 0) * (r.count ?? 0), 0));

  addRow() {
    this.rows.update((r) => [...r, { value: null, count: null }]);
  }

  submit() {
    if (this.breakdown()) {
      const denominations = this.rows().filter((r) => (r.value ?? 0) > 0 && (r.count ?? 0) >= 0 && r.count !== null).map((r) => ({ value: r.value as number, count: r.count as number }));
      this.ref.close({ denominations, notes: this.notes || undefined });
    } else {
      this.ref.close({ countedCash: this.counted ?? 0, notes: this.notes || undefined });
    }
  }
}
