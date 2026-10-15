# Dark mode and languages

Two app-wide features, both switched from the sun/moon button (theme) and the translate button (language) in the toolbar (and the top-right of the
login pages). Choices are remembered in the browser: `shopbot.theme` and `shopbot.lang`.

## Dark mode

`ThemeService` toggles a `dark-theme` class on `<html>` (System / Light / Dark; "System" follows the OS live).
A small script in `index.html` applies it before Angular boots so there is no white flash. The public
storefront (`#/m/…`) is deliberately never darkened — it has its own theme engine.

Everything keys off that one class:

| Layer | Where | How it flips |
|---|---|---|
| Angular Material | `src/tokens.scss` (`.dark-theme`) | M3 dark tokens |
| Tailwind `gray/slate/…` and colours (≈4,000 existing usages) | `src/dark-palette.scss` (generated) | the `--color-*` variables are remapped, so `bg-gray-50`, `text-gray-900`… adapt without editing templates |
| `bg-white`, default borders, autofill, Places dropdown | `src/dark-theme.scss` | explicit overrides |
| Component SCSS with hard-coded colours | the component's `.scss` | `light-dark(<light>, <dark>)` — light is unchanged byte-for-byte |
| Charts | `ChartThemeService` (Chart.js), `sales-dashboard` (ECharts) | rewritten on theme change |

**When you add UI:** prefer Material tokens (`var(--mat-sys-surface)`, `bg-surface`, `text-on-surface`) or the
Tailwind palette classes — both flip automatically. For a one-off colour in SCSS write
`light-dark(#fff, #201f20)` instead of a bare hex. Avoid `bg-white` on text-on-colour surfaces.

`dark-palette.scss` is generated from Tailwind's own palette; change the mapping rules (neutrals mirror,
chromatic hues swap only their light/dark ends) in the generator rather than editing the file.

## Languages: English (source), French, Italian, Kinyarwanda

Uses Angular's built-in i18n with **runtime** translation files, the same model the storefront already used:
templates stay in English; `src/assets/i18n/app/<lang>.json` maps message ids to translations; the file is
loaded before the app boots (`main.ts` → `bootstrap-app-language.ts`). Changing language saves the choice and
reloads the page — translations cannot be applied to text that has already rendered. Dates, numbers and
currency follow the language through `LOCALE_ID`; Material's paginator/date-picker labels are translated in
`shared/i18n/material-intl.ts`.

### Writing translatable text

| Where | Do this |
|---|---|
| Template text | `<ng-container i18n>Save</ng-container>` or `<p i18n>Hello <b>{{ name }}</b></p>` |
| Static attributes | `placeholder="Search" i18n-placeholder` (also `title`, `label`, `aria-label`, `alt`, `matTooltip`) |
| A word chosen in an expression | `@if (saving()) {<ng-container i18n>Saving…</ng-container>} @else {<ng-container i18n>Save</ng-container>}` |
| String inside a binding (`[title]="x ? 'A' : 'B'"`) | `[title]="x ? ('A' \| tr) : ('B' \| tr)"` (import `TrPipe`) |
| TypeScript (snackbars, dialogs, labels) | `` $localize`Saved` `` |

Never build a sentence by concatenating translated pieces; put the whole sentence in one message with
`{{ placeholders }}` so word order can differ per language.

### Adding or changing text

1. Write the text as above.
2. `npm run i18n:check` lists every message with no translation yet, per language
   (`-- --strict` exits non-zero for CI). It reads `ng extract-i18n` plus `| tr` literals.
3. Add the translations to the three JSON files under `src/assets/i18n/app/`, keyed by the printed id.
   Keep placeholders like `{$INTERPOLATION}` and `{$START_TAG_STRONG}` exactly; reordering is fine.
   English-identical strings (acronyms, brand names) are still listed with the English text so the check passes.

A missing translation simply shows English — it never breaks the page.

### Adding a language

Add it to `APP_LANGUAGES` in `shared/i18n/app-languages.ts`, register its Angular locale data in
`bootstrap-app-language.ts`, and add `src/assets/i18n/app/<code>.json`.

### Known limits

- Text that comes from the server (error messages, role/permission names, product names) is not translated.
- Kinyarwanda, Italian and French were machine-drafted; have a native speaker review domain terms
  (hotel, estate, tax and fiscalisation vocabulary especially).
- The self-order storefront keeps its own language picker. On the public marketing website, the long feature
  descriptions defined in TypeScript (`website/features/feature-detail.ts`) are still English.
