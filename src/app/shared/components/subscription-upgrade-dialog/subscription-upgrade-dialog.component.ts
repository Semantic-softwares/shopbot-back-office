import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SubscriptionService, SubscriptionPlan } from '../../../services/subscription.service';

@Component({
  selector: 'app-subscription-upgrade-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './subscription-upgrade-dialog.component.html',
  styleUrls: ['./subscription-upgrade-dialog.component.scss']
})
export class SubscriptionUpgradeDialogComponent {
  subscriptionService = inject(SubscriptionService);
  selectedPlan: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<SubscriptionUpgradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { storeId: string }
  ) {}

  getPlansArray(plans: Record<string, SubscriptionPlan> | null) {
    if (!plans) return [];
    return Object.entries(plans).map(([key, value]) => ({ key, value }));
  }

  formatPrice(price: number): string {
    return price === 0 ? 'Free' : `$${price}/mo`;
  }

  selectPlan(planKey: string) {
    this.selectedPlan = planKey;
  }

  isCurrentPlan(planKey: string): boolean {
    const subscription = this.subscriptionService.currentSubscription();
    return subscription?.tier === planKey;
  }

  getSelectedPlanName(): string {
    if (!this.selectedPlan) return '';
    const plans = this.subscriptionService.subscriptionPlans();
    return plans?.[this.selectedPlan]?.name || '';
  }

  onUpgrade() {
    if (this.selectedPlan && this.data.storeId) {
      this.subscriptionService.upgradeSubscription(this.data.storeId, this.selectedPlan)
        .subscribe({
          next: () => {
            this.subscriptionService.refreshData();
            this.dialogRef.close({ upgraded: true, plan: this.selectedPlan });
          },
          error: (error) => {
            console.error('Upgrade failed:', error);
          }
        });
    }
  }

  onCancel() {
    this.dialogRef.close({ upgraded: false });
  }
}