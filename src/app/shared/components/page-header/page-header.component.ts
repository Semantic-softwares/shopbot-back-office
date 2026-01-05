import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
  private router = inject(Router);
  
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showViewToggle = false;
  @Input() viewToggleRoute = ''; // Base route for view toggle, e.g., '/menu/hms/front-desk/reservations/view'

  get currentView(): string {
    const url = this.router.url;
    if (url.includes('/list')) return 'list';
    if (url.includes('/calendar')) return 'calendar';
    return 'calendar';
  }

  onViewChange(view: string) {
    if (this.viewToggleRoute) {
      this.router.navigate([this.viewToggleRoute, view]);
    }
  }
}
