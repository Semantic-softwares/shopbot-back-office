import { Routes } from '@angular/router';
import { roleGuard } from '../../../shared/guards/role.guard';

export const DASHBOARD_HMS_REPORTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./reports.component').then(m => m.ReportsComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./reports-hub/reports-hub.component').then(m => m.ReportsHubComponent),
                canActivate: [roleGuard],
                data: { requiredPermissions: ['hotel.reports.view', 'finance.reports.view'], permissionMode: 'any' }
            },
            {
                path: 'occupancy',
                loadComponent: () => import('./occupancy-report/occupancy-report.component').then(m => m.OccupancyReportComponent),
                canActivate: [roleGuard],
                data: { requiredPermissions: ['hotel.reports.view', 'finance.reports.view'], permissionMode: 'any' }
            },
            {
                path: 'revenue',
                loadComponent: () => import('./revenue-report/revenue-report.component').then(m => m.RevenueReportComponent),
                canActivate: [roleGuard],
                data: { requiredPermissions: ['hotel.reports.view', 'finance.reports.view'], permissionMode: 'any' }
            },
            {
                path: 'guest',
                loadComponent: () => import('./guest-report/guest-report.component').then(m => m.GuestReportComponent),
                canActivate: [roleGuard],
                data: { requiredPermissions: ['hotel.reports.view', 'finance.reports.view'], permissionMode: 'any' }
            },
            // Every list report has its own page: /reports/<category>/<report>
            {
                path: ':category/:report',
                loadComponent: () => import('./report-page/report-page.component').then(m => m.ReportPageComponent),
                canActivate: [roleGuard],
                data: { requiredPermissions: ['hotel.reports.view', 'finance.reports.view'], permissionMode: 'any' }
            },
            {
                path: '**',
                redirectTo: ''
            }
        ]
    }
];