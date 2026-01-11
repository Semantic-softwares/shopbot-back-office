import { Component, inject } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ToolbarComponent } from '../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-menu',
  imports: [
    MatIconModule,
    MatCardModule,
    ToolbarComponent
],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  private router = inject(Router);

  navigateToModule(moduleType: 'erp' | 'hotel' | 'pos'): void {
    if (moduleType === 'erp') {
      this.router.navigate(['/menu/erp']);
    } else if (moduleType === 'hotel') {
      this.router.navigate(['/menu/hms']);
    } else if (moduleType === 'pos') {
      this.router.navigate(['/menu/pos']);
    }
  }
}
