import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { RolesService } from '../../shared/services/roles.service';
import { StoreStore } from '../../shared/stores/store.store';
import { Store } from '../../shared/models/store.model';

/**
 * Shown right after login when a merchant belongs to more than one store —
 * the equivalent of TravailOS's company switcher gate. A single-store
 * merchant never lands here: login.component.ts selects their one store
 * automatically and skips straight to /menu/menu.
 */
@Component({
  selector: 'app-select-store',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select-store.component.html',
  styleUrl: './select-store.component.scss',
})
export class SelectStoreComponent {
  private authService = inject(AuthService);
  private rolesService = inject(RolesService);
  private storeStore = inject(StoreStore);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  protected readonly stores = this.storeStore.stores;
  protected readonly selecting = signal<string | null>(null);

  protected selectStore(store: Store): void {
    if (this.selecting()) return;
    const merchantId = this.authService.currentUserValue?._id;
    if (!merchantId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.selecting.set(store._id);
    this.storeStore.setSelectedStore(store);

    this.rolesService.loadForStore(merchantId, store._id).subscribe({
      next: () => {
        this.router.navigate(['/menu/menu']);
      },
      error: () => {
        this.selecting.set(null);
        this.snackBar.open('Could not load your access for this store — please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
