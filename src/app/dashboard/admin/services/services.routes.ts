import { Routes } from '@angular/router';
import { ServicesComponent } from './services.component';
import { ListServicesComponent } from './list-services/list-services.component';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    component: ServicesComponent,
    children: [
      {
        path: '',
        component: ListServicesComponent
      }
    ]
  }
];
