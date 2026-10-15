import { loadStorefrontLanguage } from './app/storefront/i18n/bootstrap-language';
import { loadAppLanguage } from './app/shared/i18n/bootstrap-app-language';
import { environment } from './environments/environment';

// Table cards printed before the storefront moved to its own app point at
// office.shopbot.africa/#/m/<slug>[/t/<token>]. Forward them to the same path
// on the standalone storefront so those cards keep working. Production only,
// so the in-app storefront stays reachable for local development.
if (environment.production && location.hash.startsWith('#/m/')) {
  location.replace(`${environment.storefrontUrl}/${location.hash.slice('#/m/'.length)}`);
} else {
  // The app itself is imported only AFTER the language file is loaded.
  // $localize looks a message up the moment it runs, so any translated text
  // evaluated while modules are still being imported (module-level constants,
  // static field initialisers) would otherwise stay English.
  Promise.all([loadStorefrontLanguage(), loadAppLanguage()])
    .finally(async () => {
      const [{ bootstrapApplication }, { appConfig }, { AppComponent }] = await Promise.all([
        import('@angular/platform-browser'),
        import('./app/app.config'),
        import('./app/app.component'),
      ]);
      await bootstrapApplication(AppComponent, appConfig);
    })
    .catch((err) => console.error(err));
}
