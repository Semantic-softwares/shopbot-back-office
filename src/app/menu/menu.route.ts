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
    canActivate: [roleGuard],
    data: {
      requiredPermissions: [
        'erp.inventory.view',
        'erp.inventory.create',
        'erp.inventory.edit',
        'erp.inventory.delete',
        'erp.inventory.adjust',
        'erp.products.view',
        'erp.products.create',
        'erp.products.edit',
        'erp.products.delete',
        'erp.orders.view',
        'erp.orders.create',
        'erp.orders.edit',
        'erp.orders.cancel',
        'erp.orders.refund',
        'erp.suppliers.view',
        'erp.suppliers.create',
        'erp.suppliers.edit',
        'erp.suppliers.delete',
      ],
      permissionMode: 'any',
    },
  },
  {
    path: 'pos',
    loadChildren: () => import('./pos/pos.routes').then((m) => m.DASHBOARD_POS_ROUTES),
    canActivate: [roleGuard],
    data: {
      requiredPermissions: [
        'erp.inventory.view',
        'erp.inventory.create',
        'erp.inventory.edit',
        'erp.inventory.delete',
        'erp.inventory.adjust',
        'erp.products.view',
        'erp.products.create',
        'erp.products.edit',
        'erp.products.delete',
        'erp.orders.view',
        'erp.orders.create',
        'erp.orders.edit',
        'erp.orders.cancel',
        'erp.orders.refund',
        'erp.suppliers.view',
        'erp.suppliers.create',
        'erp.suppliers.edit',
        'erp.suppliers.delete',
      ],
      permissionMode: 'any',
    },
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
        'hotel.reservations.delete',
        'hotel.reservations.checkin',
        'hotel.reservations.checkout',
        'hotel.reservations.export',
        // Guests
        'hotel.guests.view',
        'hotel.guests.create',
        'hotel.guests.edit',
        'hotel.guests.delete',
        // Rooms
        'hotel.rooms.view',
        'hotel.rooms.create',
        'hotel.rooms.edit',
        'hotel.rooms.delete',
        'hotel.rooms.status',
        // Room Types
        'hotel.roomtypes.view',
        'hotel.roomtypes.create',
        'hotel.roomtypes.edit',
        'hotel.roomtypes.delete',
        // Housekeeping
        'hotel.housekeeping.view',
        'hotel.housekeeping.manage',
        'hotel.housekeeping.complete',
        // Reports
        'finance.reports.view',
        'finance.reports.export',
        'finance.transactions.view',
        // Settings
        'settings.store.view',
        'settings.store.edit',
        'settings.staff.view',
        'settings.roles.view',
      ],
      permissionMode: 'any',
    },
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./menu.component').then((m) => m.MenuComponent),
  },
];
