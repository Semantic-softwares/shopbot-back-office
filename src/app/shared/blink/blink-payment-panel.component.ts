import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnDestroy, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as QRCode from 'qrcode';
import { filter, interval, Subscription } from 'rxjs';
import { SocketService } from '../services/socket.service';
import { StoreStore } from '../stores/store.store';
import { parseAmountInput, sanitizeAmountInput } from '../components/payment-dialog/payment-split';
import { RegisterContextService } from '../register/register-context.service';
import { BlinkApiService } from './blink-api.service';
import { BlinkPaid, BlinkPayment, normaliseMauritiusMobile } from './blink.models';

type Phase = 'form' | 'creating' | 'waiting' | 'paid' | 'failed';

/**
 * Takes one Blink payment inside the payment dialog: the cashier picks Dynamic QR or Push to Phone, the customer pays in their Blink
 * app, and the panel reports the payment only once the server has confirmed it with Blink. The result arrives over the store socket,
 * with a short poll as a safety net. A payment left waiting when the dialog closes is cancelled.
 */
@Component({
  selector: 'app-blink-payment-panel',
  imports: [CurrencyPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mt-3 rounded-lg border border-outline-variant bg-surface-container-low p-3" data-testid="blink-panel">
      @switch (phase()) {
        @case ('form') {
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="How will the customer pay?" i18n-aria-label>
            <button type="button" class="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium" [class]="mode() === 'qr' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface text-on-surface'" [attr.aria-pressed]="mode() === 'qr'" (click)="mode.set('qr')" data-testid="blink-mode-qr">
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none">qr_code_2</mat-icon><ng-container i18n>Show QR code</ng-container>
            </button>
            <button type="button" class="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium" [class]="mode() === 'push' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface text-on-surface'" [attr.aria-pressed]="mode() === 'push'" (click)="mode.set('push')" data-testid="blink-mode-push">
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none">phone_iphone</mat-icon><ng-container i18n>Send to phone</ng-container>
            </button>
          </div>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mt-3 w-full">
            <mat-label><ng-container i18n>Amount</ng-container></mat-label>
            <input matInput type="text" inputmode="decimal" autocomplete="off" [ngModel]="amountText()" (ngModelChange)="amountText.set(sanitize($event))" data-testid="blink-amount" />
            <span matTextPrefix class="pr-1 text-on-surface-variant">{{ currency() }}</span>
          </mat-form-field>
          @if (mode() === 'push') {
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mt-3 w-full">
              <mat-label><ng-container i18n>Customer's Blink mobile number</ng-container></mat-label>
              <input matInput type="tel" inputmode="numeric" autocomplete="off" placeholder="5xxx xxxx" [ngModel]="mobile()" (ngModelChange)="mobile.set($event)" data-testid="blink-mobile" />
              <span matTextPrefix class="pr-1 text-on-surface-variant">+230</span>
            </mat-form-field>
          }
          @if (error()) {
            <p class="m-0 mt-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="blink-error">{{ error() }}</p>
          }
          <button matButton="filled" color="primary" type="button" class="mt-3 w-full" [disabled]="!canStart()" (click)="start()" data-testid="blink-start">
            @if (mode() === 'qr') { <ng-container i18n>Create QR code</ng-container> } @else { <ng-container i18n>Send payment request</ng-container> }
          </button>
        }
        @case ('creating') {
          <div class="flex items-center justify-center gap-3 py-6" data-testid="blink-creating"><mat-spinner diameter="28"></mat-spinner><span class="text-sm"><ng-container i18n>Contacting Blink…</ng-container></span></div>
        }
        @case ('waiting') {
          <div class="flex flex-col items-center gap-2 text-center" data-testid="blink-waiting">
            @if (attempt()?.mode === 'qr') {
              @if (qrImage()) {
                <img [src]="qrImage()" alt="Blink payment QR code" i18n-alt class="h-56 w-56 rounded-lg bg-white p-2" data-testid="blink-qr" />
              } @else {
                <mat-spinner diameter="28"></mat-spinner>
              }
              <p class="m-0 text-sm font-medium"><ng-container i18n>Ask the customer to scan this with the Blink app</ng-container></p>
            } @else {
              <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-primary">phone_iphone</mat-icon>
              <p class="m-0 text-sm font-medium"><ng-container i18n>Waiting for the customer to approve on their phone</ng-container> {{ attempt()?.customerMobileMasked }}</p>
            }
            <p class="m-0 text-lg font-semibold tabular-nums">{{ attempt()?.amount | currency: currency() : 'symbol' : '1.2-2' }}</p>
            <p class="m-0 text-xs text-on-surface-variant" data-testid="blink-countdown"><ng-container i18n>Waiting for payment…</ng-container> {{ secondsLeft() }}s</p>
            <button matButton type="button" (click)="cancel()" data-testid="blink-cancel"><ng-container i18n>Cancel</ng-container></button>
          </div>
        }
        @case ('paid') {
          <div class="flex items-center justify-center gap-2 py-4 text-sm font-medium text-primary" data-testid="blink-paid">
            <mat-icon>check_circle</mat-icon><ng-container i18n>Blink payment received</ng-container>
          </div>
        }
        @case ('failed') {
          <div class="flex flex-col items-center gap-2 text-center" data-testid="blink-failed">
            <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-error">error</mat-icon>
            <p class="m-0 text-sm" data-testid="blink-error">{{ error() }}</p>
            <button matButton="outlined" type="button" (click)="retry()" data-testid="blink-retry"><ng-container i18n>Try again</ng-container></button>
          </div>
        }
      }
    </div>
  `,
})
export class BlinkPaymentPanelComponent implements OnDestroy {
  /** What is still owed: the most this payment can be. */
  readonly maxAmount = input.required<number>();
  readonly currency = input<string>('Rs');
  /** Blink confirmed the payment. */
  readonly paid = output<BlinkPaid>();
  /** A payment is in flight: the dialog must not close or be confirmed meanwhile. */
  readonly busyChange = output<boolean>();

  private readonly api = inject(BlinkApiService);
  private readonly storeStore = inject(StoreStore);
  private readonly socket = inject(SocketService);
  private readonly register = inject(RegisterContextService);

  readonly mode = signal<'qr' | 'push'>('qr');
  readonly amountText = signal('');
  readonly mobile = signal('');
  readonly phase = signal<Phase>('form');
  readonly attempt = signal<BlinkPayment | null>(null);
  readonly error = signal<string | null>(null);
  readonly qrImage = signal<string | null>(null);
  private readonly now = signal(Date.now());
  readonly sanitize = sanitizeAmountInput;

  readonly secondsLeft = computed(() => {
    const a = this.attempt();
    return a ? Math.max(0, Math.floor((new Date(a.expiresAt).getTime() - this.now()) / 1000)) : 0;
  });
  private readonly amount = computed(() => parseAmountInput(this.amountText()));
  readonly canStart = computed(() => {
    const amount = this.amount();
    if (amount === null || amount > this.maxAmount() + 0.001) return false;
    return this.mode() === 'qr' || normaliseMauritiusMobile(this.mobile()) !== null;
  });

  private watching: Subscription | null = null;

  constructor() {
    // Seed the amount with what is still owed, as the other methods do; only while the form is showing.
    effect(() => {
      const max = this.maxAmount();
      untracked(() => {
        if (this.phase() === 'form') this.amountText.set(String(max));
      });
    });
    interval(1000).pipe(takeUntilDestroyed()).subscribe(() => this.now.set(Date.now()));
  }

  start(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const amount = this.amount();
    if (!storeId || amount === null || !this.canStart()) return;
    this.error.set(null);
    this.phase.set('creating');
    this.busyChange.emit(true);
    this.api
      .create(storeId, { mode: this.mode(), amount, customerMobileNo: this.mode() === 'push' ? (normaliseMauritiusMobile(this.mobile()) ?? undefined) : undefined, deviceId: this.register.deviceId })
      .subscribe({
        next: (a) => {
          this.attempt.set(a);
          this.now.set(Date.now());
          this.phase.set('waiting');
          if (a.qrString) void QRCode.toDataURL(a.qrString, { margin: 1, width: 360, errorCorrectionLevel: 'M' }).then((url) => this.qrImage.set(url));
          this.watch(storeId, a.id);
        },
        error: (err) => {
          this.phase.set('form');
          this.busyChange.emit(false);
          this.error.set(err?.status ? (err.error?.message ?? $localize`Blink could not take this payment.`) : $localize`Could not reach the server. Check the connection and try again.`);
        },
      });
  }

  /** Listens for the server's word (socket) and asks now and then in case the notice never comes. */
  private watch(storeId: string, id: string): void {
    this.stopWatching();
    const check = () => this.api.payment(storeId, id).subscribe({ next: (a) => this.apply(a), error: () => undefined });
    const sub = new Subscription();
    sub.add(this.socket.on<{ attemptId: string }>('blink:payment').pipe(filter((p) => p?.attemptId === id)).subscribe(check));
    sub.add(interval(3000).subscribe(check));
    this.watching = sub;
  }

  private stopWatching(): void {
    this.watching?.unsubscribe();
    this.watching = null;
  }

  private apply(a: BlinkPayment): void {
    if (this.phase() !== 'waiting' || a.id !== this.attempt()?.id) return;
    this.attempt.set(a);
    if (a.status === 'success') {
      this.stopWatching();
      this.phase.set('paid');
      this.busyChange.emit(false);
      this.paid.emit({ attemptId: a.id, amount: a.amount, reference: a.transactionId ?? a.id });
    } else if (a.status !== 'pending') {
      this.stopWatching();
      this.phase.set('failed');
      this.busyChange.emit(false);
      this.error.set(a.statusDescription ?? (a.status === 'expired' ? $localize`The customer did not pay in time.` : $localize`The payment was not completed.`));
    }
  }

  cancel(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const a = this.attempt();
    this.stopWatching();
    if (storeId && a) this.api.cancel(storeId, a.id).subscribe({ error: () => undefined });
    this.attempt.set(null);
    this.qrImage.set(null);
    this.phase.set('form');
    this.busyChange.emit(false);
  }

  retry(): void {
    this.attempt.set(null);
    this.qrImage.set(null);
    this.error.set(null);
    this.phase.set('form');
  }

  ngOnDestroy(): void {
    this.stopWatching();
    // A request left waiting is closed here; if the customer pays anyway the owner sees it flagged on the Blink payments report.
    const storeId = this.storeStore.selectedStore()?._id;
    const a = this.attempt();
    if (this.phase() === 'waiting' && storeId && a) this.api.cancel(storeId, a.id).subscribe({ error: () => undefined });
  }
}
