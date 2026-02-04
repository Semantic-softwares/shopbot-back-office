import { Routes } from '@angular/router';

export const DASHBOARD_LIVE_BOOKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./live-booking').then(m => m.LiveBooking),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./list-live-booking/list-live-booking').then(m => m.ListLiveBooking)
      },
      {
        path: ':id/details',
        loadComponent: () => import('./live-booking-details/live-booking-details').then(m => m.LiveBookingDetails)
      }
    ]
  }
];