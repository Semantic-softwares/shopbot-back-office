import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../../shared/stores/store.store';
import { RegisterApiService } from '../../../../shared/register/register-api.service';
import { RegisterContextService } from '../../../../shared/register/register-context.service';
import { RegisterTerminalService } from '../../../../shared/register/register-terminal.service';
import { UserService } from '../../../../shared/services/user.service';
import { fromMinor, parseMajor, toMinor } from '../../../../shared/register/register-money';
import { Register, RegisterSettings, TerminalInfo } from '../../../../shared/register/register.models';

/** Turning registers on for the store, how strict to be, and the store's registers themselves. Off by default; changes nothing until switched on. */
@Component({
  selector: 'app-register-settings',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatSlideToggleModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="px-4">
      <div class="grid grid-cols-1 gap-6">
        <app-page-header title="Registers" i18n-title subtitle="Cash registers, cashier sessions and the daily cash count" i18n-subtitle>
          <div actions class="flex items-center gap-2">
            <button type="button" mat-flat-button color="primary" [disabled]="loading() || saving() || !settings()" (click)="save()" data-testid="register-settings-save">
              <mat-icon class="mr-1">save</mat-icon>
              @if (saving()) { <ng-container i18n>Saving...</ng-container> } @else { <ng-container i18n>Save</ng-container> }
            </button>
          </div>
        </app-page-header>

        @if (loading()) {
          <div class="flex items-center justify-center py-8"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (settings(); as s) {
          <mat-card appearance="outlined">
            <mat-card-content class="pt-4">
              <div class="space-y-4">
                <div class="rounded-lg border border-outline-variant bg-surface-container p-4">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <label class="text-sm font-semibold"><ng-container i18n>Use cash registers</ng-container></label>
                      <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>Cashiers open a register, every sale is tied to it, and the drawer is counted and reconciled when it closes. Off, the POS works exactly as before.</ng-container></p>
                    </div>
                    <mat-slide-toggle [ngModel]="s.registerManagementEnabled" (ngModelChange)="set('registerManagementEnabled', $event)" color="primary" data-testid="setting-enabled"></mat-slide-toggle>
                  </div>
                </div>

                @if (s.registerManagementEnabled) {
                  @for (row of toggles; track row.key) {
                    <div class="rounded-lg border border-outline-variant p-4">
                      <div class="flex items-center justify-between gap-4">
                        <div>
                          <label class="text-sm font-semibold">{{ row.label }}</label>
                          <p class="m-0 mt-1 text-xs text-on-surface-variant">{{ row.hint }}</p>
                        </div>
                        <mat-slide-toggle [ngModel]="$any(s)[row.key]" (ngModelChange)="set(row.key, $event)" color="primary" [attr.data-testid]="'setting-' + row.key"></mat-slide-toggle>
                      </div>
                    </div>
                  }

                  <div class="rounded-lg border border-outline-variant p-4">
                    <label class="text-sm font-semibold"><ng-container i18n>Approve differences from</ng-container></label>
                    <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>A shortage or surplus at least this large needs a manager's approval. Leave empty to ask for approval for any difference.</ng-container></p>
                    <div class="mt-2 flex items-center gap-2">
                      <span class="text-sm text-on-surface-variant">{{ symbol() }}</span>
                      <input type="text" inputmode="decimal" class="w-40 rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" [(ngModel)]="varianceText" data-testid="setting-variance-threshold" />
                    </div>
                  </div>
                  <div class="rounded-lg border border-outline-variant p-4">
                    <label class="text-sm font-semibold"><ng-container i18n>Cash out needs a manager from</ng-container></label>
                    <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>A cash-out or deposit of at least this amount must be recorded by a manager. Leave empty for no limit.</ng-container></p>
                    <div class="mt-2 flex items-center gap-2">
                      <span class="text-sm text-on-surface-variant">{{ symbol() }}</span>
                      <input type="text" inputmode="decimal" class="w-40 rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" [(ngModel)]="cashOutText" data-testid="setting-cashout-threshold" />
                    </div>
                  </div>
                }

                @if (error()) {
                  <p class="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="register-settings-error">{{ error() }}</p>
                }
              </div>
            </mat-card-content>
          </mat-card>

          @if (s.registerManagementEnabled) {
            <mat-card appearance="outlined">
              <mat-card-content class="pt-4">
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="m-0 text-base font-semibold"><ng-container i18n>Your registers</ng-container></h3>
                </div>
                <div class="flex flex-col gap-2" data-testid="register-list">
                  @for (r of registers(); track r._id) {
                    <div class="flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant px-3 py-2" [class]="r.isActive ? '' : 'opacity-60'" [attr.data-testid]="'register-row-' + r.code">
                      <mat-icon class="text-on-surface-variant">{{ r.acceptsCash ? 'point_of_sale' : 'credit_card' }}</mat-icon>
                      <div class="min-w-0 flex-1">
                        <div class="font-medium">{{ r.name }} <span class="font-normal text-on-surface-variant">· {{ r.code }}</span></div>
                        <div class="text-xs text-on-surface-variant">
                          @if (r.operatingMode === 'shared') { <ng-container i18n>Shared register</ng-container> } @else { <ng-container i18n>Individual register</ng-container> }
                          @if (!r.acceptsCash) { · <ng-container i18n>No cash</ng-container> }
                          @if (r.liveSession) { · <ng-container i18n>Open now</ng-container> }
                          @if (!r.isActive) { · <ng-container i18n>Switched off</ng-container> }
                        </div>
                      </div>
                      <button mat-stroked-button (click)="toggleActive(r)" [attr.data-testid]="'register-toggle-' + r.code">
                        @if (r.isActive) { <ng-container i18n>Switch off</ng-container> } @else { <ng-container i18n>Switch on</ng-container> }
                      </button>
                    </div>
                  } @empty {
                    <p class="m-0 text-sm text-on-surface-variant" data-testid="register-empty"><ng-container i18n>No registers yet. Add the first one below.</ng-container></p>
                  }
                </div>

                <div class="mt-4 rounded-lg bg-surface-container p-3">
                  <p class="m-0 mb-2 text-sm font-medium"><ng-container i18n>Add a register</ng-container></p>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem]">
                    <input type="text" maxlength="60" class="rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" placeholder="Name, e.g. Main Counter" i18n-placeholder [ngModel]="newName()" (ngModelChange)="newName.set($event)" data-testid="new-register-name" />
                    <input type="text" maxlength="12" class="rounded-md border border-outline bg-surface px-3 py-2 uppercase text-on-surface" placeholder="Code" i18n-placeholder [ngModel]="newCode()" (ngModelChange)="newCode.set($event)" data-testid="new-register-code" />
                  </div>
                  <div class="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <label class="flex items-center gap-2"><input type="radio" name="mode" value="individual" [ngModel]="newMode()" (ngModelChange)="newMode.set($event)" data-testid="new-register-individual" /><ng-container i18n>One cashier at a time</ng-container></label>
                    <label class="flex items-center gap-2"><input type="radio" name="mode" value="shared" [ngModel]="newMode()" (ngModelChange)="newMode.set($event)" data-testid="new-register-shared" /><ng-container i18n>Shared by several cashiers</ng-container></label>
                    <label class="flex items-center gap-2"><input type="checkbox" [ngModel]="newCashless()" (ngModelChange)="newCashless.set($event)" data-testid="new-register-cashless" /><ng-container i18n>No cash drawer</ng-container></label>
                  </div>
                  @if (registerError()) { <p class="mt-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="register-error">{{ registerError() }}</p> }
                  <button mat-flat-button color="primary" class="mt-3" [disabled]="!canAdd()" (click)="addRegister()" data-testid="add-register"><mat-icon class="mr-1">add</mat-icon><ng-container i18n>Add register</ng-container></button>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-content class="pt-4">
                <h3 class="m-0 text-base font-semibold"><ng-container i18n>Shared terminal</ng-container></h3>
                <p class="m-0 mt-1 text-sm text-on-surface-variant"><ng-container i18n>A big counter till that several cashiers use. Once this device is a shared terminal, cashiers switch with their PIN. Other devices are unaffected: each cashier signs in with their own account.</ng-container></p>
                @if (terminal.terminal(); as t) {
                  <div class="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface-container px-3 py-2" data-testid="terminal-enrolled">
                    <mat-icon class="text-primary">verified</mat-icon>
                    <span class="flex-1 text-sm"><ng-container i18n>This device is a shared terminal:</ng-container> <strong>{{ t.name }}</strong></span>
                    <button mat-stroked-button (click)="removeThisTerminal()" data-testid="terminal-remove"><ng-container i18n>Remove</ng-container></button>
                  </div>
                } @else {
                  <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input type="text" maxlength="60" class="rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" placeholder="Name, e.g. Counter till" i18n-placeholder [ngModel]="terminalName()" (ngModelChange)="terminalName.set($event)" data-testid="terminal-name" />
                    <select class="rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" [ngModel]="terminalRegister()" (ngModelChange)="terminalRegister.set($event)" data-testid="terminal-register">
                      <option value=""><ng-container i18n>No register chosen</ng-container></option>
                      @for (r of registers(); track r._id) { <option [value]="r._id">{{ r.name }}</option> }
                    </select>
                  </div>
                  <button mat-flat-button color="primary" class="mt-3" [disabled]="!terminalName().trim()" (click)="enrolThisDevice()" data-testid="terminal-enrol"><mat-icon class="mr-1">point_of_sale</mat-icon><ng-container i18n>Make this device a shared terminal</ng-container></button>
                }
                @if (terminalError()) { <p class="mt-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="terminal-error">{{ terminalError() }}</p> }
                @if (otherTerminals().length) {
                  <div class="mt-3 text-sm">
                    <p class="m-0 mb-1 font-medium"><ng-container i18n>Other shared terminals</ng-container></p>
                    @for (o of otherTerminals(); track o._id) {
                      <div class="flex items-center justify-between py-1"><span>{{ o.name }}</span><button mat-button (click)="removeTerminal(o)"><ng-container i18n>Remove</ng-container></button></div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-content class="pt-4">
                <h3 class="m-0 text-base font-semibold"><ng-container i18n>Cashier PINs</ng-container></h3>
                <p class="m-0 mt-1 text-sm text-on-surface-variant"><ng-container i18n>A PIN is 4 to 6 digits. It only works on a shared terminal, and is stored scrambled: nobody can read it back.</ng-container></p>
                <div class="mt-3 flex flex-col gap-2" data-testid="pin-list">
                  @for (m of team(); track m.id) {
                    <div class="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant px-3 py-2">
                      <span class="flex-1 font-medium">{{ m.name }}</span>
                      <input type="password" inputmode="numeric" maxlength="6" class="w-28 rounded-md border border-outline bg-surface px-2 py-1 text-center text-on-surface" placeholder="PIN" i18n-placeholder [ngModel]="pinText()[m.id] ?? ''" (ngModelChange)="setPinText(m.id, $event)" [attr.data-testid]="'pin-input-' + m.id" />
                      <button mat-stroked-button [disabled]="!validPin(m.id)" (click)="savePin(m)" [attr.data-testid]="'pin-save-' + m.id"><ng-container i18n>Set PIN</ng-container></button>
                    </div>
                  }
                </div>
                @if (pinMessage()) { <p class="mt-2 text-sm text-on-surface-variant" data-testid="pin-message">{{ pinMessage() }}</p> }
              </mat-card-content>
            </mat-card>
          }
        }
      </div>
    </div>
  `,
})
export class RegisterSettingsPage implements OnInit {
  private readonly api = inject(RegisterApiService);
  private readonly ctx = inject(RegisterContextService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);
  readonly terminal = inject(RegisterTerminalService);
  private readonly users = inject(UserService);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  settings = signal<RegisterSettings | null>(null);
  registers = signal<Register[]>([]);
  registerError = signal<string | null>(null);

  varianceText = '';
  cashOutText = '';
  newName = signal('');
  newCode = signal('');
  newMode = signal<'individual' | 'shared'>('individual');
  newCashless = signal(false);

  terminalName = signal($localize`Counter till`);
  terminalRegister = signal('');
  terminalError = signal<string | null>(null);
  terminals = signal<TerminalInfo[]>([]);
  team = signal<{ id: string; name: string }[]>([]);
  pinText = signal<Record<string, string>>({});
  pinMessage = signal<string | null>(null);
  otherTerminals = computed(() => this.terminals().filter((t) => t.deviceId !== this.ctx.deviceId));

  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  private exponent = computed(() => this.ctx.exponent());
  canAdd = computed(() => !!this.newName().trim() && /^[A-Za-z0-9_-]{1,12}$/.test(this.newCode().trim()));

  readonly toggles: { key: keyof RegisterSettings; label: string; hint: string }[] = [
    { key: 'requireOpeningCashDeclaration', label: $localize`Ask for the opening cash`, hint: $localize`The cashier must declare the float before the register opens. Off, it can open with no opening cash.` },
    { key: 'allowDenominationClosingDeclaration', label: $localize`Allow counting notes and coins`, hint: $localize`The cashier can count each note and coin when closing.` },
    { key: 'allowManualClosingDeclaration', label: $localize`Allow entering a total`, hint: $localize`The cashier can type the total cash counted when closing. Keep at least one way on.` },
    { key: 'requireClosingNotesForVariance', label: $localize`Require an explanation for a difference`, hint: $localize`A shortage or surplus cannot be closed without a note.` },
    { key: 'requireManagerApprovalForVariance', label: $localize`Require a manager to approve a difference`, hint: $localize`A large enough difference waits for a manager before the register closes.` },
    { key: 'allowCashierHandover', label: $localize`Allow handovers`, hint: $localize`One cashier can hand a shared register to another during the day.` },
    { key: 'allowMultipleCashiersOnSharedRegister', label: $localize`Allow several cashiers on a shared register at once`, hint: $localize`Off, only one cashier works a shared register at a time.` },
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.api.settings(storeId).subscribe({
      next: (res) => {
        this.settings.set(res.settings);
        this.varianceText = res.settings.varianceApprovalThreshold === null ? '' : String(fromMinor(res.settings.varianceApprovalThreshold, this.exponent()));
        this.cashOutText = res.settings.cashOutApprovalThreshold === null ? '' : String(fromMinor(res.settings.cashOutApprovalThreshold, this.exponent()));
        this.loading.set(false);
        if (res.settings.registerManagementEnabled) this.loadRegisters();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? $localize`Could not load the register settings.`);
      },
    });
  }

  private loadRegisters(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.api.registers(storeId).subscribe({ next: (r) => this.registers.set(r), error: () => undefined });
    this.api.terminals(storeId).subscribe({ next: (t) => this.terminals.set(t), error: () => undefined });
    this.users.getTeamForStore(storeId).subscribe({ next: (team) => this.team.set(team.filter((m) => m.status === 'ACTIVE').map((m) => ({ id: m.merchant._id, name: m.merchant.name }))), error: () => undefined });
  }

  enrolThisDevice(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.terminalError.set(null);
    this.api.enrolTerminal(storeId, { deviceId: this.ctx.deviceId, name: this.terminalName().trim(), registerId: this.terminalRegister() || undefined }).subscribe({
      next: (res) => {
        this.terminal.save({ deviceId: this.ctx.deviceId, name: res.terminal.name, secret: res.secret, registerId: res.terminal.registerId });
        this.loadRegisters();
        this.snack.open($localize`This device is now a shared terminal`, $localize`Close`, { duration: 3000 });
      },
      error: (err) => this.terminalError.set(err?.error?.message ?? $localize`This device could not be set up as a shared terminal.`),
    });
  }

  removeThisTerminal(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.api.revokeTerminal(storeId, this.ctx.deviceId).subscribe({
      next: () => {
        this.terminal.forget();
        this.ctx.refresh();
        this.loadRegisters();
      },
      // Already gone on the server (revoked elsewhere): forget it here too.
      error: () => this.terminal.forget(),
    });
  }

  removeTerminal(t: TerminalInfo): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) this.api.revokeTerminal(storeId, t.deviceId).subscribe({ next: () => this.loadRegisters(), error: (err) => this.terminalError.set(err?.error?.message ?? $localize`Could not remove it.`) });
  }

  setPinText(id: string, value: string): void {
    this.pinText.update((m) => ({ ...m, [id]: String(value ?? '').replace(/\D/g, '').slice(0, 6) }));
  }

  validPin(id: string): boolean {
    return /^\d{4,6}$/.test(this.pinText()[id] ?? '');
  }

  savePin(m: { id: string; name: string }): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.validPin(m.id)) return;
    this.pinMessage.set(null);
    this.api.resetPin(storeId, m.id, this.pinText()[m.id]).subscribe({
      next: () => {
        this.setPinText(m.id, '');
        this.pinMessage.set($localize`PIN saved for ${m.name}.`);
      },
      error: (err) => this.pinMessage.set(err?.error?.message ?? $localize`The PIN could not be saved.`),
    });
  }

  set<K extends keyof RegisterSettings>(key: K, value: RegisterSettings[K]): void {
    this.settings.update((s) => (s ? { ...s, [key]: value } : s));
    this.error.set(null);
  }

  save(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const s = this.settings();
    if (!storeId || !s) return;
    const variance = parseMajor(this.varianceText);
    const cashOut = parseMajor(this.cashOutText);
    const body: Partial<RegisterSettings> = {
      registerManagementEnabled: s.registerManagementEnabled,
      requireOpeningCashDeclaration: s.requireOpeningCashDeclaration,
      allowManualClosingDeclaration: s.allowManualClosingDeclaration,
      allowDenominationClosingDeclaration: s.allowDenominationClosingDeclaration,
      requireClosingNotesForVariance: s.requireClosingNotesForVariance,
      requireManagerApprovalForVariance: s.requireManagerApprovalForVariance,
      allowCashierHandover: s.allowCashierHandover,
      allowMultipleCashiersOnSharedRegister: s.allowMultipleCashiersOnSharedRegister,
      varianceApprovalThreshold: variance === null ? null : toMinor(variance, this.exponent()),
      cashOutApprovalThreshold: cashOut === null ? null : toMinor(cashOut, this.exponent()),
    };
    this.saving.set(true);
    this.error.set(null);
    this.api.updateSettings(storeId, body).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.settings.set(res.settings);
        this.ctx.applySettings(res.settings);
        if (res.settings.registerManagementEnabled) this.loadRegisters();
        this.snack.open($localize`Register settings saved`, $localize`Close`, { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? $localize`The settings could not be saved.`);
        this.load();
      },
    });
  }

  addRegister(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.canAdd()) return;
    this.registerError.set(null);
    this.api.createRegister(storeId, { name: this.newName().trim(), code: this.newCode().trim().toUpperCase(), operatingMode: this.newMode(), acceptsCash: !this.newCashless() }).subscribe({
      next: () => {
        this.newName.set('');
        this.newCode.set('');
        this.newMode.set('individual');
        this.newCashless.set(false);
        this.loadRegisters();
        this.snack.open($localize`Register added`, $localize`Close`, { duration: 2500 });
      },
      error: (err) => this.registerError.set(err?.error?.message ?? $localize`The register could not be added.`),
    });
  }

  toggleActive(r: Register): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.registerError.set(null);
    this.api.updateRegister(storeId, r._id, { isActive: !r.isActive }).subscribe({
      next: () => this.loadRegisters(),
      error: (err) => this.registerError.set(err?.error?.message ?? $localize`The register could not be changed.`),
    });
  }
}
