import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap, of, catchError } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { MembershipsService } from '../../shared/services/memberships.service';
import { StoreStore } from '../../shared/stores/store.store';
import { Store } from '../../shared/models/store.model';

type ViewState = 'accepting' | 'success' | 'not-found' | 'error';

/**
 * Landing page for the "Accept Invite" button in the staff-added email
 * (see MailService.sendExistingStaffAddedEmail) — the invitee already has a
 * password, so unlike /auth/accept-invite/:token (which sets a first
 * password for a brand-new person), this just needs to be logged in, then
 * accept the one specific Membership the link identifies.
 */
@Component({
  selector: 'app-accept-membership',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-membership.component.html',
  styleUrl: './accept-membership.component.scss',
})
export class AcceptMembershipComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private membershipsService = inject(MembershipsService);
  private storeStore = inject(StoreStore);

  protected state = signal<ViewState>('accepting');
  protected storeName = signal<string>('');
  protected errorMessage = signal<string>('');

  ngOnInit(): void {
    const membershipId = this.route.snapshot.paramMap.get('id')!;

    if (!this.authService.currentUserValue) {
      // Not logged in yet — log in first, then come straight back here to
      // finish accepting instead of landing on the normal store picker.
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/accept-membership/${membershipId}` },
      });
      return;
    }

    this.membershipsService.getMinePending().pipe(
      switchMap((pending) => {
        const invite = pending.find((m) => m._id === membershipId);
        if (!invite) {
          // Already accepted/declined — via this same link clicked twice,
          // the login-flow's own pending-invites dialog, or a stale email.
          return of('not-found' as const);
        }
        this.storeName.set(typeof invite.store === 'object' ? invite.store.name : '');
        return this.membershipsService.accept(membershipId).pipe(
          switchMap(() => this.membershipsService.getMine()),
        );
      }),
      catchError((err) => {
        if (err?.status === 401) {
          // Saved session is stale/invalid — sign in fresh, then come back here.
          this.authService.logout();
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: `/accept-membership/${membershipId}` },
          });
          return of('redirected' as const);
        }
        this.errorMessage.set(err?.error?.message || 'Something went wrong. Please try again.');
        return of('error' as const);
      }),
    ).subscribe((result) => {
      if (result === 'redirected') return;
      if (result === 'not-found' || result === 'error') {
        this.state.set(result);
        return;
      }
      const stores = result
        .map((membership) => membership.store)
        .filter((store): store is Store => typeof store === 'object' && store !== null);
      this.storeStore.setSelectedStores(stores);
      this.state.set('success');
    });
  }

  protected continue(): void {
    const stores = this.storeStore.stores();
    if (stores.length === 1) {
      this.storeStore.setSelectedStore(stores[0]);
      this.router.navigate(['/menu/menu']);
    } else {
      this.router.navigate(['/select-store']);
    }
  }

  protected currentEmail(): string {
    return this.authService.currentUserValue?.email ?? '';
  }

  protected switchAccount(): void {
    const membershipId = this.route.snapshot.paramMap.get('id')!;
    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: `/accept-membership/${membershipId}` },
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
