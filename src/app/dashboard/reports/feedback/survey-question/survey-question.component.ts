import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, FormControl, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { ActivatedRoute } from '@angular/router';
import { Question } from '../../../../shared/models/question.model';
import { QuestionService } from '../../../../shared/services/question.service';
import { SurveyService } from '../../../../shared/services/survey.service';
import { MatButtonModule } from '@angular/material/button';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { SurveyResponseService } from '../../../../shared/services/survey-response.service';
import { Router } from '@angular/router';
import { SurveyResponse } from '../../../../shared/models/survey-response.model';
import { RatingFieldComponent } from './question-type-field/rating-field/rating-field.component';
import { SingleChoiceFieldComponent } from './question-type-field/single-choice-field/single-choice-field.component';
import { of, tap } from 'rxjs';
import { MultipleChoiceFieldComponent } from './question-type-field/multiple-choice-field/multiple-choice-field.component';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    RatingFieldComponent,
    SingleChoiceFieldComponent,
    MultipleChoiceFieldComponent,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class SurveyQuestionComponent  {
  private route = inject(ActivatedRoute);
  private questionService = inject(QuestionService);
  private surveyService = inject(SurveyService);
  private surveyResponseService = inject(SurveyResponseService);
  private feedbackService = inject(FeedbackService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private feedbackId = signal(this.route.snapshot.params['feedbackId']);
  private surveyId = signal(this.route.snapshot.params['surveyId']);
  private userId = signal(this.route.snapshot.params['userId']);
  private uuid = signal(this.route.snapshot.params['uuid']);
  public currentQuestionIndex = 0;

  public surveyForm = this.fb.group({
    user: [this.userId(), Validators.required],
    survey: [this.surveyId(), Validators.required],
    answers: this.fb.array([])
  });

  public feedback = rxResource({
    request: () => ({ id: this.uuid() }),
    loader: ({ request }) => {
      return request.id ? this.feedbackService.getFeedbackByUuid(request.id).pipe(
        tap((feedback) => {
          if (feedback.survey?.hasTaken) {
            this.snackBar.open('You have already completed this survey', 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            });
            this.router.navigate(['/dashboard/general/feedback/list'], {
              queryParams: {
                uuid: this.uuid()
              }
            });
            return;
          }
          this.surveyForm.patchValue({
            user: feedback.user._id,
            survey: feedback.survey?._id
          });
        })
      ) : of(null);
    }
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

  public survey = rxResource({
    request: () => ({ id:  this.feedback.value()?.survey?._id  || this.surveyId() }),
    loader: ({ request }) => {
     return !!request.id ? this.surveyService.getSurvey(request.id) : of()
    }
  });

  // Data fetching
  public questions = rxResource({
    request: () => ({ id: this.surveyId() || this.feedback.value()?.survey?._id }),
    loader: ({ request }) => 
      request.id ?
      this.questionService.findBySurvey(request.id).pipe(
      tap(questions => {
        if (questions) {
          const answersArray = this.surveyForm.get('answers') as FormArray;
          answersArray.clear(); // Clear existing controls
          
          questions.forEach((question: Question) => {
            let answerControl: FormControl;
            
            switch (question.questionType) {
              case 'Multiple Choice':
                answerControl = this.fb.control([], [Validators.required, Validators.minLength(1)]);
                break;
              case 'Rating':
                answerControl = this.fb.control(null, [
                  Validators.required,
                  Validators.min(1),
                  Validators.max(5)
                ]);
                break;
              default:
                answerControl = this.fb.control(null, Validators.required);
            }
            
            answersArray.push(this.fb.group({
              questionId: [question._id],
              answer: answerControl
            }));
          });
        }
      }) 
    ) : of()
  });

  
  // Answer tracking
  answers = new Map<string, any>();
  
  selectedAnswer: any;
  selectedAnswers: string[] = [];
  textAnswer = '';
  hoverRating: number = 0;

  handleSingleChoice(question: Question, value: string) {
    this.selectedAnswer = value;
    this.handleAnswer(question, value);
  }

  handleMultipleChoice(question: Question, value: string, checked: boolean) {
    // Get existing answers for this question or initialize new array
    let currentAnswers = this.answers.get(question._id!) || [];
    
    // Ensure currentAnswers is always an array
    if (!Array.isArray(currentAnswers)) {
      currentAnswers = [];
    }

    if (checked) {
      if (!currentAnswers.includes(value)) {
        currentAnswers.push(value);
      }
    } else {
      currentAnswers = currentAnswers.filter((item:any) => item !== value);
    }

    // Update both the answers map and selectedAnswers array
    this.answers.set(question._id!, currentAnswers);
    this.selectedAnswers = currentAnswers;
  }

  handleRating(question: Question, value: number) {
    this.handleAnswer(question, value);
  }

  getRatingForQuestion(questionId: string): number {
    return (this.answers.get(questionId) as number) || 0;
  }

  handleAnswer(question: Question, value: any) {
    if (question.questionType === 'Multiple Choice') {
      // Ensure we're storing an array
      const answerArray = Array.isArray(value) ? value : [value];
      this.answers.set(question._id!, answerArray);
    } else {
      this.answers.set(question._id!, value);
    }
  }

  nextQuestion() {
    const currentQuestion = this.questions.value()?.[this.currentQuestionIndex];
    if (!currentQuestion) return;

    const control = this.surveyForm.get(currentQuestion._id);
    if (control?.invalid) {
      control.markAsTouched();
      return;
    }

    if (this.currentQuestionIndex < (this.questions.value()?.length || 0) - 1) {
      this.currentQuestionIndex++;
      // Reset temporary answer tracking variables for the new question
      this.selectedAnswer = null;
      this.selectedAnswers = [];
      this.textAnswer = '';
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  async submitSurvey() {
    if (this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.surveyForm.value;
      const surveyResponse: SurveyResponse = {
        user: formValue.user!,
        survey: formValue.survey!,
        answers: formValue.answers!.map((answer: any) => ({
          question: answer.questionId,
          answer: Array.isArray(answer.answer) ? 
            answer.answer.join(',') : 
            answer.answer.toString()
        }))
      };

      await this.surveyResponseService.create(surveyResponse).toPromise();
      await this.feedbackService.updateFeedback(this.feedbackId() || this.feedback.value()?.survey?._id, {status: 'RESPONDED'}).toPromise();
      this.router.navigate(['../../../../../../success'], { relativeTo: this.route });
    } catch (error) {
      console.error('Error submitting survey:', error);
    }
  }

  isQuestionValid(questionId: string): boolean {
    const control = this.surveyForm.get(questionId);
    return control ? control.valid && control.touched : false;
  }

  getErrorMessage(questionId: string): string {
    const control = this.surveyForm.get(questionId);
    if (!control) return '';
    
    if (control.hasError('required')) {
      return 'This question is required';
    }
    if (control.hasError('min')) {
      return 'Please provide a rating of at least 1';
    }
    if (control.hasError('max')) {
      return 'Rating cannot exceed 5';
    }
    return '';
  }

  getAnswerControl(index: number): FormGroup {
    return (this.surveyForm.get('answers') as FormArray).at(index) as FormGroup;
  }
}
