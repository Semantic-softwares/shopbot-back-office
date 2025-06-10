import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { SessionStorageService } from '../../../shared/services/session-storage.service';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatTableModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    RouterModule
  ],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent {
  private feedbackService = inject(FeedbackService);
  private sessionStorage = inject(SessionStorageService);
  private userId = this.sessionStorage.getCurrentUser()?._id;

  searchTerm = signal('');
  displayedColumns = ['surveyName', 'feedbackText', 'channel', 'touchPoint', 'feedbackType', 'createdAt', 'actions'];

  public feedbacks = rxResource({
    loader: () => this.feedbackService.getUserFeedbacks(this.userId!)
  });

  public filteredFeedbacks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.feedbacks.value()!.filter(feedback => 
      feedback.feedbackText.toLowerCase().includes(term) ||
      feedback.survey?.name.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }


  viewDetails(feedback: any) {
    console.log(feedback);
  }
}
