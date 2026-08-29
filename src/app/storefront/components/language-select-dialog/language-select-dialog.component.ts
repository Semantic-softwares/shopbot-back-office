import { Component, Inject, Optional } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  SOURCE_LANGUAGE_CODE,
  STOREFRONT_LANGUAGES,
  STOREFRONT_LANG_STORAGE_KEY,
  StorefrontLanguage,
} from '../../i18n/languages';

export interface LanguageSelectDialogData {
  // false for the mandatory first-visit prompt (no close button, disableClose
  // set by whoever opens it) — true when reopened later from the switcher.
  dismissible?: boolean;
}

// Picking a language saves it and reloads the page — @angular/localize's
// loadTranslations() only affects content that hasn't rendered yet, so there
// is no in-place instant switch; see i18n/bootstrap-language.ts for the other
// half of this flow.
@Component({
  selector: 'app-storefront-language-select-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './language-select-dialog.component.html',
})
export class LanguageSelectDialogComponent {
  protected readonly languages = STOREFRONT_LANGUAGES;
  protected readonly currentCode = localStorage.getItem(STOREFRONT_LANG_STORAGE_KEY) || SOURCE_LANGUAGE_CODE;
  protected readonly dismissible: boolean;

  constructor(
    private readonly dialogRef: MatDialogRef<LanguageSelectDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: LanguageSelectDialogData | null,
  ) {
    this.dismissible = data?.dismissible !== false;
  }

  select(lang: StorefrontLanguage): void {
    if (lang.code === this.currentCode) {
      this.dialogRef.close();
      return;
    }
    localStorage.setItem(STOREFRONT_LANG_STORAGE_KEY, lang.code);
    window.location.reload();
  }

  close(): void {
    this.dialogRef.close();
  }
}
