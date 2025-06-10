import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component').then((m) => m.SettingsComponent),
    children: [
      {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full',
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        loadComponent: () => import('./permissions/permissions.component').then((m) => m.PermissionsComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then((m) => m.CategoriesComponent),
      }
    ],
  },
];
