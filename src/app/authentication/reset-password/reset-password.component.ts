import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public loading = signal(false);
  public resetComplete = signal(false);
  public hidePassword = signal(true);
  public hideConfirmPassword = signal(true);
  public email = signal('');
  public token = signal('');

  public resetPasswordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  constructor() {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (!params['email'] || !params['token']) {
        // Redirect back to forgot password if params are missing
        this.router.navigate(['/auth/forgot-password']);
        return;
      }
      
      if (params['email']) {
        this.email.set(params['email']);
      }
      if (params['token']) {
        this.token.set(params['token']);
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  public clickEvent(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.hidePassword.set(!this.hidePassword());
    } else {
      this.hideConfirmPassword.set(!this.hideConfirmPassword());
    }
  }

  public onSubmit(): void {
    if (this.resetPasswordForm.valid && this.email() && this.token()) {
      this.loading.set(true);
      const { password } = this.resetPasswordForm.value;

      this.authService.updatePassword(this.email(), password!)
        .subscribe({
          next: (response) => {
            this.loading.set(false);
            this.resetComplete.set(true);
            this.snackBar.open(
              'Password reset successfully!',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          },
          error: (error) => {
            this.loading.set(false);
            this.snackBar.open(
              error.error?.msg || error.message || 'Failed to reset password. Please try again.',
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
