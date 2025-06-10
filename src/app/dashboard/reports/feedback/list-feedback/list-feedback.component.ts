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
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { SessionStorageService } from '../../../../shared/services/session-storage.service';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    RouterModule,
    ClipboardModule,
    MatSnackBarModule,
  ],
  templateUrl: './list-feedback.component.html',
  styleUrl: './list-feedback.component.scss',
})
export class ListFeedbackComponent {
  private feedbackService = inject(FeedbackService);
  private sessionStorage = inject(SessionStorageService);
  private route = inject(ActivatedRoute);
  private userId = this.sessionStorage.getCurrentUser()?._id;
  public linkUrl = environment.appHost;
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  public searchTerm = signal('');
  public displayedColumns = [
    'surveyName',
    'channel',
    'touchPoint',
    'surveyStatus',
    'feedbackType',
    'link',
    'createdAt',
    'actions',
  ];

  public feedbacks = rxResource({
    loader: () => this.feedbackService.getUserFeedbacks(this.userId!),
  });

  public filteredFeedbacks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.feedbacks.value()!.filter((feedback) => {
      return (
        feedback.survey?.name.toLowerCase().includes(term) ||
        feedback?.uuid?.toLowerCase().includes(term)
      );
    });
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['uuid']) {
        this.searchTerm.set(params['uuid']);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  viewDetails(feedback: any) {
    console.log(feedback);
  }

  getSurveyLink(uuid: string) {
    return `${this.linkUrl}/dashboard/general/feedback/uuid/${uuid}`;
  }

  onCopyLink(uuid: string) {
    const link = this.getSurveyLink(uuid);
    this.snackBar.open('Link copied to clipboard!', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  openSurveyInNewTab(feedback: any) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [
          '../',
          feedback._id,
          'survey',
          feedback.survey._id,
          'user',
          feedback.user._id,
          'question',
        ],
        {
          relativeTo: this.route,
        }
      )
    );
    // Combine with the origin to get the full absolute URL

    const absoluteUrl = `${window.location.origin}${url}`;
    window.open(absoluteUrl, '_blank');
  }
}
