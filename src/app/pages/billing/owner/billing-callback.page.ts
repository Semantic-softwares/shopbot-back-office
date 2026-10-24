import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { BillingStateService } from '../../../shared/billing/billing-state.service';
import { PlatformBillingService } from '../../../shared/services/platform-billing.service';

/** Paystack sends the customer here after paying. The reference is checked with the server, which settles the invoice. */
@Component({
  selector: 'app-billing-callback',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <main class="wrap">
      <section class="card" data-testid="callback">
        @switch (state()) {
          @case ('checking') { <mat-spinner [diameter]="44" /><h1 class="title" i18n>Confirming your payment…</h1><p class="lead" i18n>This takes a few seconds. Please do not close this page.</p> }
          @case ('paid') { <div class="badge badge--ok"><mat-icon>check</mat-icon></div><h1 class="title" i18n>Payment received</h1><p class="lead" i18n>Thank you. Your subscription is up to date.</p><button mat-flat-button color="primary" (click)="go()" data-testid="callback-continue" i18n>Continue</button> }
          @default { <div class="badge badge--bad"><mat-icon>error</mat-icon></div><h1 class="title" i18n>We could not confirm the payment</h1><p class="lead">{{ error() }}</p><button mat-flat-button color="primary" (click)="go()" i18n>Back to billing</button> }
        }
      </section>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--mat-sys-surface-container-low); color: var(--mat-sys-on-surface); }
    .wrap { display: grid; place-items: center; min-height: 100vh; padding: 24px 16px; box-sizing: border-box; }
    .card { display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; max-width: 440px; padding: 36px 28px; box-sizing: border-box; background: var(--mat-sys-surface); border: 1px solid var(--mat-sys-outline-variant); border-radius: 24px; }
    .badge { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; }
    .badge--ok { background: light-dark(#dcfce7, #14532d); color: light-dark(#166534, #bbf7d0); }
    .badge--bad { background: light-dark(#fee2e2, #450a0a); color: light-dark(#991b1b, #fecaca); }
    .title { margin: 20px 0 8px; font-size: 22px; font-weight: 700; }
    .lead { margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: var(--mat-sys-on-surface-variant); }
  `,
})
export class BillingCallbackPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PlatformBillingService);
  private readonly billing = inject(BillingStateService);
  readonly state = signal<'checking' | 'paid' | 'failed'>('checking');
  readonly error = signal('');

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    const reference = q.get('reference') ?? q.get('trxref');
    if (!reference) {
      this.fail($localize`The payment reference is missing.`);
      return;
    }
    firstValueFrom(this.api.verifyPayment(reference)).then(
      async () => {
        await this.billing.load().catch(() => undefined);
        this.state.set('paid');
      },
      (e) => this.fail(e?.error?.message ?? $localize`Please check your billing page, or contact support if you were charged.`),
    );
  }

  private fail(message: string): void {
    this.error.set(message);
    this.state.set('failed');
  }

  go(): void {
    void this.router.navigate([this.billing.locked() ? '/account-locked' : '/menu/admin/billing']);
  }
}
