import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { ConnectivityService } from '../../offline/connectivity.service';
import { denominationsFor } from '../register-denominations';
import { TrPipe } from '../../i18n/tr.pipe';
import { RolesService } from '../../services/roles.service';
import { RegisterApiService } from '../register-api.service';
import { RegisterContextService } from '../register-context.service';
import { fromMinor, parseMajor, toMinor, varianceKind } from '../register-money';
import { CloseSummary, RegisterReport } from '../register.models';
import { DenominationCounterComponent } from './denomination-counter.component';
import { RegisterReportComponent } from './register-report.component';
import { RegisterReportDialogComponent } from './register-report-dialog.component';

type Stage = 'loading' | 'count' | 'pending' | 'done' | 'error';

/**
 * Closing the register: it first freezes new sales, shows what the drawer should hold, takes the count (a total or notes and coins),
 * shows the difference before anything is final, asks for an explanation or a manager when the store requires it, and finishes with the
 * Z-report. Cancelling puts the register back to work.
 */
@Component({
  selector: 'app-close-register-dialog',
  imports: [CurrencyPipe, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, TrPipe, DenominationCounterComponent, RegisterReportComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1">
      @if (stage() === 'done') { <ng-container i18n>Register closed</ng-container> } @else { <ng-container i18n>Close register</ng-container> }
    </h2>

    <mat-dialog-content class="!pt-2">
      @switch (stage()) {
        @case ('loading') { <div class="flex justify-center py-10"><mat-spinner diameter="36"></mat-spinner></div> }

        @case ('error') {
          <p class="py-6 text-center text-on-surface-variant" data-testid="close-error-state">{{ error() }}</p>
        }

        @case ('count') {
          @if (summary(); as s) {
            @if (offline()) {
              <div class="mb-3 flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm" data-testid="close-offline">
                <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">cloud_off</mat-icon>
                <span><ng-container i18n>You are offline. Count the drawer now: it is saved on this device, the register stops taking sales, and the difference is worked out when you are back online.</ng-container></span>
              </div>
            }
            <section data-testid="close-expected" [class.hidden]="offline()">
              <h3 class="m-0 mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>What the drawer should hold</ng-container></h3>
              <div class="rounded-lg border border-outline-variant text-sm">
                @for (l of expectedLines(); track l.label) {
                  <div class="flex items-center justify-between px-3 py-1.5" [class]="l.strong ? 'border-t border-outline-variant font-semibold' : ''">
                    <span>{{ l.label }}</span><span class="tabular-nums">{{ l.sign }}{{ major(l.minor) | currency: symbol() : 'symbol' : digits() }}</span>
                  </div>
                }
              </div>
              <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>Card, e-wallet and transfer payments do not enter the drawer.</ng-container></p>
            </section>

            @if (s.openOrders) {
              <div class="mt-3 flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm" data-testid="close-open-orders">
                <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">table_restaurant</mat-icon>
                <span>@if (s.openOrders === 1) { <ng-container i18n>1 table order is still open. It stays open for the next cashier, and the cash from it goes into their register session, not this one.</ng-container> } @else { <ng-container i18n>{{ s.openOrders }} table orders are still open. They stay open for the next cashier, and the cash from them goes into their register session, not this one.</ng-container> }</span>
              </div>
            }

            @if (!s.completeness.complete) {
              <div class="mt-3 flex items-start gap-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" data-testid="close-incomplete">
                <mat-icon class="!h-5 !w-5 !text-xl !leading-none">warning</mat-icon>
                <span><ng-container i18n>Another till still has sales or cash movements to send. Wait for it to sync before you close.</ng-container></span>
              </div>
            }

            <section class="mt-4">
              <h3 class="m-0 mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Count the cash</ng-container></h3>
              @if (s.rules.allowManual && s.rules.allowDenomination) {
                <div class="mb-2 flex gap-2 text-sm">
                  <button type="button" class="rounded-full border px-3 py-1" [class]="method() === 'manual' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="method.set('manual')" data-testid="close-method-manual"><ng-container i18n>Enter a total</ng-container></button>
                  <button type="button" class="rounded-full border px-3 py-1" [class]="method() === 'denomination' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="method.set('denomination')" data-testid="close-method-count"><ng-container i18n>Count notes and coins</ng-container></button>
                </div>
              }
              @if (method() === 'denomination') {
                <app-denomination-counter [denominations]="s.denominations" [exponent]="ctx.exponent()" [currency]="symbol()" [(quantities)]="quantities" />
              } @else {
                <label class="flex items-center gap-2">
                  <span class="text-sm text-on-surface-variant">{{ symbol() }}</span>
                  <input type="text" inputmode="decimal" class="w-full rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" placeholder="0" i18n-placeholder [ngModel]="amountText()" (ngModelChange)="amountText.set($event)" data-testid="close-actual" />
                </label>
              }

              @if (actualMinor() !== null) {
                <div class="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium" [class]="varianceClass()" data-testid="close-variance">
                  <span>
                    @if (kind() === 'balanced') { <ng-container i18n>Balanced</ng-container> }
                    @else if (kind() === 'shortage') { <ng-container i18n>Cash shortage</ng-container> }
                    @else { <ng-container i18n>Cash surplus</ng-container> }
                  </span>
                  <span class="tabular-nums">{{ varianceMinor()! > 0 ? '+' : varianceMinor()! < 0 ? '-' : '' }}{{ major(abs(varianceMinor()!)) | currency: symbol() : 'symbol' : digits() }}</span>
                </div>
              }

              <textarea class="mt-3 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface" rows="2" maxlength="500" [placeholder]="notesRequired() ? ('Explain the difference (required)' | tr) : ('Notes (optional)' | tr)" [ngModel]="notes()" (ngModelChange)="notes.set($event)" data-testid="close-notes"></textarea>
              @if (s.rules.requireApprovalForVariance && kind() !== 'balanced' && actualMinor() !== null) {
                <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>A manager may need to approve this difference before the register closes.</ng-container></p>
              }
            </section>

            @if (incomplete(); as inc) {
              <div class="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="close-incomplete-error">
                <p class="m-0"><ng-container i18n>Another till may still have records to send.</ng-container></p>
                @if (canApprove()) { <p class="m-0 mt-1"><ng-container i18n>You can close anyway. The close will be marked provisional, not reconciled.</ng-container></p> }
              </div>
            }
          }
        }

        @case ('pending') {
          <div class="flex flex-col items-center gap-2 py-6 text-center" data-testid="close-pending">
            <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">hourglass_top</mat-icon>
            <p class="m-0 font-medium"><ng-container i18n>Waiting for a manager to approve the difference</ng-container></p>
            @if (pending(); as p) {
              <p class="m-0 text-sm text-on-surface-variant">
                <ng-container i18n>Expected</ng-container> {{ major(p.expected) | currency: symbol() : 'symbol' : digits() }} ·
                <ng-container i18n>Counted</ng-container> {{ major(p.actual) | currency: symbol() : 'symbol' : digits() }} ·
                <ng-container i18n>Difference</ng-container> {{ major(p.variance) | currency: symbol() : 'symbol' : digits() }}
              </p>
            }
            @if (canApprove()) {
              <div class="mt-2 flex gap-2">
                <button matButton="filled" color="primary" (click)="approve()" [disabled]="submitting()" data-testid="close-approve"><ng-container i18n>Approve and close</ng-container></button>
                <button matButton (click)="reject()" [disabled]="submitting()" data-testid="close-reject"><ng-container i18n>Reject, recount</ng-container></button>
              </div>
            } @else {
              <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Ask a manager to approve it from their own account.</ng-container></p>
            }
          </div>
        }

        @case ('done') {
          @if (closedReport()) {
            <app-register-report [report]="closedReport()" />
          } @else {
            <div class="flex flex-col items-center gap-2 py-6 text-center" data-testid="close-queued">
              <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">cloud_off</mat-icon>
              <p class="m-0 font-medium"><ng-container i18n>Closing saved on this device</ng-container></p>
              <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>It is not reconciled yet. When you are back online the register closes, the difference is worked out, and the Z-report is made.</ng-container></p>
            </div>
          }
        }
      }

      @if (error() && stage() !== 'error') {
        <p class="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="close-error">{{ error() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      @switch (stage()) {
        @case ('done') {
          @if (closedReport()) { <button matButton (click)="printZ()" data-testid="close-print"><mat-icon>print</mat-icon><ng-container i18n>Print Z-report</ng-container></button> }
          <button matButton="filled" color="primary" (click)="dialogRef.close(true)" data-testid="close-done"><ng-container i18n>Done</ng-container></button>
        }
        @case ('count') {
          <button matButton (click)="cancel()" [disabled]="submitting()" data-testid="close-cancel"><ng-container i18n>Cancel</ng-container></button>
          @if (incomplete() && canApprove()) {
            <button matButton (click)="submit(true)" [disabled]="submitting()" data-testid="close-anyway"><ng-container i18n>Close anyway</ng-container></button>
          }
          <button matButton="filled" color="primary" [disabled]="!canSubmit()" (click)="submit(false)" data-testid="close-submit">
            @if (submitting()) { <mat-spinner diameter="18" class="mr-2 inline-block"></mat-spinner> }
            <ng-container i18n>Close register</ng-container>
          </button>
        }
        @case ('pending') {
          <button matButton (click)="dialogRef.close()"><ng-container i18n>Close this window</ng-container></button>
        }
        @default {
          <button matButton (click)="dialogRef.close()"><ng-container i18n>Close</ng-container></button>
        }
      }
    </mat-dialog-actions>
  `,
})
export class CloseRegisterDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<CloseRegisterDialogComponent>);
  readonly ctx = inject(RegisterContextService);
  private readonly api = inject(RegisterApiService);
  private readonly storeStore = inject(StoreStore);
  private readonly roles = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly net = inject(ConnectivityService);

  offline = signal(false);
  stage = signal<Stage>('loading');
  error = signal<string | null>(null);
  summary = signal<CloseSummary | null>(null);
  submitting = signal(false);
  incomplete = signal<unknown | null>(null);
  pending = signal<{ expected: number; actual: number; variance: number } | null>(null);
  closedReport = signal<RegisterReport | null>(null);

  method = signal<'manual' | 'denomination'>('manual');
  amountText = signal('');
  quantities = signal<Record<number, number>>({});
  notes = signal('');

  private sessionId = computed(() => this.ctx.current()?.session._id ?? '');
  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  digits = computed(() => (this.ctx.exponent() ? '1.2-2' : '1.0-0'));
  canApprove = computed(() => this.roles.isAdmin() || this.roles.hasAny(['pos.register.approve_variance', 'pos.register.manage']));

  expectedLines = computed(() => {
    const t = this.summary()?.totals;
    if (!t) return [] as { label: string; minor: number; sign: string; strong?: boolean }[];
    return [
      { label: $localize`Opening float`, minor: t.openingFloat, sign: '' },
      { label: $localize`Cash sales`, minor: t.cashSales, sign: '' },
      { label: $localize`Cash refunds`, minor: t.cashRefunds, sign: t.cashRefunds ? '-' : '' },
      { label: $localize`Cash in`, minor: t.cashIn + t.cashTransferIn, sign: '' },
      { label: $localize`Cash out`, minor: t.cashOut, sign: t.cashOut ? '-' : '' },
      { label: $localize`Cash deposits`, minor: t.cashDeposits, sign: t.cashDeposits ? '-' : '' },
      { label: $localize`Expected cash`, minor: t.expectedCash, sign: '', strong: true },
    ];
  });

  actualMinor = computed<number | null>(() => {
    if (this.method() === 'denomination') {
      const list = this.summary()?.denominations ?? [];
      const total = list.reduce((sum, d) => sum + d.valueMinor * Math.max(0, Math.floor(Number(this.quantities()[d.valueMinor]) || 0)), 0);
      return total;
    }
    const major = parseMajor(this.amountText());
    return major === null ? null : toMinor(major, this.ctx.exponent());
  });
  // Offline there is no expected figure to compare with: the server works the difference out when this is sent.
  varianceMinor = computed<number | null>(() => (this.offline() || this.actualMinor() === null || !this.summary() ? null : this.actualMinor()! - this.summary()!.totals.expectedCash));
  kind = computed(() => varianceKind(this.varianceMinor() ?? 0));
  varianceClass = computed(() => (this.kind() === 'balanced' ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'));
  notesRequired = computed(() => !!this.summary()?.rules.requireNotesForVariance && this.kind() !== 'balanced' && this.actualMinor() !== null);

  canSubmit = computed(() => {
    if (this.submitting() || this.actualMinor() === null) return false;
    if (this.notesRequired() && !this.notes().trim()) return false;
    return !!this.summary() && (this.offline() || this.summary()!.completeness.complete || !!this.incomplete());
  });

  ngOnInit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const sid = this.sessionId();
    if (!storeId || !sid) {
      this.stage.set('error');
      this.error.set($localize`There is no open register to close.`);
      return;
    }
    if (this.net.offline()) {
      this.startOffline();
      return;
    }
    this.api.closeStart(storeId, sid, this.ctx.deviceId).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.method.set(s.rules.allowManual ? 'manual' : 'denomination');
        this.ctx.refresh(); // the register now reads as closing: no new sales
        this.stage.set('count');
      },
      error: (err) => {
        if (!err?.status) {
          this.startOffline(); // the connection dropped: carry on from this device
          return;
        }
        this.stage.set('error');
        this.error.set(err.error?.message ?? $localize`The register could not be closed.`);
      },
    });
  }

  /** Closing with no connection: no totals to show, just the declaration, kept here until it can be sent. */
  private startOffline(): void {
    const current = this.ctx.current();
    const settings = this.ctx.settings();
    if (!current || !settings) {
      this.stage.set('error');
      this.error.set($localize`You need a connection to close a register.`);
      return;
    }
    this.offline.set(true);
    this.summary.set({
      session: current.session,
      totals: { openingFloat: current.session.openingFloatMinor, cashSales: 0, cashIn: 0, cashTransferIn: 0, cashRefunds: 0, cashOut: 0, cashDeposits: 0, cashTransferOut: 0, expectedCash: 0, paymentsByMethod: [], paymentsTotal: 0, refundsByMethod: [], salesCount: 0, cashByCashier: [], lateNetCash: 0, lateCount: 0 },
      completeness: { complete: true, pendingDevices: [] },
      denominations: denominationsFor(this.ctx.currencyCode(), settings.denominationOverride),
      rules: { allowManual: settings.allowManualClosingDeclaration, allowDenomination: settings.allowDenominationClosingDeclaration, requireNotesForVariance: false, requireApprovalForVariance: false, approvalThresholdMinor: settings.varianceApprovalThreshold },
    });
    this.method.set(settings.allowManualClosingDeclaration ? 'manual' : 'denomination');
    this.stage.set('count');
  }

  major(minor: number): number {
    return fromMinor(minor, this.ctx.exponent());
  }
  abs(n: number): number {
    return Math.abs(n);
  }

  /** Puts the register back to work if the cashier changes their mind. */
  cancel(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const sid = this.sessionId();
    if (!storeId || !sid) return this.dialogRef.close();
    this.submitting.set(true);
    this.api.closeCancel(storeId, sid).subscribe({
      next: () => {
        this.ctx.refresh();
        this.dialogRef.close();
      },
      error: () => {
        this.submitting.set(false);
        this.dialogRef.close();
      },
    });
  }

  submit(closeAnyway: boolean): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const sid = this.sessionId();
    if (!storeId || !sid || this.actualMinor() === null) return;
    const body: Parameters<RegisterApiService['close']>[2] = { method: this.method(), notes: this.notes().trim() || undefined, deviceId: this.ctx.deviceId, clientEventId: crypto.randomUUID(), closeAnyway: closeAnyway || undefined };
    if (this.method() === 'denomination') {
      body.denominations = (this.summary()?.denominations ?? []).map((d) => ({ valueMinor: d.valueMinor, quantity: Math.max(0, Math.floor(Number(this.quantities()[d.valueMinor]) || 0)) })).filter((r) => r.quantity > 0);
    } else body.actualCashMinor = this.actualMinor()!;
    if (this.offline()) {
      void this.saveCloseHere(body);
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.api.close(storeId, sid, body).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.pendingApproval) {
          this.pending.set({ expected: res.expectedCashMinor ?? 0, actual: res.actualCashMinor ?? 0, variance: res.varianceMinor ?? 0 });
          this.stage.set('pending');
          return;
        }
        this.finish(res.session);
      },
      error: (err) => {
        this.submitting.set(false);
        // The connection dropped while sending: keep the count here under the same id; the server closes once however it ends.
        if (!err?.status) {
          void this.saveCloseHere(body);
          return;
        }
        if (err?.status === 409 && err.error?.code === 'INCOMPLETE_DATA') {
          this.incomplete.set(err.error);
          return;
        }
        this.error.set(err?.status ? (err.error?.message ?? $localize`The register could not be closed. Please try again.`) : $localize`Could not reach the server.`);
      },
    });
  }

  private async saveCloseHere(body: Parameters<RegisterApiService['close']>[2]): Promise<void> {
    await this.ctx.queueClose({ method: body.method, actualCashMinor: body.actualCashMinor, denominations: body.denominations, notes: body.notes }, body.clientEventId);
    this.submitting.set(false);
    this.closedReport.set(null);
    this.stage.set('done');
  }

  approve(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.submitting.set(true);
    this.api.approveClose(storeId, this.sessionId()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.finish(res.session);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? $localize`The difference could not be approved.`);
      },
    });
  }

  reject(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.submitting.set(true);
    this.api.rejectClose(storeId, this.sessionId(), $localize`Please count again.`).subscribe({
      next: () => {
        this.submitting.set(false);
        this.pending.set(null);
        this.stage.set('count');
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? $localize`Could not reject.`);
      },
    });
  }

  private finish(session: { closingReport?: RegisterReport }): void {
    this.closedReport.set(session.closingReport ?? null);
    this.stage.set('done');
    this.ctx.refresh();
    this.snack.open($localize`Register closed`, $localize`Close`, { duration: 3000 });
  }

  printZ(): void {
    const report = this.closedReport();
    if (!report) return;
    this.dialog.open(RegisterReportDialogComponent, { width: '560px', maxWidth: '96vw', maxHeight: '92vh', data: { sessionId: report.session._id, kind: 'Z', report } });
  }
}
