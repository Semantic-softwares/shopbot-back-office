import { Routes } from '@angular/router';

export const DASHBOARD_EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./employees.component').then((m) => m.EmployeesComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () => import('./list/list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'timecards',
        loadChildren: () => import('./timecards/timecards.routes').then(m => m.TIMECARDS_ROUTES)
      }
    ],
  },
];
