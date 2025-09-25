import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';
import { buffer } from 'rxjs/internal/operators/buffer';
import { filter } from 'rxjs/internal/operators/filter';
import { share } from 'rxjs/internal/operators/share';

/**
 * Groups emissions by time windows. Emits arrays of values collected within each time window.
 *
 * @param min - Time window size in milliseconds
 * @param max - Optional maximum buffer size (defaults to no limit)
 * @returns A function that returns an Observable that emits arrays of grouped values
 *
 * @example
 * ```typescript
 * // Group emissions every 1000ms
 * source$.pipe(groupByTime(1000))
 *
 * // Group emissions every 500ms with max 10 items per group
 * source$.pipe(groupByTime(500, 10))
 * ```
 */
export function groupByTime<T>(
  min: number,
  max?: number,
): (source: Observable<T>) => Observable<T[]> {
  return (source: Observable<T>) => {
    const shared = source.pipe(share());

    if (max) {
      return new Observable<T[]>(subscriber => {
        let buffer: T[] = [];
        let windowStart = Date.now();

        const sourceSubscription = shared.subscribe({
          next: value => {
            buffer.push(value);

            // Check if buffer is full or window time has passed
            const now = Date.now();
            if (buffer.length >= max || now - windowStart >= min) {
              if (buffer.length > 0) {
                subscriber.next([...buffer]);
                buffer = [];
                windowStart = now;
              }
            }
          },
          error: err => {
            if (buffer.length > 0) {
              subscriber.next([...buffer]);
              buffer = [];
              windowStart = Date.now();
            }
            subscriber.error(err);
          },
          complete: () => {
            // Emit remaining buffer on completion
            if (buffer.length > 0) {
              subscriber.next([...buffer]);
            }
            subscriber.complete();
          },
        });

        return sourceSubscription.unsubscribe;
      });
    }

    const trigger = timer(min, min);

    // Simple time-based grouping without buffer size limit
    return shared.pipe(
      buffer(trigger),
      filter(group => group.length > 0), // Only emit non-empty groups
    );
  };
}
