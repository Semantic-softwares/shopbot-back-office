import { Component, inject, signal } from '@angular/core';
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
import { StoreService } from '../../shared/services/store.service';
import { SessionStorageService } from '../../shared/services/session-storage.service';
import { switchMap, catchError, of, throwError, forkJoin } from 'rxjs';
import { StoreStore } from '../../shared/stores/store.store';
import { RolesService } from '../../shared/services/roles.service';

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
  private storeService = inject(StoreService);
  private storeStore = inject(StoreStore);
  private sessionStorage = inject(SessionStorageService);

  public clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    storeNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern(/^\d{4}$/)]]
  });

  public onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      const { email, password, storeNumber } = this.loginForm.value;

      // Step 1: Login
      this.authService.login(email!, password!)
        .pipe(
          switchMap((user) => {
            const merchantId = user._id;
            
            // Step 2 & 3: Validate store access and get merchant stores in parallel
            return forkJoin({
              storeAccess: this.storeService.validateMerchantStoreAccess(storeNumber!, merchantId),
              merchantStores: this.storeService.getMerchantStores(merchantId)
            }).pipe(
              switchMap(({ storeAccess, merchantStores }) => {
                // Check if store access is valid (owner, merchant, or staff)
                if (!storeAccess.success || !storeAccess.data) {
                  // Clear session and reject
                  this.clearSessionAndLogout();
                  return throwError(() => new Error('You do not have access to this store.'));
                }

                // User has access to the store - set it as selected
                const accessedStore = storeAccess.data;
                
                // If merchant owns stores, use those; otherwise use the accessed store
                const stores = merchantStores && merchantStores.length > 0 
                  ? merchantStores 
                  : [accessedStore];
                
                // Set stores and selected store
                this.storeStore.setSelectedStores(stores);
                this.storeStore.setSelectedStore(accessedStore);
                
                this.snackBar.open('Login successful!', 'Close', {
                  duration: 3000,
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                });

                setTimeout(() => {
                  this.router.navigate(['/menu/menu']);
                }, 1000);
                
                this.loading.set(false);
                return of(null);
              })
            );
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
