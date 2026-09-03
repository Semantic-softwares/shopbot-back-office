import { Component, inject } from '@angular/core';
import { StorefrontStore } from '../../data-access/storefront.store';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { WifiCardComponent } from '../../components/wifi-card/wifi-card.component';
import { StoreFooterComponent } from '../../components/store-footer/store-footer.component';

@Component({
  selector: 'app-storefront-classic-theme',
  standalone: true,
  imports: [ProductCardComponent, LanguageSwitcherComponent, WifiCardComponent, StoreFooterComponent],
  templateUrl: './classic-theme.component.html',
  styleUrl: './classic-theme.component.scss',
})
export class ClassicThemeComponent {
  protected readonly store = inject(StorefrontStore);
}
