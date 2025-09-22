import { Routes } from '@angular/router';
// import { adminGuard } from '../shared/guards/admin.guard';

export const MENU_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'menu',
    pathMatch: 'full',
  },
  {
    path: 'erp',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'hms',
    loadChildren: () =>
      import('./hms/hms.routes').then((m) => m.DASHBOARD_HMS_ROUTES),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./menu.component').then((m) => m.MenuComponent),
  },
];
