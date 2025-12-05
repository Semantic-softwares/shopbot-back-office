import { Component } from '@angular/core';

import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-rooms-management',
  standalone: true,
  imports: [
    RouterOutlet,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
],
  templateUrl: './rooms-management.component.html',
  styleUrl: './rooms-management.component.scss',
})
export class RoomsManagementComponent {
  
  isRoomsActive(): boolean {
    return location.pathname.includes('/rooms') && !location.pathname.includes('/room-types');
  }

  isRoomTypesActive(): boolean {
    return location.pathname.includes('/room-types');
  }
}
