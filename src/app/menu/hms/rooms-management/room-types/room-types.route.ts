import { Routes } from '@angular/router';

export const ROOM_TYPES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./room-types.component').then(m => m.RoomTypesComponent),
    children: [
      {
        path: '',
        redirectTo: 'room-types',
        pathMatch: 'full'
      },
      {
        path: 'room-types',
        loadComponent: () => import('./room-types-list/room-types-list.component').then(m => m.RoomTypesListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./room-type-form/room-type-form.component').then(m => m.RoomTypeFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./room-type-form/room-type-form.component').then(m => m.RoomTypeFormComponent)
      },
      {
        path: ':id/details',
        loadComponent: () => import('./room-type-details/room-type-details.component').then(m => m.RoomTypeDetailsComponent)
      }
    ]
  }
];