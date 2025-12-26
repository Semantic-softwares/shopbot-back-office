import { Routes } from '@angular/router';
import { roleGuard } from '../../../shared/guards/role.guard';

export const DASHBOARD_HMS_REPORTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./reports.component').then(m => m.ReportsComponent),
        children: [
            {
                path: '',
                redirectTo: 'occupancy',
                pathMatch: 'full',
            },
            {
                path: 'occupancy',
                loadComponent: () => import('./occupancy-report/occupancy-report.component').then(m => m.OccupancyReportComponent),
                canActivate: [roleGuard],
                data: { requiredPermission: 'finance.reports.view' }
            },
            {
                path: 'revenue',
                loadComponent: () => import('./revenue-report/revenue-report.component').then(m => m.RevenueReportComponent),
                canActivate: [roleGuard],
                data: { requiredPermission: 'finance.reports.view' }
            },
            {
                path: 'guest',
                loadComponent: () => import('./guest-report/guest-report.component').then(m => m.GuestReportComponent),
                canActivate: [roleGuard],
                data: { requiredPermission: 'finance.reports.view' }
            },
            // TODO: Add more report types as components are created
            // {
            //     path: 'guest-analytics',
            //     loadComponent: () => import('./guest-analytics/guest-analytics.component').then(m => m.GuestAnalyticsComponent)
            // },
            {
                path: '**',
                redirectTo: 'occupancy'
            }
        ]
    }
];