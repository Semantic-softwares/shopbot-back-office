import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { SurveyResponseService } from '../../../shared/services/survey-response.service';


@Component({
  selector: 'app-feedback-details',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatDividerModule, 
    MatChipsModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './feedback-details.component.html',
})
export class FeedbackDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyResponseService = inject(SurveyResponseService);

  feedbackId = this.route.snapshot.params['id'];
  surveyId = this.route.snapshot.params['surveyId'];
  userId = this.route.snapshot.params['userId'];

  surveyFeedbackResponse = rxResource({
    loader: () => this.surveyResponseService.getFeedBackDetailsAndResponses(this.surveyId, this.userId)
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
