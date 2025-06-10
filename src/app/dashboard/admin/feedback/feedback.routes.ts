import { Routes } from '@angular/router';

export const DASHBOARD_FEEDBACK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feedback.component').then((m) => m.FeedbackComponent),
    children: [
      {
        path: '',
        redirectTo: 'surveys',
        pathMatch: 'full',
      },
   
      {
        path: 'channels',
        loadComponent: () =>
          import('./channels/channels.component').then((m) => m.ChannelsComponent),
      },
      {
        path: 'touch-points',
        loadComponent: () =>
          import('./touch-points/touch-points.component').then((m) => m.TouchPointsComponent),
      },
      {
        path: 'surveys',
        loadChildren: () =>
          import('./surveys/survey.routing').then((m) => m.DASHBOARD_SURVEY_ROUTES),
      },
      {
        path: 'preferences',
        loadComponent: () =>
          import('./preferences/preferences.component').then((m) => m.PreferencesComponent),
      }
    ]
  },
];
