import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppLanguageService } from '../../i18n/app-language.service';

/** Interface-language picker. Each language is listed in its own language so it can always be found. */
@Component({
  selector: 'app-language-menu',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './language-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageMenuComponent {
  protected readonly language = inject(AppLanguageService);
  protected readonly tooltip = $localize`:@@appearance.languageHeading:Language`;
}
