import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Question, QuestionType } from '../../../../../shared/models/question.model';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface Choice {
  text: string;
  isOther: boolean;
}

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <div class="p-6">
      <h2 mat-dialog-title class="text-xl font-semibold mb-4">Add New Question</h2>
      
      <form [formGroup]="questionForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Question</mat-label>
          <input matInput formControlName="name" placeholder="Enter your question">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Question Type</mat-label>
          <mat-select formControlName="questionType">
            @for (type of questionTypes; track type) {
              <mat-option [value]="type">{{type}}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (questionForm.get('questionType')?.value === 'Rating') {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Rating Scale</mat-label>
            <input matInput type="number" formControlName="ratingScale" min="1" max="10">
          </mat-form-field>
        }

        @if (questionForm.get('questionType')?.value === 'Multiple Choice' || questionForm.get('questionType')?.value === 'Single Choice') {
          <div class="space-y-3">
            @for (choice of questionForm.get('choices')?.value; track $index) {
              <div class="flex items-center gap-2">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Choice {{$index + 1}}</mat-label>
                  <input matInput [value]="choice.text" (input)="updateChoice($index, $event)">
                </mat-form-field>
                <mat-checkbox
                  [checked]="choice.isOther"
                  (change)="toggleOtherChoice($index, $event.checked)">
                  Other
                </mat-checkbox>
                <button mat-icon-button color="warn" type="button" (click)="removeChoice($index)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
            <button mat-stroked-button type="button" (click)="addChoice()" class="flex items-center gap-2">
              <mat-icon>add</mat-icon> Add Choice
            </button>
          </div>
        }

        <div class="flex justify-end gap-3 pt-4">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit">Save Question</button>
        </div>
      </form>
    </div>
  `
})
export class QuestionFormComponent {
  questionForm: FormGroup;
  questionTypes: QuestionType[] = ['Rating', 'Single Choice', 'Multiple Choice', 'Free Text'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<QuestionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { surveyId: string; question?: Question }
  ) {
    this.questionForm = this.fb.group({
      id: [data.question?._id || null],
      name: [data.question?.name || '', Validators.required],
      survey: [this.data.surveyId],
      questionType: [data.question?.questionType || '', Validators.required],
      ratingScale: [data.question?.ratingScale || 5],
      choices: [data.question?.choices || []]
    });

    // If editing, initialize the form with existing data
    if (data.question) {
      this.questionForm.patchValue(data.question);
    }
  }

  onSubmit() {
    if (this.questionForm.valid) {
      const newQuestion = {
        ...this.questionForm.value,
        surveyId: this.data.surveyId
      };
      this.dialogRef.close(newQuestion);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  addChoice() {
    const choices = this.questionForm.get('choices')?.value || [];
    choices.push({ text: '', isOther: false });
    this.questionForm.patchValue({ choices });
  }

  removeChoice(index: number) {
    const choices = this.questionForm.get('choices')?.value;
    choices.splice(index, 1);
    this.questionForm.patchValue({ choices });
  }

  updateChoice(index: number, event: any) {
    const choices = this.questionForm.get('choices')?.value;
    choices[index] = {
      ...choices[index],
      text: event.target.value
    };
    this.questionForm.patchValue({ choices });
  }

  toggleOtherChoice(index: number, checked: boolean) {
    const choices = this.questionForm.get('choices')?.value;
    choices[index] = {
      ...choices[index],
      isOther: checked
    };
    this.questionForm.patchValue({ choices });
  }
}
