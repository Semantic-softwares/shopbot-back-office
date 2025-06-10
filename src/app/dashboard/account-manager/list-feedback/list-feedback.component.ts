import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Preference } from '../../../shared/models/preference.model';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { SessionStorageService } from '../../../shared/services/session-storage.service';
import { CreateFeedbackModalComponent } from '../modals/create-feedback/create-feedback-modal.component';
import { ReviewFeedbackModalComponent } from '../modals/review-feedback/review-feedback-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CorrectiveActionFormComponent } from '../modals/corrective-action-form/corrective-action-form.component';
import { CorrectiveActionsService } from '../../../shared/services/corrective-actions.service';
import { LinkCorrectiveActionModalComponent } from '../modals/link-corrective-action/link-corrective-action-modal.component';

@Component({
  selector: 'app-list-feedback',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    HasPermissionDirective,
    RouterModule
  ],
  templateUrl: './list-feedback.component.html',

})


export class ListFeedbackComponent {
  private feedbackService = inject(FeedbackService);
  private dialog = inject(MatDialog);
  private sessionStorage = inject(SessionStorageService);
  private snackBar = inject(MatSnackBar);
  private correctiveActionsService = inject(CorrectiveActionsService);
  private companyId = this.sessionStorage.getCurrentUser()?.company;
  searchTerm = signal('');
  displayedColumns = [
    'user',
    'company',
    'touchPointReference',
    'sent',
    'survey',
    'touchPoint',
    "status",
    'actions',
  ];

  public feedbacks = rxResource({
    loader: () => this.feedbackService.getFeedbacks(),
  });

  public filteredPreferences = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.feedbacks
      .value()!
      .filter((feedback) =>
        feedback.user.name.toLowerCase().includes(term)
      );
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateFeedbackModalComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.feedbacks.reload();
      }
    });
  }

  editPreference(preference: Preference) {
    const dialogRef = this.dialog.open(CreateFeedbackModalComponent, {
      data: { preference },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.feedbacks.reload();
      }
    });
  }

  deletePreference(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Preference',
        message: 'Are you sure you want to delete this preference?',
        confirmButtonText: 'Delete',
        showCancelButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.feedbackService.deleteFeedback(id).subscribe({
          next: () => {
            this.feedbacks.reload();
          },
          error: (error) => {
            this.dialog.open(ConfirmationDialogComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message: 'Failed to delete preference. Please try again.',
                confirmButtonText: 'OK',
                showCancelButton: false,
              },
            });
          },
        });
      }
    });
  }


  public createCorrectiveAction(feedbackId: string) {
    const dialogRef = this.dialog.open(CorrectiveActionFormComponent, {
      width: '600px',
      data: { feedbackId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // After creating corrective action, link it to the feedback and update status
        this.correctiveActionsService.addFeedbackToCorrectiveAction(result._id, feedbackId)
          .subscribe({
            next: () => {
              // Update feedback status
              this.feedbackService.updateFeedback(feedbackId, { status: 'PENDING CORRECTIVE ACTION' })
                .subscribe({
                  next: () => {
                    this.snackBar.open('Corrective action created and linked successfully', 'Close', {
                      duration: 3000,
                      horizontalPosition: 'end',
                      verticalPosition: 'top'
                    });
                    this.feedbacks.reload();
                  },
                  error: (error) => {
                    this.snackBar.open('Error updating feedback status', 'Close', {
                      duration: 3000,
                      horizontalPosition: 'end',
                      verticalPosition: 'top'
                    });
                  }
                });
            },
            error: (error) => {
              this.snackBar.open('Error linking feedback to corrective action', 'Close', {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top'
              });
            }
          });
      }
    });
  }

  public linkToCorrectiveAction(feedbackId: string) {
    const dialogRef = this.dialog.open(LinkCorrectiveActionModalComponent, {
      width: '600px',
      data: { feedbackId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Feedback linked to corrective action successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.feedbacks.reload();
      }
    });
  }

  public archiveFeedback(feedbackId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Archive Feedback',
        message: 'Are you sure you want to archive this feedback?',
        confirmButtonText: 'Archive',
        showCancelButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.feedbackService.updateFeedback(feedbackId, {status: 'ARCHIVED'}).subscribe({
          next: () => {
            this.snackBar.open('Feedback archived successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.feedbacks.reload();
          },
          error: (error) => {
            this.snackBar.open('Failed to archive feedback. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            console.error('Error archiving feedback:', error);
          },
        });
      }
    });
  }

  reviewFeedback(feedbackId: string) {
    const dialogRef = this.dialog.open(ReviewFeedbackModalComponent, {
      width: '400px',
      data: { feedbackId }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.feedbacks.reload();
      }
    });
  }
}
