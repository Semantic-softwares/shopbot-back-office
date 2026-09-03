import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';

/**
 * Guest Wi-Fi for the scanned table. Renders nothing at all unless the
 * backend sent a `wifi` block — it only does that when this table has a
 * network name and the store hasn't switched the card off, so there's no
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
  protected readonly wifi = computed(() => this.store.table()?.wifi ?? null);

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
