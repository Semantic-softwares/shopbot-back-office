import { Component, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from "@angular/material/icon";
import { CancelSubscriptionDialogComponent } from './cancel-subscription-dialog/cancel-subscription-dialog.component';
import { Subscription } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';
import { SubscriptionService } from '../../../../shared/services/subscription.service';

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
  ],
  templateUrl: './current-plan.html',
})
export class CurrentPlanComponent {
  subscription = input<Subscription | null>(null);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  readonly paidPrice = 87.45;

  getButtonLabel(): string {
    const sub = this.subscription();
    if (!sub) return 'Cancel Subscription';
    return sub.status === 'TRIAL' ? 'Upgrade to Paid Plan' : 'Cancel Subscription';
  }

  getPlanLabel(): string {
    const sub = this.subscription();
    if (!sub || sub.status === 'TRIAL') return 'Free Trial';
    return 'Paid Plan — All Features';
  }

  onActionClick(): void {
    const sub = this.subscription();
    if (!sub) return;

    if (sub.status === 'TRIAL') {
      // Upgrade to paid plan
      this.subscriptionService
        .initiateUpgradePayment(undefined, environment.paymentReturnUrl)
        .subscribe({
          next: (response) => {
            if (response.checkoutUrl) {
              window.location.href = response.checkoutUrl;
            }
          },
          error: (error) => {
            console.error('Failed to initiate payment:', error);
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
      }
    });
  }
}
