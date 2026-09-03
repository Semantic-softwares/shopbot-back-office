import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';

/**
 * Address and contact details under the menu. Renders nothing unless the
 * backend sent a `contactInfo` block — it omits it when the store's toggle is
 * off or every field is blank, so presence is the only condition here.
 */
@Component({
  selector: 'app-storefront-store-footer',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './store-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreFooterComponent {
  protected readonly store = inject(StorefrontStore);
  protected readonly contact = computed(() => this.store.storeInfo()?.contactInfo ?? null);

  /** Street/city/state/country joined into one line, skipping whatever is blank. */
  protected readonly addressLine = computed(() => {
    const info = this.contact();
    if (!info) return '';
    return [info.address, info.city, info.state, info.country].filter(Boolean).join(', ');
  });
}
