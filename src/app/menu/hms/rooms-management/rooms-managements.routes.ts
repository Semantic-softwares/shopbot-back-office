import { Routes } from '@angular/router';

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
        loadChildren: () => import('./rooms/room.route').then(m => m.ROOMS_ROUTES)
      },
       {
        path: 'room-types',
        loadChildren: () => import('./room-types/room-types.route').then(m => m.ROOM_TYPES_ROUTES)
      }
    ]
  }
];
