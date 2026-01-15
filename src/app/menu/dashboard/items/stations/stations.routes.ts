import { Routes } from '@angular/router';

export const DASHBOARD_STATIONS_ROUTES: Routes = [
  {
        path: '',
        loadComponent: () => import('./stations.component').then(m => m.StationsComponent),
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full'
          },
          {
            path: 'list',
            loadComponent: () => import('./list-stations/list-stations.component').then(m => m.ListStationsComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('./create-station/create-station.component').then(m => m.CreateStationComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./create-station/create-station.component').then(m => m.CreateStationComponent)
          },
          {
            path: 'details/:id',
            loadComponent: () => import('./station-details/station-details.component').then(m => m.StationDetailsComponent)
          }
        ]
      }
];
