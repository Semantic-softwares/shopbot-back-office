import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeatureGatingService } from '../../shared/services/feature-gating.service';
import { SubscriptionService } from '../../shared/services/subscription.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent {
  private featureGatingService = inject(FeatureGatingService);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  featureGating = this.featureGatingService;
  currentSubscription = this.featureGatingService.currentSubscription;
  invoices = signal<any[]>([]);
  reason = signal<string | null>(null);

  constructor() {
    this.reason.set(this.activatedRoute.snapshot.queryParams['reason']);
    this.loadInvoices();
  }

  private loadInvoices(): void {
    const subscription = this.currentSubscription();
    if (subscription && subscription._id) {
      this.subscriptionService.getInvoices().subscribe({
        next: (data) => {
          this.invoices.set(data.invoices || []);
        },
        error: (err) => console.error('Failed to load invoices:', err)
      });
    }
  }

  upgradeToPaid(): void {
    this.router.navigate(['/pricing']);
  }

  goToPricing(): void {
    this.router.navigate(['/pricing']);
  }

  renewSubscription(): void {
    this.router.navigate(['/pricing']);
  }

  manageBilling(): void {
    console.log('Manage billing clicked');
  }
}
