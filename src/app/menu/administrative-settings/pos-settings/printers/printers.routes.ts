import { Routes } from '@angular/router';
import { PrintersComponent } from './printers.component';
import { ListPrintersComponent } from './list-printers/list-printers.component';

export const PRINTERS_ROUTES: Routes = [
  {
    path: '',
    component: PrintersComponent,
    children: [
      {
        path: '',
        component: ListPrintersComponent,
      },
    ],
  },
];
