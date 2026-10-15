import { Injectable, signal } from '@angular/core';
import { APP_LANGUAGES, APP_LANG_STORAGE_KEY, AppLanguage, storedAppLanguage } from './app-languages';

@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  readonly languages = APP_LANGUAGES;
  readonly current = signal<AppLanguage>(storedAppLanguage());

  /**
   * Saves the choice and reloads: translations are applied before bootstrap, so
   * the page must start over to show them (and to pick up the locale's date and
   * number formats). Anything unsaved in an open form is lost, so callers
   * should only offer this from menus, not mid-edit.
   */
  set(code: AppLanguage['code']): void {
    if (code === this.current().code) return;
    try {
      localStorage.setItem(APP_LANG_STORAGE_KEY, code);
    } catch {
      return; // Without storage the choice would not survive the reload.
    }
    location.reload();
  }
}
