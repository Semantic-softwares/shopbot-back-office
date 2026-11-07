import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { OfflineStore } from '../../offline/offline-store.service';
import { cachedFetch } from '../../offline/cached-fetch';
import { ConnectivityService } from '../../offline/connectivity.service';
import { denominationsFor } from '../register-denominations';
import { RegisterApiService } from '../register-api.service';
import { RegisterContextService } from '../register-context.service';
import { parseMajor, toMinor } from '../register-money';
import { Register } from '../register.models';
import { DenominationCounterComponent } from './denomination-counter.component';

/**
 * Pick a register and start working on it: declare the opening cash (when the store asks for it, or if you want to), then open.
 * A shared register that is already open is joined instead: its drawer was declared when it was opened.
 */
@Component({
  selector: 'app-open-register-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, DenominationCounterComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1"><ng-container i18n>Open a register</ng-container></h2>

    <mat-dialog-content class="!pt-2">
      @if (net.offline()) {
        <div class="mb-3 flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm" data-testid="open-register-offline">
          <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">cloud_off</mat-icon>
          <span><ng-container i18n>You are offline. The register opens on this device and is recorded when you are back online.</ng-container></span>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-10"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (loadError()) {
        <p class="py-6 text-center text-on-surface-variant">{{ loadError() }}</p>
      } @else if (registers().length === 0) {
        <div class="flex flex-col items-center gap-2 py-8 text-center text-on-surface-variant" data-testid="no-registers">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none">point_of_sale</mat-icon>
          <p class="m-0"><ng-container i18n>This store has no registers yet.</ng-container></p>
          <p class="m-0 text-sm"><ng-container i18n>A manager can add one under Sales, Registers.</ng-container></p>
        </div>
      } @else {
        <div class="flex flex-col gap-2" role="radiogroup" aria-label="Registers" i18n-aria-label>
          @for (r of registers(); track r._id) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="selected()?._id === r._id"
              [disabled]="!usable(r)"
              (click)="select(r)"
              class="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-50"
              [class]="selected()?._id === r._id ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface hover:bg-surface-container'"
              [attr.data-testid]="'register-option-' + r.code"
            >
              <mat-icon class="!h-6 !w-6 !text-2xl !leading-none">{{ r.acceptsCash ? 'point_of_sale' : 'credit_card' }}</mat-icon>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate font-medium">{{ r.name }} <span class="font-normal text-on-surface-variant">· {{ r.code }}</span></span>
                <span class="truncate text-xs text-on-surface-variant">
                  @if (r.operatingMode === 'shared') { <ng-container i18n>Shared register</ng-container> } @else { <ng-container i18n>Individual register</ng-container> }
                  @if (!r.acceptsCash) { · <ng-container i18n>No cash</ng-container> }
                </span>
              </span>
              <span class="shrink-0 text-xs">
                @if (!r.isActive) { <ng-container i18n>Switched off</ng-container> }
                @else if (r.liveSession) {
                  @if (r.operatingMode === 'shared') { <ng-container i18n>Open · join</ng-container> }
                  @else { <ng-container i18n>In use</ng-container> {{ cashierNames(r) }} }
                } @else { <ng-container i18n>Free</ng-container> }
              </span>
            </button>
          }
        </div>

        @if (selected(); as reg) {
          @if (joining()) {
            <p class="mt-3 text-sm text-on-surface-variant" data-testid="join-note">
              <ng-container i18n>This register is already open. You will join it; its opening cash was declared when it was opened.</ng-container>
            </p>
          } @else {
            <div class="mt-4" data-testid="opening-declaration">
              <p class="mb-1 text-sm font-medium">
                @if (required()) { <ng-container i18n>Opening cash (required)</ng-container> } @else { <ng-container i18n>Opening cash (optional)</ng-container> }
              </p>
              <div class="mb-2 flex gap-2 text-sm">
                <button type="button" class="rounded-full border px-3 py-1" [class]="!counting() ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="counting.set(false)" data-testid="declare-manual"><ng-container i18n>Enter a total</ng-container></button>
                <button type="button" class="rounded-full border px-3 py-1" [class]="counting() ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="counting.set(true)" data-testid="declare-count"><ng-container i18n>Count notes and coins</ng-container></button>
              </div>
              @if (counting()) {
                <app-denomination-counter [denominations]="denominations()" [exponent]="ctx.exponent()" [currency]="symbol()" [(quantities)]="quantities" />
              } @else {
                <label class="flex items-center gap-2">
                  <span class="text-sm text-on-surface-variant">{{ symbol() }}</span>
                  <input type="text" inputmode="decimal" class="w-full rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" placeholder="0" i18n-placeholder [ngModel]="amountText()" (ngModelChange)="amountText.set($event)" data-testid="opening-float" />
                </label>
                @if (!required()) {
                  <p class="mt-1 text-xs text-on-surface-variant"><ng-container i18n>Leave empty to open with no opening cash.</ng-container></p>
                }
              }
              <textarea class="mt-3 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface" rows="2" maxlength="500" placeholder="Notes (optional)" i18n-placeholder [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea>
            </div>
          }
        }

        @if (error()) {
          <p class="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="open-register-error">{{ error() }}</p>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton (click)="dialogRef.close()" [disabled]="submitting()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" color="primary" [disabled]="!canSubmit()" (click)="submit()" data-testid="open-register-submit">
        @if (submitting()) { <mat-spinner diameter="18" class="mr-2 inline-block"></mat-spinner> }
        @if (joining()) { <ng-container i18n>Join register</ng-container> } @else { <ng-container i18n>Open register</ng-container> }
      </button>
    </mat-dialog-actions>
  `,
})
export class OpenRegisterDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<OpenRegisterDialogComponent>);
  readonly ctx = inject(RegisterContextService);
  readonly net = inject(ConnectivityService);
  private readonly api = inject(RegisterApiService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);
  private readonly offlineStore = inject(OfflineStore);

  loading = signal(true);
  loadError = signal<string | null>(null);
  registers = signal<Register[]>([]);
  selected = signal<Register | null>(null);
  submitting = signal(false);
  error = signal<string | null>(null);

  counting = signal(false);
  amountText = signal('');
  quantities = signal<Record<number, number>>({});
  notes = signal('');

  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  required = computed(() => !!this.ctx.settings()?.requireOpeningCashDeclaration);
  denominations = computed(() => denominationsFor(this.ctx.currencyCode(), this.ctx.settings()?.denominationOverride));
  joining = computed(() => {
    const r = this.selected();
    return !!r?.liveSession && r.operatingMode === 'shared';
  });

  private declaredMinor = computed(() => {
    if (this.counting()) {
      return this.denominations().reduce((sum, d) => sum + d.valueMinor * Math.max(0, Math.floor(Number(this.quantities()[d.valueMinor]) || 0)), 0);
    }
    const major = parseMajor(this.amountText());
    return major === null ? null : toMinor(major, this.ctx.exponent());
  });

  canSubmit = computed(() => {
    if (this.submitting() || !this.selected()) return false;
    if (this.joining()) return !this.net.offline(); // joining a register that is open needs the server to put you on it

    if (this.required()) return this.declaredMinor() !== null && (!this.counting() || this.declaredMinor()! >= 0);
    // optional: empty is fine, but something typed must be an amount
    return this.counting() || !this.amountText().trim() || this.declaredMinor() !== null;
  });

  ngOnInit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.loading.set(false);
      this.loadError.set($localize`Select a store first.`);
      return;
    }
    // The list is kept on the device, so a register can still be picked with no connection.
    cachedFetch(this.offlineStore, `register-list:${storeId}`, this.api.registers(storeId)).subscribe({
      next: (list) => {
        this.registers.set(list.filter((r) => r.isActive || r.liveSession));
        this.loading.set(false);
        // A single usable register needs no choosing.
        const usable = this.registers().filter((r) => this.usable(r));
        if (usable.length === 1) this.select(usable[0]);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.status ? (err.error?.message ?? $localize`Could not load the registers.`) : $localize`Could not reach the server, and no registers are saved on this device yet. Connect once to load them.`);
      },
    });
  }

  usable(r: Register): boolean {
    if (!r.isActive) return false;
    if (!r.liveSession) return true;
    // an open individual register belongs to its cashier; a shared one can be joined, which needs the server
    return r.operatingMode === 'shared' && !this.net.offline();
  }

  cashierNames(r: Register): string {
    return (r.activeCashiers ?? []).map((c) => c.name).filter(Boolean).join(', ');
  }

  /** Opens on this device (no connection); the server is told, and gives the session its real id, when the connection is back. */
  private async openHere(register: Register, body: Parameters<RegisterApiService['open']>[1]): Promise<void> {
    await this.ctx.openOffline(register, { openingFloatMinor: body.openingFloatMinor ?? (body.openingDenominations ?? []).reduce((s, r) => s + r.valueMinor * r.quantity, 0), openingDenominations: body.openingDenominations, openingNotes: body.openingNotes }, body.clientSessionId);
    this.snack.open($localize`${register.name} is open on this device. It will be recorded when you are back online.`, $localize`Close`, { duration: 4000 });
    this.dialogRef.close(true);
  }

  select(r: Register): void {
    if (!this.usable(r)) return;
    this.selected.set(r);
    this.error.set(null);
  }

  submit(): void {
    const register = this.selected();
    const storeId = this.storeStore.selectedStore()?._id;
    if (!register || !storeId || !this.canSubmit()) return;
    const body: Parameters<RegisterApiService['open']>[1] = { registerId: register._id, deviceId: this.ctx.deviceId, clientSessionId: crypto.randomUUID() };
    if (!this.joining()) {
      if (this.counting()) body.openingDenominations = this.denominations().map((d) => ({ valueMinor: d.valueMinor, quantity: Math.max(0, Math.floor(Number(this.quantities()[d.valueMinor]) || 0)) })).filter((r) => r.quantity > 0);
      else if (this.declaredMinor() !== null) body.openingFloatMinor = this.declaredMinor()!;
      if (this.notes().trim()) body.openingNotes = this.notes().trim();
      if (this.counting() && !body.openingDenominations?.length) body.openingFloatMinor = 0;
    }
    this.submitting.set(true);
    this.error.set(null);
    if (this.net.offline()) {
      void this.openHere(register, body);
      return;
    }
    this.api.open(storeId, body).subscribe({
      next: (res) => {
        this.ctx.refresh();
        this.snack.open(res.joined ? $localize`You joined ${register.name}` : $localize`${register.name} is open`, $localize`Close`, { duration: 3000 });
        this.dialogRef.close(res.session);
      },
      error: (err) => {
        // The connection dropped while sending: carry on from this device. The same session id is used, so nothing opens twice.
        if (!err?.status && !this.joining()) {
          void this.openHere(register, body);
          return;
        }
        this.submitting.set(false);
        this.error.set(err?.status ? (err.error?.message ?? $localize`The register could not be opened. Please try again.`) : $localize`Could not reach the server.`);
      },
    });
  }
}
