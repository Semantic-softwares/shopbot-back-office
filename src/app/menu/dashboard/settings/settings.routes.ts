import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: '',
        redirectTo: 'print-jobs',
        pathMatch: 'full'
      },
      {
        path: 'print-jobs',
        loadComponent: () => import('./print-jobs/print-jobs.component').then(m => m.PrintJobsComponent)
      }
    ]
  }
];
