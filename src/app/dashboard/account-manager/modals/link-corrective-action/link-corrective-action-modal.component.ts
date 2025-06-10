import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CorrectiveActionsService } from '../../../../shared/services/corrective-actions.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-link-corrective-action-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './link-corrective-action-modal.component.html',
  styles: [`
    .spinner-container {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .action-item {
      padding: 8px 0;
    }
    .action-item h3 {
      margin: 0;
      font-size: 16px;
    }
    .action-item p {
      margin: 4px 0;
      color: rgba(0, 0, 0, 0.6);
    }
    .action-item small {
      display: block;
      color: rgba(0, 0, 0, 0.4);
      margin-top: 4px;
    }
    .action-item small.date {
      text-align: right;
    }
  `]
})
export class LinkCorrectiveActionModalComponent {
  private correctiveActionsService = inject(CorrectiveActionsService);
  private feedbackService = inject(FeedbackService);
  
  linkedCorrectiveControl = new FormControl();
  form = new FormGroup({
    id: this.linkedCorrectiveControl,
  });

  public correctiveActions = rxResource({
    loader: () => this.correctiveActionsService.getCorrectiveActions()
  });

  constructor(
    public dialogRef: MatDialogRef<LinkCorrectiveActionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { feedbackId: string }
  ) {}

  linkAction(actionId: string) {
    if (actionId) {
      this.correctiveActionsService.addFeedbackToCorrectiveAction(actionId, this.data.feedbackId)
        .subscribe({
          next: () => {
            this.feedbackService.updateFeedback(this.data.feedbackId, {
              status: 'PENDING CORRECTIVE ACTION'
            }).subscribe({
              next: () => this.dialogRef.close(true)
            });
          }
        });
    }
  }
}
