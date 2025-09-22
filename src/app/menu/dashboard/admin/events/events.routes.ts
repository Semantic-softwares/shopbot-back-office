import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./events.component').then(m => m.EventsComponent),
        children: [
            {
              path: '',
              redirectTo: 'list',
              pathMatch: 'full'
            },
            {
                path: 'list',
                loadComponent: () => import('./list-events/list-events.component').then(m => m.ListEventsComponent)
            }
        ]
    }
];
