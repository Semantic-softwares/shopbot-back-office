import { Type } from '@angular/core';

export interface ThemeDefinition {
  id: string; // must match a Template document's `slug` in the backend
  loadComponent: () => Promise<Type<any>>;
}

// Adding a built-in theme is a code change + normal app deploy — correct for
// "Shopbot ships more themes over time". A real third-party marketplace would
// need more than swapping this for a runtime loader (see the plan's
// "marketplace reconciliation" note: same-origin code execution against the
// authenticated staff app's session is the actual blocker, not this registry).
export const THEME_REGISTRY: ThemeDefinition[] = [
  {
    id: 'classic',
    loadComponent: () => import('../themes/classic/classic-theme.component').then((m) => m.ClassicThemeComponent),
  },
  {
    id: 'modern',
    loadComponent: () => import('../themes/modern/modern-theme.component').then((m) => m.ModernThemeComponent),
  },
];

export function resolveTheme(themeId: string | undefined | null): ThemeDefinition {
  return THEME_REGISTRY.find((theme) => theme.id === themeId) ?? THEME_REGISTRY[0];
}
