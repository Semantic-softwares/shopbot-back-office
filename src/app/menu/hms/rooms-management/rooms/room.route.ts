import { Routes } from '@angular/router';
import { roleGuard } from '../../../../shared/guards/role.guard';

export const ROOMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./rooms.component').then(m => m.RoomsComponent),
    children: [
      {
        path: '',
        redirectTo: 'rooms',
        pathMatch: 'full'
      },
      {
        path: 'rooms',
        loadComponent: () => import('./rooms-list/rooms-list.component').then(m => m.RoomsListComponent),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.rooms.view' }
      },
      {
        path: 'rooms/create',
        loadComponent: () => import('./room-form/room-form.component').then(m => m.RoomFormComponent),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.rooms.create' }
      },
      {
        path: 'rooms/:id/edit',
        loadComponent: () => import('./room-form/room-form.component').then(m => m.RoomFormComponent),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.rooms.edit' }
      },
      {
        path: 'rooms/:id',
        loadComponent: () => import('./room-details/room-details.component').then(m => m.RoomDetailsComponent),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.rooms.view' }
      },
    ]
  }
];