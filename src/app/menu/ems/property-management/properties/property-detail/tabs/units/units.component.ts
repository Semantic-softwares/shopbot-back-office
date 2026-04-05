import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-units',
  imports: [
    RouterModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './units.component.html',
})
export class UnitsComponent {}