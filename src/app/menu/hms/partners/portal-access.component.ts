import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PartnerPortalUser, PartnerRequestService } from '../../../shared/services/partner-request.service';
import { StoreStore } from '../../../shared/stores/store.store';

/**
 * Who at this partner may sign in to the hotel's partner portal. An invitation emails a link to set a password; removing someone
 * takes their access to this hotel away at once.
 */
@Component({
  selector: 'app-portal-access',
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-4 pt-4">
      <p class="m-0 max-w-2xl text-sm text-on-surface-variant" i18n>People you invite can sign in to the partner portal, see only the rooms and rates in this partner's agreements, and send you booking requests. You confirm or decline each request.</p>
      <form [formGroup]="form" (ngSubmit)="invite()" class="flex flex-wrap items-start gap-3 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4" novalidate>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-64"><mat-label i18n>Email</mat-label><input matInput type="email" formControlName="email" autocomplete="off" inputmode="email" />@if (form.controls.email.touched && form.controls.email.invalid) { <mat-error i18n>Enter a valid email address.</mat-error> }</mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-56"><mat-label i18n>Name (optional)</mat-label><input matInput formControlName="name" autocomplete="off" /></mat-form-field>
        <button matButton="filled" type="submit" class="!h-14" [disabled]="busy()"><mat-icon>person_add</mat-icon><ng-container i18n>Send invitation</ng-container></button>
      </form>
      @if (error()) { <p class="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert">{{ error() }}</p> }
      @if (res.isLoading() && !users().length) { <mat-progress-bar mode="indeterminate" /> }
      @if (users().length === 0 && !res.isLoading()) {
        <p class="m-0 text-sm text-on-surface-variant" i18n>Nobody has portal access for this partner yet.</p>
      } @else {
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          @for (u of users(); track u._id) {
            <li class="flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3">
              <div class="min-w-0 flex-1"><div class="truncate font-medium">{{ u.name || u.email }}</div><div class="truncate text-xs text-on-surface-variant">{{ u.email }}@if (u.lastLoginAt) { · <ng-container i18n>last signed in</ng-container> {{ u.lastLoginAt | date: 'd MMM y, HH:mm' }} }</div></div>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="u.status === 'active' ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'">@if (u.status === 'active') { <ng-container i18n>Active</ng-container> } @else { <ng-container i18n>Invitation sent</ng-container> }</span>
              @if (u.status === 'invited') { <button matButton type="button" (click)="resend(u)" i18n>Resend</button> }
              <button matButton type="button" (click)="remove(u)" i18n>Remove access</button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class PortalAccessComponent {
  readonly partnerId = input.required<string>();
  private readonly api = inject(PartnerRequestService);
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  private readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], name: [''] });
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly refresh = signal(0);
  readonly res = rxResource({
    params: () => ({ store: this.storeId(), partner: this.partnerId(), n: this.refresh() }),
    stream: ({ params }) => (params.store && params.partner ? this.api.users(params.store, params.partner) : of(null)),
  });
  readonly users = computed<PartnerPortalUser[]>(() => (this.res.hasValue() ? this.res.value()?.users ?? [] : []));

  private done<T>(text: string) {
    return {
      next: (_: T) => { this.busy.set(false); this.snack.open(text, undefined, { duration: 3000 }); this.refresh.update((n) => n + 1); },
      error: (e: any) => { this.busy.set(false); this.error.set(e?.error?.message ?? $localize`That did not go through. Try again.`); },
    };
  }

  invite() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const { email, name } = this.form.getRawValue();
    this.api.invite(this.storeId(), this.partnerId(), { email: email.trim(), name: name.trim() || undefined }).subscribe({
      next: () => { this.busy.set(false); this.form.reset({ email: '', name: '' }); this.snack.open($localize`Invitation sent.`, undefined, { duration: 3000 }); this.refresh.update((n) => n + 1); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? $localize`The invitation could not be sent.`); },
    });
  }
  resend(u: PartnerPortalUser) { this.busy.set(true); this.error.set(''); this.api.resend(this.storeId(), this.partnerId(), u._id).subscribe(this.done($localize`Invitation sent again.`)); }
  remove(u: PartnerPortalUser) {
    this.dialog.open(ConfirmDialogComponent, { data: { title: $localize`Remove access?`, message: $localize`${u.email} will no longer be able to see this hotel or send it requests. Their requests so far stay on record.`, confirmText: $localize`Remove access` } })
      .afterClosed().subscribe((ok) => { if (ok) { this.busy.set(true); this.error.set(''); this.api.removeUser(this.storeId(), this.partnerId(), u._id).subscribe(this.done($localize`Access removed.`)); } });
  }
}
