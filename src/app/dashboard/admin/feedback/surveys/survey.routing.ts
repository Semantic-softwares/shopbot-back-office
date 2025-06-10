import { Routes } from '@angular/router';

export const DASHBOARD_SURVEY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./surveys.component').then((m) => m.SurveysComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./list-surveys/list-surveys.component').then((m) => m.ListSurveysComponent),
      },
      {
        path: ':id/details',
        loadComponent: () =>
          import('./survey-details/survey-details.component').then((m) => m.SurveyDetailsComponent),
      },
     
    ]
  },
];