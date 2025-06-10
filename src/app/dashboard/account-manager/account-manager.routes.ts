import { Routes } from '@angular/router';

export const ACCOUNT_MANAGER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./account-manager.component').then(m => m.AccountManagerComponent),
        children: [
            {
                path: '',
                redirectTo: 'feedback-reviews',
                pathMatch: 'full',
            },
            {
                path: 'feedback-reviews',
                loadComponent: () => import('./list-feedback/list-feedback.component').then(m => m.ListFeedbackComponent)
            },
            {
                path: 'corrective-actions',
                loadComponent: () => import('./corrective-actions/list-corrective-actions.component').then(m => m.ListCorrectiveActionsComponent)
            },
            {
                path: 'feedback/survey/:surveyId/user/:userId',
                loadComponent: () =>
                  import('./feedback-details/feedback-details.component').then((m) => m.FeedbackDetailsComponent),
              },
        ]
    }
];
