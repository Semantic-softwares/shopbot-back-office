import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LanguageMenuComponent } from '../shared/components/language-menu/language-menu.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { messageOf } from './partner-portal-api.service';
import { PartnerPortalAuthService } from './partner-portal-auth.service';

/** Where the invitation email leads: choose a password, and you are signed in. */
@Component({
  selector: 'app-partner-accept-invite',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, LanguageMenuComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex min-h-screen flex-col bg-surface text-on-surface">
      <div class="flex justify-end gap-1 p-3"><app-language-menu /><app-theme-toggle /></div>
      <main class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 pb-16">
        @if (preview.isLoading() && !info()) { <mat-progress-bar mode="indeterminate" /> }
        @if (problem(); as p) {
          <section class="flex flex-col items-start gap-3 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-6" role="alert">
            <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">link_off</mat-icon>
            <h1 class="m-0 text-2xl font-semibold" i18n>This invitation cannot be used</h1>
            <p class="m-0 text-on-surface-variant">{{ p }}</p>
            <a matButton="filled" routerLink="/partner/login" i18n>Go to sign in</a>
          </section>
        } @else if (info(); as i) {
          <header class="flex flex-col gap-1">
            <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-primary">handshake</mat-icon>
            <h1 class="m-0 text-3xl font-semibold" i18n>Welcome</h1>
            <p class="m-0 text-on-surface-variant">
              <ng-container i18n>Choose a password for</ng-container> <strong class="text-on-surface">{{ i.email }}</strong>.
              @for (h of i.hotels; track $index) { <span class="block"><ng-container i18n>You will book for</ng-container> <strong class="text-on-surface">{{ h.partner }}</strong> <ng-container i18n>at</ng-container> <strong class="text-on-surface">{{ h.hotel }}</strong>.</span> }
            </p>
          </header>
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-1" novalidate>
            @if (!i.name) {
              <mat-form-field appearance="outline">
                <mat-label i18n>Your name</mat-label>
                <input matInput formControlName="name" autocomplete="name" />
              </mat-form-field>
            }
            <mat-form-field appearance="outline">
              <mat-label i18n>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              <mat-hint i18n>At least 8 characters</mat-hint>
              @if (form.controls.password.touched && form.controls.password.invalid) { <mat-error i18n>Choose a password of at least 8 characters.</mat-error> }
            </mat-form-field>
            <mat-form-field appearance="outline" class="mt-2">
              <mat-label i18n>Confirm password</mat-label>
              <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
              @if (form.controls.confirm.touched && mismatch()) { <mat-error i18n>The passwords do not match.</mat-error> }
            </mat-form-field>
            @if (error()) { <p class="m-0 mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert">{{ error() }}</p> }
            <button matButton="filled" type="submit" class="!h-12" [disabled]="busy()"><ng-container i18n>Set password and continue</ng-container></button>
          </form>
        }
      </main>
    </div>
  `,
})
export class PartnerAcceptInviteComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(PartnerPortalAuthService);
  private readonly fb = inject(FormBuilder);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly preview = rxResource({ stream: () => this.auth.previewInvite(this.token) });
  readonly info = computed(() => (this.preview.hasValue() ? this.preview.value() : null));
  readonly problem = computed(() => {
    const e: any = this.preview.error();
    return e ? messageOf(e, $localize`This invitation link is not valid. Ask the hotel to send a new one.`) : '';
  });

  readonly form = this.fb.nonNullable.group({ name: [''], password: ['', [Validators.required, Validators.minLength(8)]], confirm: ['', Validators.required] });
  readonly busy = signal(false);
  readonly error = signal('');
  mismatch = () => this.form.controls.password.value !== this.form.controls.confirm.value;

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.mismatch() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const { password, name } = this.form.getRawValue();
    this.auth.acceptInvite(this.token, password, name || undefined).subscribe({
      next: () => this.router.navigate(['/partner']),
      error: (e) => { this.busy.set(false); this.error.set(messageOf(e, $localize`We could not set your password. Try again.`)); },
    });
  }
}
