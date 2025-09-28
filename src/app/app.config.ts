import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {  provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation(), withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', // scrolls to top on route change
        anchorScrolling: 'enabled', // allows scrolling to element IDs (#section)
      })),
    provideAnimationsAsync(), 
    provideNativeDateAdapter(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor])
    ), provideCharts(withDefaultRegisterables()), provideCharts(withDefaultRegisterables())
  ],
};
