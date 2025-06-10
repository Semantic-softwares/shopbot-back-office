import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { QuestionService } from '../../../../../shared/services/question.service';
import {  QuestionType } from '../../../../../shared/models/question.model';
import { QuestionFormComponent } from '../../modals/question-form/question-form.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { Question } from '../../../../../shared/models/question.model';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { SurveyService } from '../../../../../shared/services/survey.service';

@Component({
  selector: 'app-survey-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    DragDropModule,
    RouterModule
  ],
  templateUrl: './survey-details.component.html'
})
export class SurveyDetailsComponent  {
  private questionService = inject(QuestionService);
  private surveyService = inject(SurveyService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  public questionTypes: QuestionType[] = ['Rating', 'Single Choice', 'Multiple Choice', 'Free Text'];
  private surveyId = signal(this.route.snapshot.params['id']);
  
  public questions = rxResource({
    request: () => ({ id: this.surveyId() }),
    loader: ({ request }) => this.questionService.findBySurvey(request.id)
  });

  public survey = rxResource({
    request: () => ({ id: this.surveyId() }),
    loader: ({ request }) => this.surveyService.getSurvey(request.id)
  });

  openQuestionForm() {
    const dialogRef = this.dialog.open(QuestionFormComponent, {
      width: '600px',
      data: { surveyId: this.surveyId() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.questionService.create(result).subscribe({
          next: (question) => {
            this.questions.reload();
          },
          error: (error) => {
            console.error('Error creating question:', error);
          }
        });
      }
    });
  }

  editQuestion(question: Question) {
    const dialogRef = this.dialog.open(QuestionFormComponent, {
      width: '600px',
      data: {
        surveyId: this.surveyId(),
        question: question
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.questionService.update(question._id!, result).subscribe({
          next: () => {
            this.questions.reload();
          },
          error: (error) => {
            console.error('Error updating question:', error);
            // Optionally handle error (show snackbar, etc.)
          }
        });
      }
    });
  }

  deleteQuestion(question: Question) {
    if (confirm('Are you sure you want to delete this question?')) {
      // Call your service to delete the question
      this.questionService.delete(question._id!).subscribe({
        next: () => {
          this.questions.reload(); // Reload questions after deletion
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          // Handle error (show snackbar, etc.)
        }
      });
    }
  }

  async drop(event: CdkDragDrop<Question[]>) {
    if (event.previousIndex === event.currentIndex) return;
    
    const questions = this.questions.value() || [];
    moveItemInArray(questions, event.previousIndex, event.currentIndex);
    
    try {
      // Update each question's order sequentially
      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        await firstValueFrom(
          this.questionService.update(question._id!, { order: index + 1 })
        );
      }
      
      // Update the UI after all updates are successful
      this.questions.set(questions);
    } catch (error) {
      console.error('Failed to update questions order:', error);
      // Revert to original order if any update fails
      // this.questions.reload();
    }
  }
}
