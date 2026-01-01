import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {  provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { progressInterceptor } from 'ngx-progressbar/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(), 
    provideNativeDateAdapter(),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: {
        fontSet: 'material-symbols-outlined',
      },
    },
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor, progressInterceptor])
    ), provideCharts(withDefaultRegisterables()), provideCharts(withDefaultRegisterables())
  ],
};
