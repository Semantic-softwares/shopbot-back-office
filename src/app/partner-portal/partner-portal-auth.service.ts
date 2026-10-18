import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PartnerUser {
  _id: string;
  email: string;
  name: string;
}
interface SignedIn {
  accessToken: string;
  user: PartnerUser;
}
export interface InvitePreview {
  email: string;
  name: string;
  hotels: Array<{ hotel: string; partner: string }>;
}

const TOKEN_KEY = 'partner_portal_token';
const USER_KEY = 'partner_portal_user';
const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string | null) => { try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* storage unavailable: the session lasts until the page closes */ } };

/**
 * The partner portal's own sign-in. Its token lives under its own key and goes only to /partner-portal URLs, so a staff session in
 * the same browser is never sent here and a partner session never reaches staff endpoints.
 */
@Injectable({ providedIn: 'root' })
export class PartnerPortalAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/partner-portal`;

  private readonly tokenSignal = signal<string | null>(read(TOKEN_KEY));
  readonly user = signal<PartnerUser | null>(this.parse(read(USER_KEY)));
  readonly token = this.tokenSignal.asReadonly();
  readonly signedIn = computed(() => !!this.tokenSignal());

  private parse(raw: string | null): PartnerUser | null {
    try { return raw ? (JSON.parse(raw) as PartnerUser) : null; } catch { return null; }
  }
  private store(res: SignedIn) {
    write(TOKEN_KEY, res.accessToken);
    write(USER_KEY, JSON.stringify(res.user));
    this.tokenSignal.set(res.accessToken);
    this.user.set(res.user);
  }

  login(email: string, password: string): Observable<SignedIn> {
    return this.http.post<SignedIn>(`${this.base}/auth/login`, { email, password }).pipe(tap((r) => this.store(r)));
  }
  previewInvite(token: string): Observable<InvitePreview> { return this.http.get<InvitePreview>(`${this.base}/invite/${encodeURIComponent(token)}`); }
  acceptInvite(token: string, password: string, name?: string): Observable<SignedIn> {
    return this.http.post<SignedIn>(`${this.base}/invite/${encodeURIComponent(token)}/accept`, { password, name }).pipe(tap((r) => this.store(r)));
  }
  logout(redirect = true) {
    write(TOKEN_KEY, null);
    write(USER_KEY, null);
    this.tokenSignal.set(null);
    this.user.set(null);
    if (redirect) this.router.navigate(['/partner/login']);
  }
}
