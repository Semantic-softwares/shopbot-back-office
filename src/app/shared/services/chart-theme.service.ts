import { Injectable, effect, inject } from '@angular/core';
import { Chart } from 'chart.js';
import { ThemeService } from './theme.service';

/**
 * Chart.js draws its text and grid lines from global defaults, so a light/dark
 * switch has to rewrite those defaults and redraw any chart already on screen.
 * Inject this from any component that renders a Chart.js chart.
 */
@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      const dark = this.theme.isDark();
      Chart.defaults.color = dark ? '#cac5cb' : '#666';
      Chart.defaults.borderColor = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
      Object.values(Chart.instances).forEach((chart) => chart.update());
    });
  }
}
