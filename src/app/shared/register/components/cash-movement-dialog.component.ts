import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { ConnectivityService } from '../../offline/connectivity.service';
import { RegisterApiService } from '../register-api.service';
import { RegisterContextService } from '../register-context.service';
import { parseMajor, toMinor } from '../register-money';

export interface CashMovementDialogData {
  type: 'cash_in' | 'cash_out' | 'cash_deposit';
}

/** Cash added to, or taken out of, the drawer by hand: with the amount, a reason, and an optional reference. Recorded once, never edited. */
@Component({
  selector: 'app-cash-movement-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1">
      @switch (type()) {
        @case ('cash_in') { <ng-container i18n>Cash in</ng-container> }
        @case ('cash_deposit') { <ng-container i18n>Cash deposit</ng-container> }
        @default { <ng-container i18n>Cash out</ng-container> }
      }
    </h2>
    <mat-dialog-content class="!pt-2">
      <div class="mb-3 flex gap-2 text-sm">
        @for (t of types; track t.value) {
          <button type="button" class="rounded-full border px-3 py-1" [class]="type() === t.value ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="type.set(t.value)" [attr.data-testid]="'movement-type-' + t.value">{{ t.label }}</button>
        }
      </div>
      <label class="flex items-center gap-2">
        <span class="text-sm text-on-surface-variant">{{ symbol() }}</span>
        <input type="text" inputmode="decimal" class="w-full rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" placeholder="Amount" i18n-placeholder [ngModel]="amountText()" (ngModelChange)="amountText.set($event)" data-testid="movement-amount" />
      </label>
      <div class="mt-3 flex flex-wrap gap-2">
        @for (q of quickReasons(); track q) {
          <button type="button" class="rounded-full border border-outline-variant px-3 py-1 text-xs hover:bg-surface-container" (click)="reason.set(q)" [attr.data-testid]="'movement-quick-' + $index">{{ q }}</button>
        }
      </div>
      <textarea class="mt-2 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface" rows="2" maxlength="200" placeholder="Reason" i18n-placeholder [ngModel]="reason()" (ngModelChange)="reason.set($event)" data-testid="movement-reason"></textarea>
      <input type="text" maxlength="80" class="mt-2 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface" placeholder="Reference (optional)" i18n-placeholder [ngModel]="reference()" (ngModelChange)="reference.set($event)" data-testid="movement-reference" />
      @if (net.offline()) {
        <p class="mt-2 text-sm text-on-surface-variant" data-testid="movement-offline"><ng-container i18n>You are offline. This is saved on this device and recorded when you are back online.</ng-container></p>
      }
      @if (error()) {
        <p class="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="movement-error">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton (click)="dialogRef.close()" [disabled]="submitting()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" color="primary" [disabled]="!canSubmit()" (click)="submit()" data-testid="movement-submit">
        @if (submitting()) { <mat-spinner diameter="18" class="mr-2 inline-block"></mat-spinner> }
        <ng-container i18n>Record</ng-container>
      </button>
    </mat-dialog-actions>
  `,
})
export class CashMovementDialogComponent {
  private readonly data = inject<CashMovementDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CashMovementDialogComponent>);
  readonly net = inject(ConnectivityService);
  private readonly ctx = inject(RegisterContextService);
  private readonly api = inject(RegisterApiService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);

  readonly types = [
    { value: 'cash_in' as const, label: $localize`Cash in` },
    { value: 'cash_out' as const, label: $localize`Cash out` },
    { value: 'cash_deposit' as const, label: $localize`Deposit` },
  ];
  type = signal<'cash_in' | 'cash_out' | 'cash_deposit'>(this.data.type);
  amountText = signal('');
  reason = signal('');
  reference = signal('');
  submitting = signal(false);
  error = signal<string | null>(null);

  /** One id per dialog, so a double tap or a retry records one movement. */
  private readonly idempotencyKey = crypto.randomUUID();
  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  quickReasons = computed(() =>
    this.type() === 'cash_in' ? [$localize`Extra change`, $localize`Float top-up`, $localize`From another register`]
    : this.type() === 'cash_deposit' ? [$localize`Bank deposit`, $localize`To the safe`]
    : [$localize`Petty cash`, $localize`Supplier payment`, $localize`Staff advance`],
  );
  private amountMinor = computed(() => {
    const m = parseMajor(this.amountText());
    return m === null ? null : toMinor(m, this.ctx.exponent());
  });

  private async saveHere(amount: number): Promise<void> {
    await this.ctx.queueMovement({ type: this.type(), amountMinor: amount, reason: this.reason().trim(), referenceType: this.reference().trim() ? 'reference' : undefined, referenceId: this.reference().trim() || undefined }, this.idempotencyKey);
    this.snack.open($localize`Saved on this device. It will be recorded when you are back online.`, $localize`Close`, { duration: 4000 });
    this.dialogRef.close(true);
  }

  canSubmit(): boolean {
    const amount = this.amountMinor();
    return !this.submitting() && amount !== null && amount > 0 && this.reason().trim().length >= 2;
  }

  submit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const sessionId = this.ctx.current()?.session._id;
    const amount = this.amountMinor();
    if (!storeId || !sessionId || amount === null || !this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    if (this.net.offline()) {
      void this.saveHere(amount);
      return;
    }
    this.api.addMovement(storeId, sessionId, { type: this.type(), amountMinor: amount, reason: this.reason().trim(), referenceType: this.reference().trim() ? 'reference' : undefined, referenceId: this.reference().trim() || undefined, idempotencyKey: this.idempotencyKey, deviceId: this.ctx.deviceId }).subscribe({
      next: () => {
        this.snack.open($localize`Recorded`, $localize`Close`, { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        // The connection dropped while sending: keep it here under the same id, so it is recorded once however it ends.
        if (!err?.status) {
          void this.saveHere(amount);
          return;
        }
        this.submitting.set(false);
        this.error.set(err.error?.message ?? $localize`The cash movement could not be recorded.`);
      },
    });
  }
}
