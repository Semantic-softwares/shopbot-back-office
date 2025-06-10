import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, FormControl, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { ActivatedRoute } from '@angular/router';
import { QuestionService } from '../../../../shared/services/question.service';
import { SurveyService } from '../../../../shared/services/survey.service';
import { MatButtonModule } from '@angular/material/button';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { SurveyResponseService } from '../../../../shared/services/survey-response.service';
import { Router } from '@angular/router';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {  MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-survey-question',
  templateUrl: './survey-question.component.html',
  styleUrls: ['./survey-question.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatInputModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ]
})
export class SurveyQuestionComponent  {
  private route = inject(ActivatedRoute);
  private surveyResponseService = inject(SurveyResponseService);
  private feedbackService = inject(FeedbackService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private feedbackId = signal(this.route.snapshot.params['feedbackId']);
  private surveyId = signal(this.route.snapshot.params['surveyId']);
  private userId = signal(this.route.snapshot.params['userId']);
  public surveyForm = this.fb.group({
    user: [this.userId(), Validators.required],
    survey: [this.surveyId(), Validators.required],
    answers: this.fb.array([])
  });

  public surveyFeedbackResponse = rxResource({
    loader: () => this.surveyResponseService.getFeedBackDetailsAndResponses(this.surveyId(), this.userId())
  });

  public feedback = rxResource({
    loader: () => this.feedbackService.getUserFeedbacks(this.userId())
  });

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRatingStars(rating: number) {
    return Array(rating).fill(0);
  }

  getEmptyStars(rating: number, total: number) {
    return Array(total - rating).fill(0);
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/feedback']);
  }

}
