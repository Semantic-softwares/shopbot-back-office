import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemePreference, ThemeService } from '../../services/theme.service';

/** Light / dark / follow-the-system switch. Language lives in its own control (LanguageMenuComponent). */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './theme-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);

  protected readonly options: { value: ThemePreference; icon: string; label: string }[] = [
    { value: 'system', icon: 'brightness_auto', label: $localize`:@@appearance.system:System` },
    { value: 'light', icon: 'light_mode', label: $localize`:@@appearance.light:Light` },
    { value: 'dark', icon: 'dark_mode', label: $localize`:@@appearance.dark:Dark` },
  ];

  protected readonly tooltip = $localize`:@@appearance.themeHeading:Theme`;
}
