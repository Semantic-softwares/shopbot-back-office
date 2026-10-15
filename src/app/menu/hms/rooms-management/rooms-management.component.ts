import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-rooms-management',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
],
  templateUrl: './rooms-management.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './rooms-management.component.scss',
})
export class RoomsManagementComponent {

  readonly tabs = [
    { label: $localize`Rooms`, link: 'rooms', icon: 'meeting_room' },
    { label: $localize`Room Types`, link: 'room-types', icon: 'category' },
    { label: $localize`Rate Plans`, link: 'rate-plans', icon: 'price_change' },
    { label: $localize`Inventory`, link: 'inventory', icon: 'calendar_month' },
  ];
}
