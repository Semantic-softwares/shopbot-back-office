import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BillingStateService } from '../../billing/billing-state.service';
import { FeatureGatingService } from '../../services/feature-gating.service';

@Component({
  selector: 'app-trial-warning-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './trial-warning-banner.component.html',
})
export class TrialWarningBannerComponent {
  private router = inject(Router);
  private billing = inject(BillingStateService);
  private featureGatingService = inject(FeatureGatingService);

  private dismissedBanner = signal(false);

  isTrialActive = this.featureGatingService.isTrialActive;
  trialDaysRemaining = this.featureGatingService.trialDaysRemaining;

  /** The platform admin area is about other stores' subscriptions, so this store's trial notice stays out of it. */
  private readonly url = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url)), { initialValue: this.router.url });

  showBanner = computed(() => {
    return !this.dismissedBanner() && this.isTrialActive() && !this.url().startsWith('/super-admin') && !this.billing.isPlatformBilled();
  });

  bannerClass = computed(() => {
    const daysRemaining = this.trialDaysRemaining();

    if (daysRemaining <= 1) {
      return 'critical';
    }
    if (daysRemaining <= 3) {
      return 'warning';
    }
    if (daysRemaining <= 7) {
      return 'warning';
    }
    return 'info';
  });

  bannerIcon = computed(() => {
    const daysRemaining = this.trialDaysRemaining();

    if (daysRemaining <= 1) {
      return 'priority_high';
    }
    if (daysRemaining <= 3) {
      return 'warning';
    }
    return 'info';
  });

  bannerTitle = computed(() => {
    const daysRemaining = this.trialDaysRemaining();

    if (daysRemaining === 0) {
      return 'Trial Ended!';
    }
    if (daysRemaining === 1) {
      return 'Trial Ends Tomorrow';
    }
    if (daysRemaining <= 3) {
      return 'Trial Ending Soon!';
    }
    return 'Free Trial Active';
  });

  bannerMessage = computed(() => {
    const daysRemaining = this.trialDaysRemaining();

    if (daysRemaining === 0) {
      return 'Your free trial has ended. Upgrade now to continue using ShopBot and managing your business.';
    }
    if (daysRemaining === 1) {
      return 'Your free trial ends tomorrow. Upgrade now to continue uninterrupted service.';
    }
    return `You have ${daysRemaining} days remaining in your free trial. Upgrade now to maintain continuous access to all features.`;
  });

  upgradeTrial(): void {
     this.router.navigate(['/menu/hms/settings/hotel-settings/billing']);
  }

  closeBanner(): void {
    this.dismissedBanner.set(true);
  }
}
