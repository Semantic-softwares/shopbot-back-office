import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LanguageMenuComponent } from '../shared/components/language-menu/language-menu.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { messageOf } from './partner-portal-api.service';
import { PartnerPortalAuthService } from './partner-portal-auth.service';

/** Sign-in for people at travel partners. Not the staff sign-in: different accounts, and nothing here opens the back office. */
@Component({
  selector: 'app-partner-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, LanguageMenuComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex min-h-screen flex-col bg-surface text-on-surface">
      <div class="flex justify-end gap-1 p-3"><app-language-menu /><app-theme-toggle /></div>
      <main class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 pb-16">
        <header class="flex flex-col gap-1">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-primary">handshake</mat-icon>
          <h1 class="m-0 text-3xl font-semibold" i18n>Partner portal</h1>
          <p class="m-0 text-on-surface-variant" i18n>Check availability at your agreed rates and send booking requests to the hotel.</p>
        </header>
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-1" novalidate>
          <mat-form-field appearance="outline">
            <mat-label i18n>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" inputmode="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) { <mat-error i18n>Enter your email address.</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label i18n>Password</mat-label>
            <input matInput [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button type="button" matIconButton matSuffix (click)="show.set(!show())" [attr.aria-pressed]="show()" aria-label="Show password" i18n-aria-label><mat-icon>{{ show() ? 'visibility_off' : 'visibility' }}</mat-icon></button>
            @if (form.controls.password.touched && form.controls.password.invalid) { <mat-error i18n>Enter your password.</mat-error> }
          </mat-form-field>
          @if (error()) { <p class="m-0 mb-2 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 !text-xl !leading-none text-red-600">error</mat-icon>{{ error() }}</p> }
          <button matButton="filled" type="submit" class="!h-12" [disabled]="busy()">
            @if (busy()) { <mat-spinner diameter="20" /> } @else { <ng-container i18n>Sign in</ng-container> }
          </button>
        </form>
        <p class="m-0 text-sm text-on-surface-variant" i18n>Access is by invitation from the hotel. If you have not received one, ask the hotel to send it.</p>
      </main>
    </div>
  `,
})
export class PartnerLoginComponent {
  private readonly auth = inject(PartnerPortalAuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly show = signal(false);

  constructor() { if (this.auth.signedIn()) this.router.navigate(['/partner']); }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => this.router.navigate(['/partner']),
      error: (e) => { this.busy.set(false); this.error.set(e?.status === 503 ? $localize`The partner portal is not available yet. Try again later.` : messageOf(e, $localize`We could not sign you in. Try again.`)); },
    });
  }
}
