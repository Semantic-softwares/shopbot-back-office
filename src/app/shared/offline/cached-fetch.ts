import { Observable } from 'rxjs';
import { OfflineStore } from './offline-store.service';

/**
 * Wraps a read from the server so the device remembers the answer:
 *  - what was saved last time is shown straight away (so a cold start with no connection still has data);
 *  - the live answer replaces it and is saved;
 *  - if the server cannot be reached, the saved copy is what the screen keeps (an error only when there is nothing saved).
 */
export function cachedFetch<T>(offline: OfflineStore, key: string, source$: Observable<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    let live = false;
    let gone = false;
    void offline.getReference<T>(key).then((hit) => {
      if (hit && !live && !gone) subscriber.next(hit.value);
    });
    const subscription = source$.subscribe({
      next: (value) => {
        live = true;
        subscriber.next(value);
        void offline.setReference(key, value);
      },
      error: (error) => {
        void offline.getReference<T>(key).then((hit) => {
          if (gone) return;
          if (hit) {
            if (!live) subscriber.next(hit.value);
            subscriber.complete();
          } else subscriber.error(error);
        });
      },
      complete: () => subscriber.complete(),
    });
    return () => {
      gone = true;
      subscription.unsubscribe();
    };
  });
}
