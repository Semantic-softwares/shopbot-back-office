export interface AppLanguage {
  code: 'en' | 'fr' | 'it' | 'rw';
  /** Angular locale id — drives date, number and currency formatting. */
  locale: string;
  /** Name in the language itself, so a user can find theirs whatever the UI currently says. */
  label: string;
}

/** English is the source language written in the templates; it needs no translation file. */
export const SOURCE_APP_LANGUAGE = 'en';

export const APP_LANGUAGES: readonly AppLanguage[] = [
  { code: 'en', locale: 'en-US', label: 'English' },
  { code: 'fr', locale: 'fr', label: 'Français' },
  { code: 'it', locale: 'it', label: 'Italiano' },
  { code: 'rw', locale: 'rw', label: 'Kinyarwanda' },
];

export const APP_LANG_STORAGE_KEY = 'shopbot.lang';

/** The saved language, or English. Safe to call before Angular boots. */
export function storedAppLanguage(): AppLanguage {
  try {
    const code = localStorage.getItem(APP_LANG_STORAGE_KEY);
    return APP_LANGUAGES.find((l) => l.code === code) ?? APP_LANGUAGES[0];
  } catch {
    return APP_LANGUAGES[0];
  }
}
