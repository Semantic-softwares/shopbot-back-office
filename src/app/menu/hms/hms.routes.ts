import { Routes } from '@angular/router';

export const DASHBOARD_HMS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./hms-dashboard.component').then(m => m.HmsDashboardComponent),
        children: [
            {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full',
            },
            {
                path: 'overview',
                loadComponent: () => import('./overview/overview.component').then(m => m.OverviewComponent)
            },
            {
                path: 'front-desk',
                loadChildren: () => import('./front-desk/front-desk.routes').then(m => m.DASHBOARD_FRONT_DESK_ROUTES)
            },
            {
                path: 'rooms-management',
                loadChildren: () => import('./rooms-management/rooms-managements.routes').then(m => m.ROOMS_MANAGEMENT_ROUTES)
            },
            {
                path: 'reports',
                loadChildren: () => import('./reports/reports.routes').then(m => m.DASHBOARD_HMS_REPORTS_ROUTES)
            },
            {
                path: 'settings',
                loadChildren: () => import('./settings/settings.routes').then(m => m.SETTINGS_MANAGEMENT_ROUTES)
            },
            // TODO: Add more routes as components are created
            {
                path: '**',
                redirectTo: 'overview'
            }
        ]
    }
];