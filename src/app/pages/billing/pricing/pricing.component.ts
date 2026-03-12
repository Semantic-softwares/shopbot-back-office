import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../../shared/services/subscription.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './pricing.component.html',
})
export class PricingComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private subscriptionService = inject(SubscriptionService);

  isProcessing = signal<boolean>(false);

  readonly paidPrice = 87.45;

  startTrial(): void {
    this.isProcessing.set(true);
    this.subscriptionService.createTrial().subscribe({
      next: () => {
        this.snackBar.open('Trial activated! Enjoy 30 days free access.', 'Close', {
          duration: 5000,
        });
        this.router.navigate(['/menu/hms']);
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.snackBar.open(
          error.error?.message || 'Failed to start trial',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  initiatePayment(): void {
    this.isProcessing.set(true);
    this.subscriptionService.initiateUpgradePayment().subscribe({
      next: (response) => {
        // Redirect to Paystack checkout
        window.location.href = response.checkoutUrl;
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.snackBar.open(
          error.error?.message || 'Failed to initiate payment',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }
}
