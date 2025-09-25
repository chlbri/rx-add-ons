import { type Observable } from 'rxjs';
import { tap } from 'rxjs/internal/operators/tap';
import type { Fn, Predicate } from './types';

export function tapWhile<T>(
  predicate: Predicate<T>,
  sideEffect: Fn<T, void>,
) {
  return (source: Observable<T>) => {
    const all: T[] = [];
    let index = 0;

    return source.pipe(
      tap(value => {
        all.push(value);
      }),
      tap(value => {
        const check = predicate(value, index, all);
        if (check) sideEffect(value, index, all);
        index++;
      }),
    );
  };
}
