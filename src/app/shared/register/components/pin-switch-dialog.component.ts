import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { ConnectivityService } from '../../offline/connectivity.service';
import { RegisterApiService } from '../register-api.service';
import { RegisterContextService } from '../register-context.service';
import { OfflinePinLimiter, verifyPinOffline } from '../register-pin-offline';
import { RegisterTerminalService } from '../register-terminal.service';
import { TerminalStaff } from '../register.models';

/** On a shared terminal: tap your name, enter your PIN, and the till is yours. Everything you do from then on is recorded as you. */
@Component({
  selector: 'app-pin-switch-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1"><ng-container i18n>Who is using this till?</ng-container></h2>
    <mat-dialog-content class="!pt-2">
      @if (net.offline()) {
        <div class="mb-3 flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm" data-testid="pin-offline">
          <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">cloud_off</mat-icon>
          <span><ng-container i18n>You are offline. Your PIN is checked on this device, and the till records that it was not confirmed by the server.</ng-container></span>
        </div>
      }
      @if (loading()) {
        <div class="flex justify-center py-10"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (loadError()) {
        <p class="py-6 text-center text-on-surface-variant">{{ loadError() }}</p>
      } @else if (!chosen()) {
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="pin-staff">
          @for (s of staff(); track s.id) {
            <button type="button" class="flex flex-col items-center gap-1 rounded-lg border border-outline-variant bg-surface px-2 py-3 hover:bg-surface-container disabled:opacity-50" [disabled]="!s.hasPin" (click)="choose(s)" [attr.data-testid]="'pin-staff-' + s.id">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">{{ initial(s.name) }}</span>
              <span class="max-w-full truncate text-sm font-medium">{{ s.name }}</span>
              @if (!s.hasPin) { <span class="text-xs text-on-surface-variant"><ng-container i18n>No PIN set</ng-container></span> }
            </button>
          }
        </div>
      } @else {
        <div class="flex flex-col items-center gap-3" data-testid="pin-pad">
          <p class="m-0 font-medium">{{ chosen()!.name }}</p>
          <div class="flex gap-2" aria-live="polite">
            @for (i of dots; track i) { <span class="h-3 w-3 rounded-full border border-outline" [class]="i < pin().length ? 'bg-primary border-primary' : ''"></span> }
          </div>
          <div class="grid grid-cols-3 gap-2">
            @for (d of keys; track d) {
              <button type="button" class="h-12 w-16 rounded-lg border border-outline-variant bg-surface text-lg font-medium hover:bg-surface-container" (click)="press(d)" [attr.data-testid]="'pin-key-' + d">{{ d }}</button>
            }
            <button type="button" class="h-12 w-16 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container" (click)="back()" aria-label="Delete" i18n-aria-label data-testid="pin-key-back"><mat-icon>backspace</mat-icon></button>
            <button type="button" class="h-12 w-16 rounded-lg border border-outline-variant bg-surface text-lg font-medium hover:bg-surface-container" (click)="press('0')" data-testid="pin-key-0">0</button>
            <button type="button" class="h-12 w-16 rounded-lg bg-primary text-on-primary disabled:opacity-40" [disabled]="pin().length < 4 || submitting()" (click)="submit()" aria-label="Confirm" i18n-aria-label data-testid="pin-submit"><mat-icon>check</mat-icon></button>
          </div>
        </div>
      }
      @if (error()) {
        <p class="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="pin-error">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      @if (chosen()) { <button matButton (click)="chosen.set(null); pin.set(''); error.set(null)"><ng-container i18n>Back</ng-container></button> }
      <button matButton (click)="dialogRef.close()" [disabled]="submitting()"><ng-container i18n>Cancel</ng-container></button>
    </mat-dialog-actions>
  `,
})
export class PinSwitchDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<PinSwitchDialogComponent>);
  readonly net = inject(ConnectivityService);
  private readonly api = inject(RegisterApiService);
  private readonly ctx = inject(RegisterContextService);
  private readonly terminal = inject(RegisterTerminalService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);

  readonly keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  readonly dots = [0, 1, 2, 3, 4, 5];
  loading = signal(true);
  loadError = signal<string | null>(null);
  staff = signal<TerminalStaff[]>([]);
  chosen = signal<TerminalStaff | null>(null);
  pin = signal('');
  submitting = signal(false);
  error = signal<string | null>(null);
  hasStaff = computed(() => this.staff().length > 0);

  ngOnInit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const t = this.terminal.terminal();
    if (!storeId || !t) {
      this.loading.set(false);
      this.loadError.set($localize`This device is not a shared terminal.`);
      return;
    }
    // The team saved from the last time this till was online shows at once; a fresh copy replaces it a moment later.
    const saved = this.terminal.cachedStaff(storeId);
    if (saved) {
      this.staff.set(saved);
      this.loading.set(false);
    }
    if (this.net.offline()) {
      if (!saved) {
        this.loading.set(false);
        this.loadError.set($localize`No team is saved on this device yet. Connect once to load it.`);
      }
      return;
    }
    this.api.terminalStaff(storeId, t.deviceId, t.secret).subscribe({
      next: (list) => {
        this.terminal.saveStaff(storeId, list);
        // Do not swap the list under a cashier who is already typing a PIN.
        if (!this.chosen()) this.staff.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (saved && !err?.status) return; // no connection after all: keep working from the saved team
        if (err?.error?.code === 'NOT_A_TERMINAL') this.terminal.saveStaff(storeId, []); // revoked: the saved PIN checks must not outlive it
        this.staff.set([]);
        this.loadError.set(err?.status ? (err.error?.message ?? $localize`Could not load the team.`) : $localize`Could not reach the server.`);
      },
    });
  }

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  choose(s: TerminalStaff): void {
    this.chosen.set(s);
    this.pin.set('');
    this.error.set(null);
  }

  press(d: string): void {
    if (this.pin().length < 6) this.pin.update((p) => p + d);
    this.error.set(null);
  }

  back(): void {
    this.pin.update((p) => p.slice(0, -1));
  }

  submit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const t = this.terminal.terminal();
    const who = this.chosen();
    if (!storeId || !t || !who || this.pin().length < 4) return;
    this.submitting.set(true);
    this.error.set(null);
    void this.switchIn(storeId, t, who);
  }

  /**
   * The till checks the PIN itself first (against what the server gave this terminal) and switches at once: the wait for the server is
   * what made this slow. Online, the server then confirms in the background and the cashier is upgraded to a confirmed one. A PIN the
   * till does not recognise is still asked of the server when online, because the PIN may have been changed since.
   */
  private async switchIn(storeId: string, t: { deviceId: string; secret: string }, who: TerminalStaff): Promise<void> {
    const offline = this.net.offline();
    if (who.verifier && this.limiter.lockedFor(who.id) === 0 && (await verifyPinOffline(this.pin(), who.verifier))) {
      this.limiter.succeeded(who.id);
      this.terminal.setOperator({ token: '', offline: true, at: Date.now(), userId: who.id, name: who.name });
      await this.ctx.adoptTerminalSession();
      this.dialogRef.close(true);
      if (!offline) this.confirmWithServer(storeId, t, who);
      return;
    }
    if (offline) return this.failOffline(who);
    this.api.terminalSwitch(storeId, t.deviceId, t.secret, who.id, this.pin()).subscribe({
      next: (res) => {
        this.terminal.setOperator({ token: res.token, userId: res.user.id, name: res.user.name });
        this.ctx.refresh();
        this.dialogRef.close(true);
      },
      error: (err) => {
        // The connection dropped while switching and nothing on the till could check this PIN.
        if (!err?.status) return this.failOffline(who);
        this.submitting.set(false);
        this.pin.set('');
        this.error.set(err.error?.message ?? $localize`The PIN was not accepted.`);
      },
    });
  }

  /** In the background: the server checks the PIN too and issues the confirmed token. Refused (PIN changed, person removed) means signed out again. */
  private confirmWithServer(storeId: string, t: { deviceId: string; secret: string }, who: TerminalStaff): void {
    const pin = this.pin();
    const terminal = this.terminal;
    const ctx = this.ctx;
    const snack = this.snack;
    this.api.terminalSwitch(storeId, t.deviceId, t.secret, who.id, pin).subscribe({
      next: (res) => {
        if (terminal.operator()?.userId !== res.user.id) return; // someone else has switched in since
        terminal.setOperator({ token: res.token, userId: res.user.id, name: res.user.name });
        ctx.refresh();
      },
      error: (err) => {
        if (!err?.status || terminal.operator()?.userId !== who.id) return; // no connection: stay switched in, not confirmed
        terminal.clearOperator();
        ctx.refresh();
        snack.open(err.error?.message ?? $localize`The PIN was not accepted.`, $localize`Close`, { duration: 6000 });
      },
    });
  }

  private readonly limiter = new OfflinePinLimiter();

  private failOffline(who: TerminalStaff): void {
    this.submitting.set(false);
    this.pin.set('');
    if (!who.verifier) {
      this.error.set($localize`This PIN cannot be checked offline yet. Connect once, switch in, and it will work offline from then on.`);
    } else if (this.limiter.lockedFor(who.id) > 0) {
      this.error.set($localize`Too many wrong PINs. Try again in a few minutes.`);
    } else {
      this.limiter.failed(who.id);
      this.error.set($localize`The PIN was not accepted.`);
    }
  }
}
