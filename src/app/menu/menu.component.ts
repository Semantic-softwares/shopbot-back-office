import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ToolbarComponent } from '../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    MatIconModule,
    ToolbarComponent,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  private router = inject(Router);

  navigateToModule(moduleType: 'erp' | 'hotel') {
    if (moduleType === 'erp') {
      this.router.navigate(['/menu/erp']);
    } else if (moduleType === 'hotel') {
      this.router.navigate(['/menu/hms']);
    }
  }
}
