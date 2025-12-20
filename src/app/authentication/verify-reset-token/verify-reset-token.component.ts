import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-reset-token',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './verify-reset-token.component.html',
  styleUrl: './verify-reset-token.component.scss'
})
export class VerifyResetTokenComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public loading = signal(false);
  public verified = signal(false);
  public email = signal('');

  public verifyTokenForm = this.fb.group({
    token: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email.set(params['email']);
      }
    });
  }

  public onSubmit(): void {
    if (this.verifyTokenForm.valid && this.email()) {
      this.loading.set(true);
      const { token } = this.verifyTokenForm.value;

      this.authService.verifyResetToken(this.email(), token!)
        .subscribe({
          next: (response) => {
            this.loading.set(false);
            this.verified.set(true);
            this.snackBar.open(
              'Token verified successfully!',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
            setTimeout(() => {
              this.router.navigate(['/auth/reset-password'], { 
                queryParams: { 
                  email: this.email(),
                  token: token 
                } 
              });
            }, 2000);
          },
          error: (error) => {
            this.loading.set(false);
            this.verified.set(false);
            this.snackBar.open(
              error.error?.msg || error.message || 'Invalid token. Please try again.',
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
