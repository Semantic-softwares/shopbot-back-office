import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, map } from 'rxjs';
import { BillingStateService } from '../../billing/billing-state.service';
import { bannerFor } from '../../billing/subscription-banner.state';

/** The single subscription notice above the app (it replaces the separate trial and renewal banners for platform-billed stores). */
@Component({
  selector: 'app-subscription-banner',
  imports: [DatePipe, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (shown(); as b) {
      <div class="banner" [class]="'banner banner--' + b.severity" role="status" data-testid="subscription-banner">
        <mat-icon class="banner__icon">{{ b.severity === 'info' ? 'info' : b.severity === 'warn' ? 'schedule' : 'priority_high' }}</mat-icon>
        <p class="banner__text">
          @switch (b.kind) {
            @case ('past-due') { <b i18n>Payment overdue.</b>&nbsp;<span i18n>Pay now to keep your account open. It locks on {{ b.date | date: 'mediumDate' }}.</span> }
            @case ('cancelling') { <b i18n>Cancellation scheduled.</b>&nbsp;<span i18n>Your subscription ends on {{ b.date | date: 'mediumDate' }}.</span> }
            @case ('trial-ending') { <b i18n>Your free trial ends in {{ b.days }} days.</b>&nbsp;<span i18n>Choose a plan to keep going.</span> }
            @case ('over-seats') { <b i18n>Your team is bigger than your plan.</b>&nbsp;<span i18n>Move to a larger plan to add more people.</span> }
            @case ('invoice-ready') { <b i18n>Your next invoice is ready.</b>&nbsp;<span i18n>It is due on {{ b.date | date: 'mediumDate' }}.</span> }
            @default { <b i18n>Free trial.</b>&nbsp;<span i18n>{{ b.days }} days left, every module included.</span> }
          }
        </p>
        <button mat-stroked-button class="banner__cta" (click)="open()" data-testid="banner-cta">
          @if (b.kind === 'cancelling') { <ng-container i18n>Keep my plan</ng-container> }
          @else if (b.kind === 'past-due' || b.kind === 'invoice-ready') { <ng-container i18n>Pay now</ng-container> }
          @else { <ng-container i18n>See plans</ng-container> }
        </button>
        @if (b.severity !== 'critical') { <button mat-icon-button (click)="dismissed.set(b.kind)" aria-label="Dismiss" i18n-aria-label><mat-icon>close</mat-icon></button> }
      </div>
    }
  `,
  styles: `
    .banner { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid transparent; }
    .banner__icon { flex: none; }
    .banner__text { flex: 1; margin: 0; font-size: 14px; line-height: 1.35; min-width: 0; }
    .banner__cta { flex: none; }
    .banner--info { background: light-dark(#e0f2fe, #0c2a3d); color: light-dark(#075985, #bae6fd); border-color: light-dark(#bae6fd, #164e63); }
    .banner--warn { background: light-dark(#fef3c7, #3a2a0a); color: light-dark(#78350f, #fde68a); border-color: light-dark(#fcd34d, #78350f); }
    .banner--critical { background: light-dark(#fee2e2, #450a0a); color: light-dark(#7f1d1d, #fecaca); border-color: light-dark(#fca5a5, #7f1d1d); }
    .banner .mat-mdc-outlined-button { color: inherit; border-color: currentColor; }
    @media (max-width: 640px) { .banner { flex-wrap: wrap; } .banner__text { flex-basis: calc(100% - 40px); } }
  `,
})
export class SubscriptionBannerComponent {
  private readonly billing = inject(BillingStateService);
  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url)), { initialValue: this.router.url });
  readonly dismissed = signal<string | null>(null);

  /** Not shown on the paywall, the billing screen itself or the super-admin area, where it would only repeat the page. */
  readonly shown = computed(() => {
    const b = bannerFor(this.billing.account());
    const url = this.url();
    if (!b || b.kind === this.dismissed()) return null;
    if (url.startsWith('/super-admin') || url.startsWith('/account-locked') || url.startsWith('/billing-callback') || url.includes('/admin/billing')) return null;
    return b;
  });

  open(): void {
    void this.router.navigate(['/menu/admin/billing']);
  }
}
