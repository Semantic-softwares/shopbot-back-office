import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CompanyService } from '../../../../shared/services/company.service';
import { UserService } from '../../../../shared/services/user.service';
import { TouchPointService } from '../../../../shared/services/touch-point.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

@Component({
  selector: 'app-create-feedback-modal',
  templateUrl: './create-feedback-modal.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
})
export class CreateFeedbackModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateFeedbackModalComponent>);
  private companyService = inject(CompanyService);
  private userService = inject(UserService);
  private touchPointService = inject(TouchPointService);
  private feedbackService = inject(FeedbackService);
  private snackBar = inject(MatSnackBar);
  private selectedCompany = signal<any>(null);
  public feedbackForm = this.fb.group({
    company: ['', Validators.required],
    user: ['', Validators.required],
    touchPoint: ['', Validators.required],
    touchPointReference: [''],
    touchPointDetails: ['']
  });

  public companies = toSignal(this.companyService.getAllCompanies());

  public users = rxResource({
    request: () => ({ id: this.selectedCompany() }),
    loader: ({ request }) => {
        if (!request.id) {
            return of([]);
        }
        return this.userService.getCompanyUsers(request.id)
    }
  });

  public touchPoints = toSignal(this.touchPointService.getTouchPoints());
  public isSubmitting = signal(false);

  onCompanyChange(companyId: string) {
    // Update users based on selected company
    this.selectedCompany.set(companyId);
  }

  onSubmit() {
    if (this.feedbackForm.valid) {
      this.isSubmitting.set(true);
      this.feedbackService.createFeedback(this.feedbackForm.getRawValue()).subscribe({
        next: (data) => {
          this.snackBar.open(data.reason, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(this.feedbackForm.value);
        },
        error: (error) => {
          this.snackBar.open('Error creating feedback', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
