import { Routes } from '@angular/router';

export const MY_FEEDBACK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feedback.component').then((m) => m.FeedbackComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./list-feedback/list-feedback.component').then((m) => m.ListFeedbackComponent),
      },
      {
        path: ':feedbackId/survey/:surveyId/user/:userId/question',
        loadComponent: () =>
          import('./survey-question/survey-question.component').then((m) => m.SurveyQuestionComponent),
      },
      {
        path: 'uuid/:uuid',
        loadComponent: () =>
          import('./survey-question/survey-question.component').then((m) => m.SurveyQuestionComponent),
      },
      {
        path: ':feedbackId/survey/:surveyId/user/:userId/responses',
        loadComponent: () =>
          import('./survey-responses/survey-question.component').then((m) => m.SurveyQuestionComponent),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./survey-success/survey-success.component').then((m) => m.SurveySuccessComponent),
      }
    ]
  },
];
