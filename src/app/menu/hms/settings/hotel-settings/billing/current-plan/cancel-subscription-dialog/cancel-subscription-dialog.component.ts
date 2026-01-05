import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../../../../../../shared/services/subscription.service';

@Component({
  selector: 'app-cancel-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './cancel-subscription-dialog.html',
  styleUrl: './cancel-subscription-dialog.scss',
})
export class CancelSubscriptionDialogComponent {
  private dialogRef = inject(MatDialogRef<CancelSubscriptionDialogComponent>);
  private subscriptionService = inject(SubscriptionService);
  private snackBar = inject(MatSnackBar);
  
  reason = '';
  selectedReason = '';
  isSubmitting = signal(false);

  reasons = [
    'Too expensive',
    'Not using the features',
    'Found a better alternative',
    'Business closure',
    'Other',
  ];

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    const finalReason = this.selectedReason === 'Other' ? this.reason : this.selectedReason;
    if (!finalReason.trim()) return;
    
    this.isSubmitting.set(true);
    
    this.subscriptionService.cancelSubscription(finalReason).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.snackBar.open('Subscription cancelled successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
        });
        // Close dialog on success
        this.dialogRef.close(finalReason);
        // Refresh page to show updated subscription state
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const errorMessage = error?.error?.message || 'Failed to cancel subscription. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 6000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
        });
        // Keep dialog open on error so user can retry
      },
    });
  }
}
