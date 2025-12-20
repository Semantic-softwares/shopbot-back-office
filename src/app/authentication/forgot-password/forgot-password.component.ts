import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  public loading = signal(false);
  public emailSent = signal(false);

  public forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  public onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.loading.set(true);
      const { email } = this.forgotPasswordForm.value;

      this.authService.resetPassword(email!)
        .subscribe({
          next: (response) => {
            this.loading.set(false);
            this.emailSent.set(true);
            this.snackBar.open(
              'Password reset link sent to your email. Please check your inbox.',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
            setTimeout(() => {
              this.router.navigate(['/auth/verify-reset-token'], { queryParams: { email } });
            }, 2000);
          },
          error: (error) => {
            this.loading.set(false);
            this.emailSent.set(false);
            this.snackBar.open(
              error.error?.msg || error.message || 'Failed to send reset link. Please try again.',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        });
    }
  }
}
