import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadStorefrontLanguage } from './app/storefront/i18n/bootstrap-language';
import { environment } from './environments/environment';

// Table cards printed before the storefront moved to its own app point at
// office.shopbot.africa/#/m/<slug>[/t/<token>]. Forward them to the same path
// on the standalone storefront so those cards keep working. Production only,
// so the in-app storefront stays reachable for local development.
if (environment.production && location.hash.startsWith('#/m/')) {
  location.replace(`${environment.storefrontUrl}/${location.hash.slice('#/m/'.length)}`);
} else {
  loadStorefrontLanguage().finally(() => {
    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
  });
}
