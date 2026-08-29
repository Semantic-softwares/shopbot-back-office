import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-storefront-empty',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex h-screen w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <mat-icon class="!h-10 !w-10 !text-4xl" style="color: var(--sf-muted, #9ca3af)">{{ icon }}</mat-icon>
      <h1 class="text-lg font-semibold" style="color: var(--sf-text, #111827)">{{ title }}</h1>
      <p class="max-w-sm text-sm" style="color: var(--sf-muted, #6b7280)">{{ message }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'storefront';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
}
