import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SurveyService } from '../../../../../shared/services/survey.service';
import { ChannelService } from '../../../../../shared/services/orders.service';
import { TouchPointService } from '../../../../../shared/services/touch-point.service';
import { FEEDBACK_TYPES } from '../../../../../shared/constants/feedback-types.constant';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
@Component({
  selector: 'app-create-survey',
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
    MatSlideToggleModule
  ],
  templateUrl: './create-survey.component.html'
})
export class CreateSurveyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private surveyService = inject(SurveyService);
  private channelService = inject(ChannelService);
  private touchPointService = inject(TouchPointService);
  public dialogRef = inject(MatDialogRef<CreateSurveyComponent>);
  public data: any = inject(MAT_DIALOG_DATA);

  public surveyForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    touchPoint: ['', Validators.required],
    channel: ['', Validators.required],
    feedbackType: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    status: [false]
  });

  public touchPoints = rxResource({
    loader: () => this.touchPointService.getTouchPoints().pipe(tap(() => {
        if (this.data) {
            this.surveyForm.patchValue({touchPoint: this.data.touchPoint._id})
        }
    }))
  });

  public channels = rxResource({
    loader: () => this.channelService.getChannels().pipe(tap(() => {
        if (this.data) {
         this.surveyForm.patchValue({channel: this.data.channel._id})
        }
    }))
  });

  public feedback_types = FEEDBACK_TYPES;
  
  ngOnInit() {
    if (this.data) {
      this.surveyForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.surveyForm.valid) {
      const survey:any = this.surveyForm.getRawValue();
      if (this.data) {
        this.surveyService.updateSurvey(this.data._id!, survey).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.surveyService.createSurvey(survey).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }
}
