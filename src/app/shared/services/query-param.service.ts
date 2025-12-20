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

  /**
   * Remove query parameter(s) from a URL string.
   * Returns the URL with the specified query parameter(s) removed.
   * 
   * @param url - The URL string to modify
   * @param keysToRemove - Single key or array of keys to remove from the URL
   * @returns The URL with the specified query parameters removed
   * 
   * @example
   * // Remove single parameter
   * this.queryParamService.removeFromUrl('http://example.com?id=123&name=test', 'id')
   * // Returns: 'http://example.com?name=test'
   * 
   * // Remove multiple parameters
   * this.queryParamService.removeFromUrl('http://example.com?id=123&name=test&sort=asc', ['id', 'sort'])
   * // Returns: 'http://example.com?name=test'
   */
  removeFromUrl(url: string, keysToRemove: string | string[]): string {
    if (!url) return url;

    const urlObj = new URL(url);
    const keys = Array.isArray(keysToRemove) ? keysToRemove : [keysToRemove];

    for (const key of keys) {
      urlObj.searchParams.delete(key);
    }

    return urlObj.toString();
  }

  /**
   * Remove query parameter(s) from the current route.
   * This method updates the browser URL.
   * 
   * @param keysToRemove - Single key or array of keys to remove from the current URL
   * 
   * @example
   * // Remove single parameter
   * this.queryParamService.removeFromCurrentUrl('openPaymentModal')
   * 
   * // Remove multiple parameters
   * this.queryParamService.removeFromCurrentUrl(['openPaymentModal', 'filter'])
   */
  removeFromCurrentUrl(keysToRemove: string | string[]): void {
    const currentUrl = this.router.url;
    const cleanUrl = this.removeFromUrl(currentUrl, keysToRemove);
    
    // Navigate to the clean URL
    this.router.navigateByUrl(cleanUrl);
  }
}
