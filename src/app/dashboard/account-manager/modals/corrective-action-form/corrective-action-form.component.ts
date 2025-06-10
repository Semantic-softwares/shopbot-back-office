import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CorrectiveActionsService } from '../../../../shared/services/corrective-actions.service';
import { UserService } from '../../../../shared/services/user.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { FeedbackService } from '../../../../shared/services/feedback.service';

@Component({
  selector: 'app-corrective-action-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatNativeDateModule,
  ],
  templateUrl: './corrective-action-form.component.html',
})
export class CorrectiveActionFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CorrectiveActionFormComponent>);
  private correctiveActionsService = inject(CorrectiveActionsService);
  private feedbackService = inject(FeedbackService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  public isSubmitting = signal(false);
  public data: any = inject(MAT_DIALOG_DATA);
  public form = this.fb.group({
    title: [this.data?.title, Validators.required],
    details: [this.data?.details, Validators.required],
    owner: [this.data?.owner, Validators.required],
    eta: [this.data?.eta, Validators.required],
    status: [this.data?.status, Validators.required],
  });

  public users = rxResource({
    loader: () =>
      this.userService.getRootUsers().pipe(
        tap(() => {
          if (this.data && this.data?.owner) {
            this.form.patchValue({ owner: this.data.owner._id });
          }
           
        })
      ),
  });

  onSubmit() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const formData = this.form.getRawValue();
      const isClosingAction = formData.status === 'Closed' && this.data?.status !== 'Closed';

      // Choose the appropriate service method based on whether we're editing or creating
      const serviceCall = this.data?._id 
        ? this.correctiveActionsService.updateCorrectiveAction(this.data._id, formData)
        : this.correctiveActionsService.createCorrectiveAction(formData);

      serviceCall.subscribe({
        next: (data) => {
          if (isClosingAction && this.data?._id && this.data?.feedback?.length) {
            this.data.feedback.forEach((feedbackId: string) => {
              this.feedbackService
                .updateFeedback(feedbackId, { status: 'CA Completed' })
                .subscribe();
            });
          }
          
          this.snackBar.open(
            `Corrective action ${this.data?._id ? 'updated' : 'created'} successfully`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
          this.dialogRef.close(data);
        },
        error: (error) => {
          this.snackBar.open(`Error ${this.data?._id ? 'updating' : 'creating'} corrective action`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
