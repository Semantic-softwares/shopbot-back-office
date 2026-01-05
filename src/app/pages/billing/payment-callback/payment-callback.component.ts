import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../../shared/services/subscription.service';
@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './payment-callback.component.html',
})
export class PaymentCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private subscriptionService = inject(SubscriptionService);

  isProcessing = signal<boolean>(true);
  isSuccess = signal<boolean>(false);
  isError = signal<boolean>(false);
  errorMessage = signal<string>('An error occurred. Please try again.');

  private roomCount = 0;
  private reference = '';
  private storeId = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.reference = params['reference'];
      this.roomCount = parseInt(params['roomCount'] || '0', 10);
      this.storeId = params['storeId'];

      if (this.reference && this.storeId) {
        this.verifyPayment();
      } else {
        this.handleError('Missing payment reference or store ID');
      }
    });
  }

  private verifyPayment(): void {
    this.subscriptionService.verifyUpgradePayment(this.reference, this.roomCount, this.storeId).subscribe({
      next: (subscription) => {
        this.isProcessing.set(false);
        this.isSuccess.set(true);
        this.snackBar.open('Payment successful! Your subscription is now active.', 'Close', {
          duration: 5000,
        });
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Payment verification failed';
        this.handleError(errorMsg);
      },
    });
  }

  private handleError(message: string): void {
    this.isProcessing.set(false);
    this.isError.set(true);
    this.errorMessage.set(message);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/menu/hms']);
  }

  retryPayment(): void {
    this.router.navigate(['/pricing']);
  }

  contactSupport(): void {
    window.location.href = 'mailto:support@shopbot.com';
  }
}
