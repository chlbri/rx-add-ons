import { EMPTY, Observable } from 'rxjs';
import { race } from 'rxjs/internal/observable/race';
import { timer } from 'rxjs/internal/observable/timer';
import { switchMap } from 'rxjs/internal/operators/switchMap';

/**
 * Switches to a fallback Observable if the source doesn't emit within the specified timeout.
 * Unlike the standard timeout operator, this doesn't error but switches to the fallback.
 *
 * @param timeout - Timeout duration in milliseconds
 * @param fallback - Observable to switch to on timeout
 * @returns A function that returns an Observable that emits from source or fallback
 *
 * @example
 * ```typescript
 * // Switch to fallback after 5 seconds
 * source$.pipe(
 *   timeoutWithFallback(5000, of('timeout'))
 * )
 *
 * // Switch to alternative data source on timeout
 * source$.pipe(
 *   timeoutWithFallback(3000, alternativeSource$)
 * )
 * ```
 */
export const timeoutWithFallback = <T>(
  timeout: number,
  fallback: Observable<T> = EMPTY,
): ((source: Observable<T>) => Observable<T>) => {
  return source => {
    return race(source, timer(timeout).pipe(switchMap(() => fallback)));
  };
};

/**
 * Switches to a fallback Observable if the source doesn't emit within the specified timeout.
 * Unlike the standard timeout operator, this doesn't error but switches to the fallback.
 *
 * @param timeout - Timeout duration in milliseconds
 * @param fallback - Observable to switch to on timeout
 * @returns A function that returns an Observable that emits from source or fallback
 *
 * @example
 * ```typescript
 * // Switch to fallback after 5 seconds
 * source$.pipe(
 *   timeoutWithFallback(5000, of('timeout'))
 * )
 *
 * // Switch to alternative data source on timeout
 * source$.pipe(
 *   timeoutWithFallback(3000, alternativeSource$)
 * )
 * ```
 */
export const timeout = timeoutWithFallback;

/**
 * Timeout with fallback that can be configured per emission
 * Resets timeout on each emission from source
 *
 * @see {@linkcode timeoutWithFallback}
 */
export const tickWithFallback = <T>(
  timeout: number,
  fallback: Observable<T> = EMPTY,
): ((source: Observable<T>) => Observable<T>) => {
  return source => {
    return new Observable<T>(subscriber => {
      let timeoutHandle: NodeJS.Timeout | null = null;
      let isCompleted = false;

      const resetTimeout = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        timeoutHandle = setTimeout(() => {
          if (!isCompleted) {
            isCompleted = true;
            sourceSubscription.unsubscribe();

            // Switch to fallback
            fallback.subscribe({
              next: value => subscriber.next(value),
              error: err => subscriber.error(err),
              complete: () => subscriber.complete(),
            });
          }
        }, timeout);
      };

      // Start initial timeout
      resetTimeout();

      const sourceSubscription = source.subscribe({
        next: value => {
          if (!isCompleted) {
            subscriber.next(value);
            resetTimeout(); // Reset timeout on each emission
          }
        },
        error: err => {
          if (!isCompleted) {
            isCompleted = true;
            if (timeoutHandle) {
              clearTimeout(timeoutHandle);
            }
            subscriber.error(err);
          }
        },
        complete: () => {
          if (!isCompleted) {
            isCompleted = true;
            if (timeoutHandle) {
              clearTimeout(timeoutHandle);
            }
            subscriber.complete();
          }
        },
      });

      return () => {
        isCompleted = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        sourceSubscription.unsubscribe();
      };
    });
  };
};

/**
 * Timeout with fallback that can be configured per emission
 * Resets timeout on each emission from source
 *
 * @see {@linkcode timeoutWithFallback}
 */
export const tick = tickWithFallback;
