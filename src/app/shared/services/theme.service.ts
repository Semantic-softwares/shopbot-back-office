import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'shopbot.theme';
/** Browser chrome colour (mobile address bar / PWA title bar) per scheme. */
const THEME_COLOR = { light: '#6750a4', dark: '#141313' } as const;

/**
 * Light / dark / follow-the-system. The choice is applied by toggling the
 * `dark-theme` class on <html>, which the rest of the app already keys off:
 * Angular Material's dark tokens (tokens.scss), the Tailwind `dark:` variant
 * and the remapped colour palette (dark-palette.scss).
 *
 * The same class is set by a tiny inline script in index.html before Angular
 * boots, so a saved dark choice never flashes white. This service then takes
 * over and keeps both in sync.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  readonly preference = signal<ThemePreference>(this.readStored());
  private readonly systemDark = signal(this.media?.matches ?? false);

  /** What is actually on screen right now. */
  readonly isDark = computed(() => {
    const pref = this.preference();
    return pref === 'dark' || (pref === 'system' && this.systemDark());
  });

  constructor() {
    // "Follow system" has to react live when the OS flips at sunset.
    this.media?.addEventListener('change', (e) => this.systemDark.set(e.matches));

    effect(() => this.apply(this.isDark() && !this.isStorefront()));
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Private mode / blocked storage: the choice still applies for this session.
    }
  }

  /**
   * The public self-order storefront (/m/:storeSlug) is customer-facing and has
   * its own theme engine; staff's appearance choice must not leak into it.
   */
  private isStorefront(): boolean {
    return (this.document.defaultView?.location.hash ?? '').startsWith('#/m/');
  }

  private apply(dark: boolean): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark-theme', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';

    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light);
  }

  private readStored(): ThemePreference {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
      return 'system';
    }
  }
}
