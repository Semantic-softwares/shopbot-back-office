import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { BillingStateService, billingCallbackUrl } from '../../shared/billing/billing-state.service';
import { AuthService } from '../../shared/services/auth.service';
import { PlatformBillingService } from '../../shared/services/platform-billing.service';

/**
 * Where a locked account lands. It sits outside the app shell on purpose (nothing in the app works while locked) and offers only what
 * gets the account open again: pay the open invoice by card, see the bank-transfer details, or check again after paying.
 */
@Component({
  selector: 'app-account-locked',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <main class="wrap">
      <section class="card" data-testid="paywall">
        <div class="badge"><mat-icon>lock</mat-icon></div>
        @if (res.isLoading() && !res.hasValue()) { <mat-progress-bar mode="indeterminate" /> }
        @if (account(); as a) {
          <h1 class="title" data-testid="paywall-title">
            @switch (a.subscription.status) {
              @case ('SUSPENDED') { <ng-container i18n>Your account is suspended</ng-container> }
              @case ('CANCELLED') { <ng-container i18n>Your subscription has ended</ng-container> }
              @default { <ng-container i18n>Your account is locked</ng-container> }
            }
          </h1>
          <p class="lead">
            @if (a.subscription.status === 'SUSPENDED') { <ng-container i18n>An administrator has paused this account. Contact support to open it again.</ng-container> }
            @else if (a.subscription.status === 'CANCELLED') { <ng-container i18n>This subscription was cancelled. Pay the invoice below, or contact support, to start again.</ng-container> }
            @else { <ng-container i18n>Your plan has run out. Pay the invoice below and everything opens straight away. Nothing was deleted, and sales saved on your tills will send once you are back.</ng-container> }
          </p>

          @if (open().length) {
            @for (i of open(); track i._id) {
              <div class="invoice" data-testid="paywall-invoice">
                <div class="invoice__main">
                  <div class="invoice__no">{{ i.invoiceNumber }}</div>
                  <div class="invoice__meta"><span i18n>Due</span> {{ i.dueDate | date: 'mediumDate' : 'UTC' }}</div>
                </div>
                <div class="invoice__amount">{{ i.amountDue ?? i.total ?? i.amount | currency: i.currency }}</div>
                <button mat-flat-button color="primary" [disabled]="busy()" (click)="pay(i._id)" data-testid="paywall-pay"><mat-icon>credit_card</mat-icon><span i18n>Pay by card</span></button>
              </div>
            }
            @if (a.bankTransferInstructions) {
              <div class="bank">
                <div class="bank__title"><mat-icon>account_balance</mat-icon><span i18n>Or pay by bank transfer</span></div>
                <p class="bank__text">{{ a.bankTransferInstructions }}</p>
                <p class="bank__hint" i18n>Send the invoice number as the reference. Your account opens as soon as we record the transfer.</p>
              </div>
            }
          } @else if (!res.isLoading()) {
            <div class="bank"><p class="bank__text" i18n>There is no open invoice on this account. Contact support and we will get you open.</p></div>
          }

          <div class="actions">
            <button mat-stroked-button [disabled]="busy()" (click)="check()" data-testid="paywall-check"><mat-icon>refresh</mat-icon><span i18n>I have paid, check again</span></button>
            <a mat-button href="mailto:support@shopbot.africa" i18n>Contact support</a>
            <button mat-button (click)="signOut()" i18n>Sign out</button>
          </div>
          @if (message()) { <p class="note" role="status">{{ message() }}</p> }
        }
      </section>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--mat-sys-surface-container-low); color: var(--mat-sys-on-surface); }
    .wrap { display: grid; place-items: center; min-height: 100vh; padding: 24px 16px; box-sizing: border-box; }
    .card { width: 100%; max-width: 520px; background: var(--mat-sys-surface); border: 1px solid var(--mat-sys-outline-variant); border-radius: 24px; padding: 32px 28px; box-sizing: border-box; }
    .badge { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; margin-bottom: 16px; background: light-dark(#fee2e2, #450a0a); color: light-dark(#991b1b, #fecaca); }
    .title { margin: 0 0 8px; font-size: 24px; line-height: 1.25; font-weight: 700; }
    .lead { margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: var(--mat-sys-on-surface-variant); }
    .invoice { display: flex; align-items: center; gap: 16px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 16px; background: var(--mat-sys-surface-container-low); }
    .invoice__main { flex: 1; min-width: 0; }
    .invoice__no { font-weight: 600; }
    .invoice__meta { margin-top: 2px; font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    .invoice__amount { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .bank { margin: 16px 0 0; padding: 16px; border-radius: 16px; background: var(--mat-sys-surface-container); }
    .bank__title { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 8px; }
    .bank__text { margin: 0; white-space: pre-line; font-size: 14px; line-height: 1.5; }
    .bank__hint { margin: 10px 0 0; font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--mat-sys-outline-variant); }
    .note { margin: 14px 0 0; font-size: 14px; color: var(--mat-sys-on-surface-variant); }
    @media (max-width: 480px) { .card { padding: 24px 20px; } .invoice { flex-wrap: wrap; } .invoice button { width: 100%; } }
  `,
})
export class AccountLockedPage {
  private readonly billing = inject(BillingStateService);
  private readonly api = inject(PlatformBillingService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly res = rxResource({ stream: () => this.billing.refresh() });
  readonly invoicesRes = rxResource({ stream: () => this.api.invoices(12, 0) });
  readonly account = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly open = computed(() => (this.invoicesRes.hasValue() ? this.invoicesRes.value().invoices.filter((i) => i.status === 'PENDING') : []));
  readonly busy = signal(false);
  readonly message = signal('');

  async pay(invoiceId: string): Promise<void> {
    this.busy.set(true);
    try {
      const { checkoutUrl } = await firstValueFrom(this.api.payInvoice(invoiceId, billingCallbackUrl()));
      window.location.assign(checkoutUrl);
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`Could not start the payment. Please try again.`, $localize`Close`, { duration: 6000 });
      this.busy.set(false);
    }
  }

  async check(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      const a = await this.billing.load();
      if (!a.subscription.blocked) void this.router.navigate(['/menu/menu']);
      else this.message.set($localize`Still locked. If you paid a moment ago, wait a minute and check again.`);
    } catch {
      this.message.set($localize`Could not check just now. Please try again.`);
    } finally {
      this.busy.set(false);
    }
  }

  signOut(): void {
    this.auth.logout();
    void this.router.navigate(['/auth']);
  }
}
