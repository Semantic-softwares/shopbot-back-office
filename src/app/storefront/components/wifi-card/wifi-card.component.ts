import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';

/**
 * Guest Wi-Fi. Renders nothing at all unless the backend sent a `wifi` block —
 * it resolves the table's own network over the store's and omits it entirely
 * when neither is set or the store has switched the card off, so there's no
 * second condition to re-check here.
 */
@Component({
  selector: 'app-storefront-wifi-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './wifi-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WifiCardComponent {
  protected readonly store = inject(StorefrontStore);
  // The table's block already carries the resolved network when a table was
  // scanned; the store's covers the browse-only path, where there is no table.
  protected readonly wifi = computed(
    () => this.store.table()?.wifi ?? this.store.storeInfo()?.wifi ?? null,
  );

  /** Which field was just copied, so only that row shows the tick. */
  protected readonly copied = signal<'ssid' | 'password' | null>(null);
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  async copy(value: string, field: 'ssid' | 'password'): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access is blocked on insecure origins and in some in-app
      // browsers. The value is on screen either way, so a guest can still
      // type it — failing silently beats an error the guest can't act on.
      return;
    }
    this.copied.set(field);
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(null), 2000);
  }
}
