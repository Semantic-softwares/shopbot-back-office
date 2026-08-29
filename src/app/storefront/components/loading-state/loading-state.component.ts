import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-storefront-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex h-screen w-full flex-col items-center justify-center gap-4">
      <mat-spinner diameter="36"></mat-spinner>
      <p class="text-sm" style="color: var(--sf-muted, #6b7280)" i18n="@@storefront.loading">Loading menu…</p>
    </div>
  `,
})
export class LoadingStateComponent {}
