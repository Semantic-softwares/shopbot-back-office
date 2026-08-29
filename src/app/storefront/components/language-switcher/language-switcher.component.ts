import { Component, Input, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LanguageSelectDialogComponent } from '../language-select-dialog/language-select-dialog.component';
import { SOURCE_LANGUAGE_CODE, STOREFRONT_LANGUAGES, STOREFRONT_LANG_STORAGE_KEY } from '../../i18n/languages';

// Reusable across every theme — themes differ visually enough (Classic sits
// on a plain light header, Modern overlays a photo hero) that this accepts
// styling inputs rather than hardcoding one look.
@Component({
  selector: 'app-storefront-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.component.html',
})
export class LanguageSwitcherComponent {
  @Input() variant: 'default' | 'inverted' = 'default';
  @Input() customClass = '';

  private readonly dialog = inject(MatDialog);

  protected readonly currentLanguage =
    STOREFRONT_LANGUAGES.find(
      (l) => l.code === (localStorage.getItem(STOREFRONT_LANG_STORAGE_KEY) || SOURCE_LANGUAGE_CODE),
    ) || STOREFRONT_LANGUAGES[0];

  open(): void {
    this.dialog.open(LanguageSelectDialogComponent, {
      width: '360px',
      data: { dismissible: true },
    });
  }
}
