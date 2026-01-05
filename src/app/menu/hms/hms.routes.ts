import { Routes } from '@angular/router';
import { roleGuard } from '../../shared/guards/role.guard';

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
                loadComponent: () => import('./overview/overview.component').then(m => m.OverviewComponent),
                canActivate: [roleGuard],
                data: {
                    requiredPermissions: ['hotel.reservations.view', 'hotel.rooms.view'],
                    permissionMode: 'any'
                }
            },
            {
                path: 'front-desk',
                loadChildren: () => import('./front-desk/front-desk.routes').then(m => m.DASHBOARD_FRONT_DESK_ROUTES),
                canActivate: [roleGuard],
                data: {
                    requiredPermissions: [
                        'hotel.reservations.view',
                        'hotel.reservations.create',
                        'hotel.reservations.checkin',
                        'hotel.reservations.checkout',
                        'hotel.guests.view'
                    ],
                    permissionMode: 'any'
                }
            },
            {
                path: 'rooms-management',
                loadChildren: () => import('./rooms-management/rooms-managements.routes').then(m => m.ROOMS_MANAGEMENT_ROUTES),
                canActivate: [roleGuard],
                data: {
                    requiredPermissions: [
                        'hotel.rooms.view',
                        'hotel.rooms.create',
                        'hotel.rooms.edit',
                        'hotel.roomtypes.view',
                        'hotel.roomtypes.create'
                    ],
                    permissionMode: 'any'
                }
            },
            {
                path: 'reports',
                loadChildren: () => import('./reports/reports.routes').then(m => m.DASHBOARD_HMS_REPORTS_ROUTES),
                canActivate: [roleGuard],
                data: {
                    requiredPermissions: [
                        'finance.reports.view',
                        'finance.reports.export',
                        'finance.transactions.view'
                    ],
                    permissionMode: 'any'
                }
            },
            {
                path: 'settings',
                loadChildren: () => import('./settings/settings.routes').then(m => m.SETTINGS_MANAGEMENT_ROUTES),
                canActivate: [roleGuard],
                data: {
                    requiredPermissions: [
                        'settings.store.view',
                        'settings.store.edit',
                        'settings.staff.view',
                        'settings.roles.view'
                    ],
                    permissionMode: 'any'
                }
            },
            // TODO: Add more routes as components are created
            {
                path: '**',
                redirectTo: 'overview'
            }
        ]
    }
];