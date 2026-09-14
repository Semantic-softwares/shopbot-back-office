import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { UserService } from '../../shared/services/user.service';

/**
 * Where a staff-invite email link lands: /auth/accept-invite/:token. This is
 * the ONLY way a staff member added by an admin (see
 * MerchantsService.create()) ever gets a password — they're never handed one
 * directly. Mirrors reset-password.component.ts's shape (loading → form →
 * success), swapping its email+token query params for a single path token
 * and adding an upfront preview step so a bad/expired link fails fast
 * instead of only after the person has typed a password.
 */
@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './accept-invite.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './accept-invite.component.scss',
})
export class AcceptInviteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public loadingPreview = signal(true);
  public invalidReason = signal<string | null>(null);
  public name = signal('');
  public email = signal('');
  private token = '';

  public submitting = signal(false);
  public done = signal(false);
  public hidePassword = signal(true);
  public hideConfirmPassword = signal(true);

  public acceptForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.invalidReason.set('This invite link is missing its token.');
      this.loadingPreview.set(false);
      return;
    }

    this.userService.getInvitePreview(this.token).subscribe({
      next: (preview) => {
        this.name.set(preview.name);
        this.email.set(preview.email);
        this.loadingPreview.set(false);
      },
      error: (error) => {
        this.invalidReason.set(
          error.status === 410
            ? 'This invite link has expired. Ask whoever added you to send a new one.'
            : 'This invite link is invalid. Ask whoever added you to send a new one.',
        );
        this.loadingPreview.set(false);
      },
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
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
    if (this.acceptForm.invalid) return;
    this.submitting.set(true);
    const { password } = this.acceptForm.value;

    this.userService.acceptInvite(this.token, password!).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (error) => {
        this.submitting.set(false);
        this.snackBar.open(
          error.error?.message || 'Could not set your password. Please try again.',
          'Close',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] },
        );
      },
    });
  }
}
