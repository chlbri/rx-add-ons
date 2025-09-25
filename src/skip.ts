import { tap } from 'rxjs/internal/operators/tap';
import { skipWhile as skip } from 'rxjs/internal/operators/skipWhile';
import { Identity, Predicate } from './types';

export function skipWhile<T>(predicate: Predicate<T>): Identity<T> {
  return source => {
    const all: T[] = [];
    return source.pipe(
      tap(v => all.push(v)),
      skip((value, index) => predicate(value, index, all)),
    );
  };
}
