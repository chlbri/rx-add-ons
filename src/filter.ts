import { tap } from 'rxjs/operators';
import { filter as _filter } from 'rxjs/operators';
import { Identity, Predicate } from './types';

/**
 * Enhanced filter operator that provides access to all previously emitted values.
 * Similar to the standard RxJS filter operator but with an additional parameter
 * containing all values that have been emitted so far.
 *
 * @template T - The type of values emitted by the Observable
 * @param predicate - A function that evaluates each source value and returns a boolean.
 *   - value: The current emitted value
 *   - index: The zero-based index of the current emission
 *   - all: Array containing all values emitted so far (including the current value)
 * @returns A function that takes an Observable and returns a filtered Observable
 *
 * @example
 * ```typescript
 * // Filter values based on accumulated sum
 * source$.pipe(
 *   filter((value, index, all) => {
 *     const sum = all.reduce((acc, val) => acc + val, 0);
 *     return sum <= 50;
 *   })
 * )
 *
 * // Filter duplicates using accumulated values
 * source$.pipe(
 *   filter((value, index, all) => {
 *     return all.filter(v => v === value).length === 1;
 *   })
 * )
 *
 * // Filter based on pattern in accumulated array
 * source$.pipe(
 *   filter((value, index, all) => {
 *     if (all.length < 3) return true;
 *     const last3 = all.slice(-3);
 *     return !last3.every(v => v === value);
 *   })
 * )
 * ```
 *
 * @remarks
 * This operator accumulates all emitted values in memory, which means it should be used
 * carefully with long-running or high-frequency observables to avoid memory issues.
 * The accumulated array grows with each emission and is never cleared.
 *
 * The predicate function receives:
 * - The current value being evaluated
 * - The zero-based index of the current emission
 * - An array of all values emitted so far (including the current value)
 *
 * @since 0.0.2
 */
export const filter = <T>(predicate: Predicate<T>): Identity<T> => {
  return source => {
    const all: T[] = [];

    return source.pipe(
      tap(value => all.push(value)),
      _filter((value, index) => predicate(value, index, all)),
    );
  };
};

type CompareFunction<T> = (prev: T, curr: T) => boolean;
type KeySelector<T> = keyof T | ((value: T) => any);

/**
 * Filters values that have changed compared to the previous emission.
 * More sophisticated than distinctUntilChanged with flexible comparison options.
 *
 * @param compareBy - Optional key selector or custom comparison function
 * @returns A function that returns an Observable that emits only changed values
 *
 * @example
 * ```typescript
 * // Filter changed values using default equality
 * source$.pipe(filterChanged())
 *
 * // Filter changed values by specific property
 * source$.pipe(filterChanged('id'))
 *
 * // Filter changed values with custom comparison
 * source$.pipe(filterChanged((prev, curr) => prev.name !== curr.name))
 * ```
 */
filter.changed = <T>(
  compareBy: KeySelector<T> | CompareFunction<T>,
): Identity<T> => {
  return source => {
    let hasValue = false;
    let lastValue: T;

    return source.pipe(
      _filter(currentValue => {
        if (!hasValue) {
          hasValue = true;
          lastValue = currentValue;
          return true;
        }

        let hasChanged = false;

        if (typeof compareBy === 'function') {
          if (compareBy.length === 2) {
            // Custom comparison function
            hasChanged = (compareBy as CompareFunction<T>)(
              lastValue,
              currentValue,
            );
          } else {
            // Key selector function
            const keySelector = compareBy as (value: T) => any;
            hasChanged =
              keySelector(lastValue) !== keySelector(currentValue);
          }
        } else {
          // Property key comparison
          const key = compareBy as keyof T;
          hasChanged = lastValue[key] !== currentValue[key];
        }

        if (hasChanged) {
          lastValue = currentValue;
          return true;
        }

        return false;
      }),
    );
  };
};
