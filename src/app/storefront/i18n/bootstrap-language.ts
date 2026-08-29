import { clearTranslations, loadTranslations } from '@angular/localize';
import { SOURCE_LANGUAGE_CODE, STOREFRONT_LANGUAGES, STOREFRONT_LANG_STORAGE_KEY } from './languages';

/**
 * Applies a previously-chosen storefront language before the app's first
 * render. @angular/localize's loadTranslations() only affects $localize
 * strings that haven't rendered yet — it can't retranslate content already on
 * screen — so switching language is a "save preference, then reload" flow
 * (see LanguageSelectDialogComponent), and this is the loader that runs on
 * that reload, before Angular even bootstraps.
 *
 * Scoped to the public storefront only (hash starts with #/m/) — the ERP app
 * has no i18n markers in its templates, so this is a no-op for every other
 * route regardless.
 */
export async function loadStorefrontLanguage(): Promise<void> {
  if (!location.hash.startsWith('#/m/')) {
    return;
  }

  const lang = localStorage.getItem(STOREFRONT_LANG_STORAGE_KEY);
  if (!lang || lang === SOURCE_LANGUAGE_CODE) {
    return;
  }
  if (!STOREFRONT_LANGUAGES.some((l) => l.code === lang)) {
    return;
  }

  try {
    const response = await fetch(`assets/i18n/storefront/${lang}.json`);
    if (!response.ok) return;
    const translations = await response.json();
    clearTranslations();
    loadTranslations(translations);
  } catch {
    // Render in the source language rather than block bootstrap on a
    // network hiccup.
  }
}
