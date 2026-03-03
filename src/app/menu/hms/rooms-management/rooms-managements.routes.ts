import { Routes } from '@angular/router';
import { roleGuard } from '../../../shared/guards/role.guard';

export const ROOMS_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./rooms-management.component').then(m => m.RoomsManagementComponent),
    children: [
      {
        path: '',
        redirectTo: 'rooms',
        pathMatch: 'full'
      },
      // Rooms Management
      {
        path: 'rooms',
        loadChildren: () => import('./rooms/room.route').then(m => m.ROOMS_ROUTES),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['hotel.rooms.view', 'hotel.rooms.create', 'hotel.rooms.edit', 'hotel.rooms.delete'],
          permissionMode: 'any'
        }
      },
      {
        path: 'room-types',
        loadChildren: () => import('./room-types/room-types.route').then(m => m.ROOM_TYPES_ROUTES),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['hotel.roomtypes.view', 'hotel.roomtypes.create', 'hotel.roomtypes.edit', 'hotel.roomtypes.delete'],
          permissionMode: 'any'
        }
      },
      {
        path: 'rate-plans',
        loadChildren: () => import('./rate-plans/rate-plans.routes').then(m => m.RATE_PLANS_ROUTES),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['hotel.rooms.view', 'hotel.rooms.edit'],
          permissionMode: 'any'
        }
      },
      {
        path: 'inventory',
        loadChildren: () => import('./inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['hotel.rooms.view', 'hotel.rooms.edit'],
          permissionMode: 'any'
        }
      }
    ]
  }
];
