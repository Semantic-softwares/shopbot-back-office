import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './rooms.component.html',
})
export class RoomsComponent {
  
  isRoomsActive(): boolean {
    return location.pathname.includes('/rooms') && !location.pathname.includes('/room-types');
  }

  isRoomTypesActive(): boolean {
    return location.pathname.includes('/room-types');
  }
}
