import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../../shared/services/subscription.service';

interface PricingTier {
  minRooms: number;
  maxRooms: number;
  priceUSD: number;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  templateUrl: './pricing.component.html',
})
export class PricingComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private subscriptionService = inject(SubscriptionService);

  roomCount = signal<number>(5);
  isProcessing = signal<boolean>(false);

  // Pricing tiers in USD
  private readonly pricingTiers = [
    { minRooms: 0, maxRooms: 10, priceUSD: 20 },
    { minRooms: 11, maxRooms: 30, priceUSD: 30 },
    { minRooms: 31, maxRooms: 35, priceUSD: 40 },
    { minRooms: 36, maxRooms: Infinity, priceUSD: 50 },
  ];

  // Get price based on room count
  calculatedPrice = computed(() => {
    const rooms = this.roomCount();
    const tier = this.pricingTiers.find(
      (t) => rooms >= t.minRooms && rooms <= t.maxRooms,
    );
    return tier ? tier.priceUSD : 0;
  });

  // Get tier description
  tierDescription = computed(() => {
    const rooms = this.roomCount();
    const tier = this.pricingTiers.find(
      (t) => rooms >= t.minRooms && rooms <= t.maxRooms,
    );
    if (!tier) return '';
    
    if (tier.maxRooms === Infinity) {
      return `${tier.minRooms}+ rooms`;
    }
    return `${tier.minRooms}-${tier.maxRooms} rooms`;
  });

  incrementRooms(): void {
    if (this.roomCount() < 1000) {
      this.roomCount.update((count) => count + 1);
    }
  }

  decrementRooms(): void {
    if (this.roomCount() > 1) {
      this.roomCount.update((count) => count - 1);
    }
  }

  updateRoomCount(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value) && value >= 1 && value <= 1000) {
      this.roomCount.set(value);
    }
  }

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
    this.subscriptionService.initiateUpgradePayment(this.roomCount()).subscribe({
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
