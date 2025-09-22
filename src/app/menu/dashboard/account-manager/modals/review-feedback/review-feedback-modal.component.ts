import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../../shared/services/feedback.service';

@Component({
  selector: 'app-review-feedback-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Review Feedback</h2>
    <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="flex flex-col gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Impact</mat-label>
            <mat-select formControlName="impact">
              <mat-option [value]="1">1 - High</mat-option>
              <mat-option [value]="2">2</mat-option>
              <mat-option [value]="3">3</mat-option>
              <mat-option [value]="4">4</mat-option>
              <mat-option [value]="5">5 - Low</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Complexity</mat-label>
            <mat-select formControlName="complexity">
              <mat-option [value]="1">1 - Easy</mat-option>
              <mat-option [value]="2">2</mat-option>
              <mat-option [value]="3">3</mat-option>
              <mat-option [value]="4">4</mat-option>
              <mat-option [value]="5">5 - Hard</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close [disabled]="isSubmitting()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" 
          [disabled]="!reviewForm.valid || isSubmitting()">
          {{isSubmitting() ? 'Submitting...' : 'Submit'}}
        </button>
      </mat-dialog-actions>
    </form>
  `
})
export class ReviewFeedbackModalComponent {
  private fb = inject(FormBuilder);
  private feedbackService = inject(FeedbackService);
  private dialogRef = inject(MatDialogRef<ReviewFeedbackModalComponent>);
  private snackBar = inject(MatSnackBar);
  
  isSubmitting = signal(false);

  reviewForm: FormGroup = this.fb.group({
    impact: ['', Validators.required],
    complexity: ['', Validators.required],
    status: ['REVIEWED', Validators.required]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { feedbackId: string }) {}

  onSubmit() {
    if (this.reviewForm.valid) {
      this.isSubmitting.set(true);
      this.feedbackService.updateFeedback(this.data.feedbackId, this.reviewForm.value)
        .subscribe({
          next: (result) => {
            this.isSubmitting.set(false);
            this.snackBar.open('Feedback reviewed successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(result);
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.snackBar.open('Error reviewing feedback. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            console.error('Error submitting review:', error);
          }
        });
    }
  }
}
