export interface StorefrontLanguage {
  code: string;
  label: string;
  flag: string;
}

// English is the source language — it's the text actually written in the
// templates, so it needs no translation JSON file and no loadTranslations()
// call.
export const SOURCE_LANGUAGE_CODE = 'en';

export const STOREFRONT_LANGUAGES: StorefrontLanguage[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export const STOREFRONT_LANG_STORAGE_KEY = 'sf_lang';
