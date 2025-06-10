import { Routes } from '@angular/router';
// import { adminGuard } from '../shared/guards/admin.guard';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
        children: [
            {
                path: '',
                redirectTo: 'reports',
                pathMatch: 'full',
            },
            {
                path: 'reports',
                loadChildren: () => import('./reports/reports.routes').then(m => m.DASHBOARD_REPORTS_ROUTES)
            },
            {
                path: 'items',
                loadChildren: () => import('./items/items.routes').then(m => m.DASHBOARD_ITEMS_ROUTES)
            },
            {
                path: 'employees',
                loadChildren: () => import('../authentication/employees/employees.routes').then(m => m.DASHBOARD_EMPLOYEES_ROUTES)
            }
        ]
    }
];
