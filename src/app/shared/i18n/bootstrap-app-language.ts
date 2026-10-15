import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localeRw from '@angular/common/locales/rw';
import { clearTranslations, loadTranslations } from '@angular/localize';
import { SOURCE_APP_LANGUAGE, storedAppLanguage } from './app-languages';

const LOCALE_DATA: Record<string, unknown> = { fr: localeFr, it: localeIt, rw: localeRw };

/**
 * Loads the saved UI language before Angular bootstraps — same save-then-reload
 * model the public storefront uses, because loadTranslations() cannot
 * retranslate text that has already rendered.
 *
 * Skipped on the storefront (it has its own language picker and files) and for
 * English, which is the text written in the templates.
 */
export async function loadAppLanguage(): Promise<void> {
  if (location.hash.startsWith('#/m/')) return;

  const lang = storedAppLanguage();
  if (lang.code === SOURCE_APP_LANGUAGE) return;

  // Number/date/currency formats for the chosen language.
  const data = LOCALE_DATA[lang.code];
  if (data) registerLocaleData(data as any, lang.locale);

  try {
    const response = await fetch(`assets/i18n/app/${lang.code}.json`);
    if (!response.ok) return;
    const file = await response.json();
    clearTranslations();
    loadTranslations(file.translations ?? file);
  } catch {
    // Render in English rather than block the app on a network hiccup.
  }
}
