import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MembershipsService } from '../../shared/services/memberships.service';
import { SessionStorageService } from '../../shared/services/session-storage.service';
import { switchMap, catchError, of, throwError } from 'rxjs';
import { StoreStore } from '../../shared/stores/store.store';
import { RolesService } from '../../shared/services/roles.service';
import { Store } from '../../shared/models/store.model';

@Component({
  selector: 'login',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private rolesService = inject(RolesService);
  public hide = signal(true);
  public loading = signal(false);
  private membershipsService = inject(MembershipsService);
  private storeStore = inject(StoreStore);
  private sessionStorage = inject(SessionStorageService);

  public clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  public onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      const { email, password } = this.loginForm.value;

      // Step 1: Login, then load every store this merchant belongs to
      // (via Membership) — no store code needed, unlike before, since one
      // account can now belong to many stores instead of requiring a
      // separate account per store.
      this.authService.login(email!, password!)
        .pipe(
          switchMap(() => this.membershipsService.getMine()),
          switchMap((memberships) => {
            const stores = memberships
              .map((membership) => membership.store)
              .filter((store): store is Store => typeof store === 'object' && store !== null);

            if (stores.length === 0) {
              this.clearSessionAndLogout();
              return throwError(() => new Error('You do not have access to any store. Contact your administrator.'));
            }

            this.storeStore.setSelectedStores(stores);

            if (stores.length === 1) {
              // Only one store — nothing to pick, go straight in.
              this.storeStore.setSelectedStore(stores[0]);
              this.snackBar.open('Login successful!', 'Close', {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              });
              setTimeout(() => {
                this.router.navigate(['/menu/menu']);
              }, 1000);
            } else {
              // Multiple stores — let them choose which one to work in,
              // same as TravailOS's company switcher.
              this.router.navigate(['/select-store']);
            }

            this.loading.set(false);
            return of(null);
          }),
          catchError((error) => {
            this.snackBar.open(
              error.error?.message || error.message || 'Login failed. Please try again.',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
            this.loading.set(false);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  private clearSessionAndLogout(): void {
    this.rolesService.clearAccess();
    this.sessionStorage.clearAll();
    this.storeStore.setSelectedStore(null as any);
    this.storeStore.setSelectedStores([]);
  }
}
