import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeatureGatingService } from '../../services/feature-gating.service';

@Component({
  selector: 'app-trial-warning-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './trial-warning-banner.component.html',
})
export class TrialWarningBannerComponent {
  private router = inject(Router);
  private featureGatingService = inject(FeatureGatingService);

  private dismissedBanner = signal(false);

  isTrialActive = this.featureGatingService.isTrialActive;
  trialDaysRemaining = this.featureGatingService.trialDaysRemaining;

  showBanner = computed(() => {
    return !this.dismissedBanner() && this.isTrialActive();
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
    this.router.navigate(['/billing/pricing']);
  }

  closeBanner(): void {
    this.dismissedBanner.set(true);
  }
}
