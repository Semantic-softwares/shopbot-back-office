import { inject, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class QueryParamService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * Add new query parameters to the current URL.
   * Accepts an object or a string in the format "key=value&key2=value2"
   */
  add(params: { [key: string]: any } | string): void {
    const currentParams = { ...this.route.snapshot.queryParams };

    let newParams: { [key: string]: any } = {};

    if (typeof params === 'string') {
      params.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          newParams[key] = decodeURIComponent(value ?? '');
        }
      });
    } else {
      newParams = params;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...currentParams, ...newParams },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Remove one or more query parameters from the current URL.
   * If no argument is passed, all query parameters will be removed.
   */
  remove(keysToRemove?: string | string[]): void {
    const currentParams = { ...this.route.snapshot.queryParams };

    if (!keysToRemove) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
      });
      return;
    }

    const keys = Array.isArray(keysToRemove) ? keysToRemove : [keysToRemove];

    for (const key of keys) {
      delete currentParams[key];
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: currentParams,
    });
  }

  /**
   * Get all query parameters as an observable.
   */
  get getAllParams$() {
    return this.route.queryParams;
  }

  /**
   * Get all query parameters as a snapshot (synchronously).
   */
  get getAllParamsSnapshot() {
    return this.route.snapshot.queryParams;
  }
}
