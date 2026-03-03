import { Component } from '@angular/core';

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
  styleUrl: './rooms-management.component.scss',
})
export class RoomsManagementComponent {

  readonly tabs = [
    { label: 'Rooms', link: 'rooms', icon: 'meeting_room' },
    { label: 'Room Types', link: 'room-types', icon: 'category' },
    { label: 'Rate Plans', link: 'rate-plans', icon: 'price_change' },
    { label: 'Inventory', link: 'inventory', icon: 'calendar_month' },
  ];
}
