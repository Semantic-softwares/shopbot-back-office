import { DestroyRef, Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Whether the POS can really reach the server. `navigator.onLine` only says a network card is connected (a café wifi with no
 * internet still says "online"), so the browser's own signal is confirmed by asking the server's /health endpoint.
 * The probe uses plain `fetch` so no interceptor, login or progress bar gets involved.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  readonly browserOnline = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  /** null until the first probe has answered. */
  readonly reachable = signal<boolean | null>(null);
  readonly online = computed(() => this.browserOnline() && this.reachable() !== false);
  readonly offline = computed(() => !this.online());

  private timer: ReturnType<typeof setInterval> | undefined;
  private probing: Promise<boolean> | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    const on = () => { this.browserOnline.set(true); void this.probe(); };
    const off = () => { this.browserOnline.set(false); this.reachable.set(false); };
    const focus = () => { if (document.visibilityState === 'visible') void this.probe(); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    document.addEventListener('visibilitychange', focus);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      document.removeEventListener('visibilitychange', focus);
      clearInterval(this.timer);
    });
    void this.probe();
  }

  /** Asks the server. Any HTTP answer, even an error page, proves the server is reachable. */
  probe(): Promise<boolean> {
    if (this.probing) return this.probing;
    if (!this.browserOnline()) { this.reachable.set(false); return Promise.resolve(false); }
    this.probing = (async () => {
      let ok = false;
      try {
        const res = await fetch(`${environment.apiUrl}/health`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
        ok = res.status > 0;
      } catch {
        ok = false;
      }
      this.reachable.set(ok);
      return ok;
    })().finally(() => { this.probing = null; });
    return this.probing;
  }

  /** Re-checks every `ms` while `needed()` is true (an order waiting to send, or the server last seemed away). */
  watch(needed: () => boolean, ms = 15000): void {
    this.zone.runOutsideAngular(() => {
      clearInterval(this.timer);
      this.timer = setInterval(() => { if (needed() || this.reachable() === false) void this.probe(); }, ms);
    });
  }
}
