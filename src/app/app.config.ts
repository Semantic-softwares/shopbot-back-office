import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection, isDevMode } from '@angular/core';
import {  provideRouter, withHashLocation } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { storedAppLanguage } from './shared/i18n/app-languages';
import { AppDatepickerIntl, AppPaginatorIntl } from './shared/i18n/material-intl';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { partnerPortalInterceptor } from './partner-portal/partner-portal.interceptor';
import { subscriptionInterceptor } from './shared/interceptors/subscription.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { progressInterceptor } from 'ngx-progressbar/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideEchartsCore } from 'ngx-echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(), 
    provideNativeDateAdapter(),
    { provide: MatPaginatorIntl, useClass: AppPaginatorIntl },
    { provide: MatDatepickerIntl, useClass: AppDatepickerIntl },
    // Dates, numbers and currency follow the language chosen in the appearance menu.
    // (Storefront routes keep their own picker, so they stay on the default locale.)
    { provide: LOCALE_ID, useFactory: () => (location.hash.startsWith('#/m/') ? 'en-US' : storedAppLanguage().locale) },
    { provide: MAT_DATE_LOCALE, useFactory: () => (location.hash.startsWith('#/m/') ? 'en-US' : storedAppLanguage().locale) },
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: {
        fontSet: 'material-symbols-outlined',
      },
    },
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor, partnerPortalInterceptor, subscriptionInterceptor, progressInterceptor])
    ), 
    provideCharts(withDefaultRegisterables()),
    provideEchartsCore({ echarts: () => import('echarts') }),
    provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ],
};
