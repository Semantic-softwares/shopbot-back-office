import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Inputs
  showMenuButton = input(true);
  showBackButton = input(false);
  title = input<string>('');

  // Outputs
  menuToggle = output<void>();

  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  goBack() {
    window.history.back();
  }

  goToProfile() {
    this.router.navigate(['/menu']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}