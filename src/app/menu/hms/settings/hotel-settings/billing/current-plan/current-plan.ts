import { Component, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from '../../../../../../shared/models/subscription.model';
import { SubscriptionService } from '../../../../../../shared/services/subscription.service';
import { MatIconModule } from "@angular/material/icon";
import { CancelSubscriptionDialogComponent } from './cancel-subscription-dialog/cancel-subscription-dialog.component';
import { environment } from '../../../../../../../environments/environment';

export interface PricingTier {
  roomRange: string;
  price: number;
  currency: string;
}

@Component({
  selector: 'app-current-plan',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    CancelSubscriptionDialogComponent,
  ],
  templateUrl: './current-plan.html',
})
export class CurrentPlanComponent {
  subscription = input<Subscription | null>(null);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  pricingResource = rxResource({
    stream: () => this.subscriptionService.getPricingPlans(),
  });

  getButtonLabel(): string {
    const sub = this.subscription();
    if (!sub) return 'Cancel Subscription';
    return sub.status === 'TRIAL' ? 'Upgrade Plan' : 'Cancel Subscription';
  }

  getRoomRangeLabel(): string {
    const sub = this.subscription();
    if (!sub || sub.status === 'TRIAL') return 'Up to 10 rooms';
    
    const roomCount = sub.roomCount || 10;
    
    if (roomCount <= 10) return '0-10 rooms';
    if (roomCount <= 30) return '11-30 rooms';
    if (roomCount <= 35) return '31-35 rooms';
    return '35+ rooms';
  }

  private getNextTierRoomCount(): number {
    const sub = this.subscription();
    if (!sub) return 11; // Default to next tier if no subscription

    // If trial, upgrade to 11-30 tier
    if (sub.status === 'TRIAL') {
      return 11;
    }

    const roomCount = sub.roomCount || 10;

    // Based on current room count, select next tier
    if (roomCount <= 10) return 11;      // 0-10 → 11-30
    if (roomCount <= 30) return 31;      // 11-30 → 31-35
    if (roomCount <= 35) return 36;      // 31-35 → 35+
    return roomCount;                     // Already at max tier
  }

  private getRoomCountFromRange(roomRange: string): number {
    // Convert room range to room count for API call
    if (roomRange.includes('0-10')) return 10;
    if (roomRange.includes('11-30')) return 30;
    if (roomRange.includes('31-35')) return 35;
    if (roomRange.includes('35+')) return 50; // Use 50 for 35+
    return 10; // Default fallback
  }

  isCurrentPlan(planRoomRange: string): boolean {
    const sub = this.subscription();
    return this.subscriptionService.isCurrentSubscriptionPlan(sub, planRoomRange);
  }

  isDowngradePlan(planRoomRange: string): boolean {
    const sub = this.subscription();
    return this.subscriptionService.isDowngrade(sub, planRoomRange);
  }

  getPlanActionLabel(planRoomRange: string): string {
    const sub = this.subscription();
    return this.subscriptionService.getPlanActionLabel(sub, planRoomRange);
  }

  onActionClick(plan?: PricingTier): void {
    const sub = this.subscription();
    if (!sub) return;

    if (sub.status === 'TRIAL' || plan) {
      // Determine room count: from plan parameter or next tier
      const roomCount = plan ? this.getRoomCountFromRange(plan.roomRange) : this.getNextTierRoomCount();
      
      this.subscriptionService
        .initiateUpgradePayment(roomCount, environment.paymentReturnUrl)
        .subscribe({
          next: (response) => {
            // Redirect to Paystack checkout
            if (response.checkoutUrl) {
              window.location.href = response.checkoutUrl;
            }
          },
          error: (error) => {
            console.error('Failed to initiate payment:', error);
            // TODO: Show error toast/snackbar
          },
        });
    } else {
      // Show cancel confirmation dialog
      this.openCancelDialog();
    }
  }

  private openCancelDialog(): void {
    const dialogRef = this.dialog.open(CancelSubscriptionDialogComponent, {
      width: '400px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((reason: string | undefined) => {
      if (reason) {
        // Dialog handles the API call and snackbar notifications
        // Nothing additional needed here since dialog refreshes the page on success
      }
    });
  }
}
