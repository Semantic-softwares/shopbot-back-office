import { Routes } from '@angular/router';
import { RoleGuard } from '../../shared/guards/role.guard';

export const DASHBOARD_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin.component').then((m) => m.AdminComponent),

    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./users/users.routes').then((m) => m.USERS_ROUTES),
        data: { requiredPermission: 'manage_users' },
        canActivate: [RoleGuard],
      },
      {
        path: 'companies',
        loadChildren: () =>
          import('./companies/companies.routes').then(
            (m) => m.COMPANIES_ROUTES
          ),
        data: { requiredPermission: ['manage_companies'] },
        canActivate: [RoleGuard],
      },
      {
        path: 'feedback',
        loadChildren: () =>
          import('./feedback/feedback.routes').then(
            (m) => m.DASHBOARD_FEEDBACK_ROUTES
          ),
        data: { requiredPermission: 'manage_feedback' },
        canActivate: [RoleGuard],
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
        data: { requiredPermission: 'manage_settings' },
        canActivate: [RoleGuard],
      },
    ],
  },
];
