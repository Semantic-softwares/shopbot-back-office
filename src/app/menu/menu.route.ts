import { Routes } from '@angular/router';
import { roleGuard } from '../shared/guards/role.guard';
import { roleResolver } from '../shared/resolvers/role.resolver';

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
    resolve: { role: roleResolver },
    canActivate: [roleGuard],
    data: {
      requiredPermissions: [
        // Reservations & Front Desk
        'hotel.reservations.view',
        'hotel.reservations.create',
        'hotel.reservations.edit',
        'hotel.reservations.checkin',
        'hotel.reservations.checkout',
        // Guests
        'hotel.guests.view',
        'hotel.guests.create',
        'hotel.guests.edit',
        // Rooms
        'hotel.rooms.view',
        'hotel.rooms.create',
        'hotel.rooms.edit',
        // Room Types
        'hotel.roomtypes.view',
        'hotel.roomtypes.create',
        'hotel.roomtypes.edit',
        // Reports
        'finance.reports.view',
        'finance.reports.export',
        'finance.transactions.view',
        // Settings
        'settings.store.view',
        'settings.store.edit',
        'settings.staff.view',
        'settings.roles.view'
      ],
      permissionMode: 'any'
    }
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./menu.component').then((m) => m.MenuComponent),
  },
];
