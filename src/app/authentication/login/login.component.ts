import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { StoreService } from '../../shared/services/store.service';
import { SessionStorageService } from '../../shared/services/session-storage.service';
import { switchMap, catchError, of, throwError } from 'rxjs';
import { StoreStore } from '../../shared/stores/store.store';

@Component({
  selector: 'login',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  public hide = signal(true);
  public loading = signal(false);
  private storeService = inject(StoreService);
  private storeStore = inject(StoreStore);
  public clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  public onSubmit(): void {
  if (this.loginForm.valid) {
    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!)
      .pipe(
        switchMap((user) => {
          const merchantId = user._id;
          return this.storeService.getMerchantStores(merchantId).pipe(
            switchMap((stores) => {
              if (!stores || stores.length === 0) {
                // Manually throw error if no stores found
                return throwError(() => new Error('No stores found for this merchant.'));
              }

              this.storeStore.setSelectedStores(stores);
              this.storeStore.setSelectedStore(stores[0]);
              setTimeout(() => {
                this.router.navigate(['/menu/menu']);
              }, 2000);
              this.loading.set(false);
              return of(null);
            }),
            catchError((error) => {
              this.snackBar.open(
                error.message || 'Failed to load stores.',
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

}
