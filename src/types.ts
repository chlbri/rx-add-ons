import type { Observable } from 'rxjs';

export type Identity<T = any> = (source: Observable<T>) => Observable<T>;
export type Fn<T = any, R = any> = (
  value: T,
  index: number,
  all: T[],
) => R;
export type Predicate<T = any> = Fn<T, boolean>;
