import { EMPTY, of, throwError } from 'rxjs';
import { delay, take } from 'rxjs/operators';
import { tapWhile } from '../tapWhile';

describe('tapWhile', () => {
  describe('#01 => Basic functionality', () => {
    test('#0 => should execute side effect when predicate returns true', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const values = [1, 2, 3];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(predicate).toHaveBeenCalledTimes(3);
      expect(sideEffect).toHaveBeenCalledTimes(3);
      expect(sideEffect).toHaveBeenCalledWith(1);
      expect(sideEffect).toHaveBeenCalledWith(2);
      expect(sideEffect).toHaveBeenCalledWith(3);
    });

    test('#1 => should not execute side effect when predicate returns false', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(false);
      const values = [1, 2, 3];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(predicate).toHaveBeenCalledTimes(3);
      expect(sideEffect).not.toHaveBeenCalled();
    });

    test('#2 => should execute side effect selectively based on predicate', () => {
      const sideEffect = vi.fn();
      const predicate = (value: number) => value > 2;
      const values = [1, 2, 3, 4];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(2);
      expect(sideEffect).toHaveBeenCalledWith(3);
      expect(sideEffect).toHaveBeenCalledWith(4);
      expect(sideEffect).not.toHaveBeenCalledWith(1);
      expect(sideEffect).not.toHaveBeenCalledWith(2);
    });
  });

  describe('#02 => Observable behavior', () => {
    test('#0 => should not affect the original observable stream', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const values = [1, 2, 3];
      const result: number[] = [];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2, 3]);
    });

    test('#1 => should pass through values unchanged', () => {
      const sideEffect = vi.fn();
      const predicate = () => true;
      const values = ['a', 'b', 'c'];
      const result: string[] = [];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe(value => result.push(value));

      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('#2 => should work with async observables', async () => {
      const sideEffect = vi.fn();
      const predicate = (value: number) => value % 2 === 0;

      return new Promise<void>(resolve => {
        of(1, 2, 3, 4)
          .pipe(delay(10), tapWhile(predicate, sideEffect))
          .subscribe({
            complete: () => {
              expect(sideEffect).toHaveBeenCalledTimes(2);
              expect(sideEffect).toHaveBeenCalledWith(2);
              expect(sideEffect).toHaveBeenCalledWith(4);
              resolve();
            },
          });
      });
    });
  });

  describe('#03 => Error handling', () => {
    test('#0 => should propagate errors from the source observable', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const error = new Error('Test error');
      const errorHandler = vi.fn();

      throwError(() => error)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe({
          error: errorHandler,
        });

      expect(errorHandler).toHaveBeenCalledWith(error);
      expect(sideEffect).not.toHaveBeenCalled();
      expect(predicate).not.toHaveBeenCalled();
    });

    test('#1 => should handle errors in predicate function', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockImplementation(() => {
        throw new Error('Predicate error');
      });
      const errorHandler = vi.fn();

      of(1, 2, 3).pipe(tapWhile(predicate, sideEffect)).subscribe({
        error: errorHandler,
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(sideEffect).not.toHaveBeenCalled();
    });

    test('#2 => should handle errors in side effect function', () => {
      const sideEffect = vi.fn().mockImplementation(() => {
        throw new Error('Side effect error');
      });
      const predicate = vi.fn().mockReturnValue(true);
      const errorHandler = vi.fn();

      of(1, 2, 3).pipe(tapWhile(predicate, sideEffect)).subscribe({
        error: errorHandler,
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(predicate).toHaveBeenCalled();
    });
  });

  describe('#04 => Edge cases', () => {
    test('#0 => should handle empty observable', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn();

      EMPTY.pipe(tapWhile(predicate, sideEffect)).subscribe();

      expect(predicate).not.toHaveBeenCalled();
      expect(sideEffect).not.toHaveBeenCalled();
    });

    test('#1 => should handle single value observable', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);

      of(42).pipe(tapWhile(predicate, sideEffect)).subscribe();

      expect(predicate).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(42);
      expect(sideEffect).toHaveBeenCalledTimes(1);
      expect(sideEffect).toHaveBeenCalledWith(42);
    });

    test('#2 => should work with different data types', () => {
      const sideEffect = vi.fn();
      const predicate = (obj: { id: number }) => obj.id > 1;
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];

      of(...objects)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(2);
      expect(sideEffect).toHaveBeenCalledWith({ id: 2 });
      expect(sideEffect).toHaveBeenCalledWith({ id: 3 });
    });

    test('#3 => should handle null and undefined values', () => {
      const sideEffect = vi.fn();
      const predicate = (value: any) => value != null;
      const values = [null, undefined, 0, '', false];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(3);
      expect(sideEffect).toHaveBeenCalledWith(0);
      expect(sideEffect).toHaveBeenCalledWith('');
      expect(sideEffect).toHaveBeenCalledWith(false);
    });
  });

  describe('#05 => Combination with other operators', () => {
    test('#0 => should work correctly when combined with take operator', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);

      of(1, 2, 3, 4, 5)
        .pipe(take(3), tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(3);
      expect(sideEffect).toHaveBeenCalledWith(1);
      expect(sideEffect).toHaveBeenCalledWith(2);
      expect(sideEffect).toHaveBeenCalledWith(3);
    });
  });
});
