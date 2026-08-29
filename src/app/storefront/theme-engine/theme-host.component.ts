import { AfterViewInit, Component, Injector, ViewChild, ViewContainerRef, effect, inject } from '@angular/core';
import { StorefrontStore } from '../data-access/storefront.store';
import { resolveTheme } from './theme-registry';

// A pure lookup — no if/else per theme. Each theme is its own lazy chunk, so a
// store's chosen theme is the only theme JS a customer ever downloads.
@Component({
  selector: 'app-theme-host',
  standalone: true,
  template: `<ng-container #outlet></ng-container>`,
})
export class ThemeHostComponent implements AfterViewInit {
  @ViewChild('outlet', { read: ViewContainerRef, static: true })
  private outlet!: ViewContainerRef;

  private readonly store = inject(StorefrontStore);
  private readonly injector = inject(Injector);
  private mountedThemeId: string | null = null;

  // Registering the effect here (not the constructor) matters: it guarantees
  // the #outlet container is already attached to the render tree before the
  // first run, which is what createComponent() needs to resolve a renderer
  // for the dynamically mounted theme. Doing this in the constructor can fire
  // before that attachment finishes and throws NG0407.
  ngAfterViewInit(): void {
    effect(
      () => {
        const themeId = this.store.templateSlug();
        if (themeId === this.mountedThemeId) {
          return;
        }
        this.mountTheme(themeId);
      },
      { injector: this.injector },
    );
  }

  private async mountTheme(themeId: string): Promise<void> {
    this.mountedThemeId = themeId;
    const theme = resolveTheme(themeId);
    const component = await theme.loadComponent();
    this.outlet.clear();
    this.outlet.createComponent(component);
  }
}
