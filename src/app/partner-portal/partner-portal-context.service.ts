import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { PartnerPortalApiService } from './partner-portal-api.service';
import { PartnerPortalAuthService } from './partner-portal-auth.service';

const KEY = 'partner_portal_hotel';
const read = (): string => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } };

/** Which hotel the partner is working with right now. A login with one hotel just has it; with several, the choice is remembered. */
@Injectable({ providedIn: 'root' })
export class PartnerPortalContext {
  private readonly api = inject(PartnerPortalApiService);
  private readonly auth = inject(PartnerPortalAuthService);

  private readonly res = rxResource({ params: () => ({ on: this.auth.signedIn() }), stream: ({ params }) => (params.on ? this.api.hotels() : of(null)) });
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error());
  readonly hotels = computed(() => (this.res.hasValue() ? this.res.value()?.hotels ?? [] : []));
  private readonly chosen = signal(read());
  readonly current = computed(() => this.hotels().find((h) => h.storeId === this.chosen()) ?? this.hotels()[0] ?? null);

  constructor() {
    effect(() => { const c = this.current(); if (c) { try { localStorage.setItem(KEY, c.storeId); } catch { /* ignore */ } } });
  }
  choose(storeId: string) { this.chosen.set(storeId); }
  reload() { this.res.reload(); }
}
