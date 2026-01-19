import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: '',
        redirectTo: 'info',
        pathMatch: 'full'
      },
      {
        path: 'print-jobs',
        loadComponent: () => import('./print-jobs/print-jobs.component').then(m => m.PrintJobsComponent)
      },
       {
        path: 'info',
        loadComponent: () => import('./hotel-info/hotel-info').then(m => m.HotelInfo)
      },
      {
        path: 'receipt',
        loadComponent: () => import('./receipt-settings/receipt-settings').then(m => m.ReceiptSettings)
      },
      // {
      //   path: 'notification',
      //   loadComponent: () => import('./notifications-settings/notifications-settings').then(m => m.NotificationsSettings)
      // },
      {
        path: 'team',
        loadChildren: () => import('./team/team.routes').then(m => m.TEAM_ROUTES)
      },
    ]
  }
];
