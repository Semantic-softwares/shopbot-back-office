import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadStorefrontLanguage } from './app/storefront/i18n/bootstrap-language';

loadStorefrontLanguage().finally(() => {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
});
