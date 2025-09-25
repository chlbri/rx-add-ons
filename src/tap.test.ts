import { EMPTY, of, throwError } from 'rxjs';
import { delay, take } from 'rxjs/operators';
import { tapWhile } from './tap';

describe('tapWhile', () => {
  describe('#01 => Basic functionality', () => {
    test('#00 => should execute side effect when predicate returns true', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const values = [1, 2, 3];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(predicate).toHaveBeenCalledTimes(3);
      expect(sideEffect).toHaveBeenCalledTimes(3);
    });

    test('#01 => should not execute side effect when predicate returns false', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(false);
      const values = [1, 2, 3];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(predicate).toHaveBeenCalledTimes(3);
      expect(sideEffect).not.toHaveBeenCalled();
    });

    test('#02 => should execute side effect selectively based on predicate', () => {
      const sideEffect = vi.fn();
      const predicate = (value: number) => value > 2;
      const values = [1, 2, 3, 4];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(2);
    });

    test('#03 => should pass correct index to predicate function', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const values = ['a', 'b', 'c'];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(predicate).toHaveBeenCalledTimes(3);
      expect(sideEffect).toHaveBeenCalledTimes(3);
    });

    test('#04 => should pass correct index to sideEffect function', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const values = [10, 20, 30];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(3);
      expect(predicate).toHaveBeenCalledTimes(3);
    });

    test('#05 => should pass accumulated values array to predicate', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn(
        (_value: number, _index: number, all: number[]) => {
          return all.reduce((sum, v) => sum + v, 0) <= 10;
        },
      );
      const values = [1, 2, 3, 4, 5];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      // Should execute side effect for values 1, 2, 3 (sum = 6), and 4 (sum = 10)
      // But not for 5 (sum = 15)
      expect(sideEffect).toHaveBeenCalledTimes(4);
      expect(predicate).toHaveBeenCalledTimes(5);
    });

    test('#06 => should pass accumulated values array to sideEffect', () => {
      const capturedArrays: number[][] = [];
      const sideEffect = vi.fn(
        (_value: number, _index: number, all: number[]) => {
          capturedArrays.push([...all]); // Copy the array
        },
      );
      const predicate = () => true;
      const values = [1, 2, 3];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(capturedArrays).toEqual([[1], [1, 2], [1, 2, 3]]);
    });

    test('#07 => should work with conditional predicate using accumulated values', () => {
      const sideEffect = vi.fn();
      const values = [1, 2, 3, 2, 1];

      of(...values)
        .pipe(
          tapWhile((value, _index, all) => {
            // Only execute side effect if value hasn't appeared before
            return all.filter(v => v === value).length === 1;
          }, sideEffect),
        )
        .subscribe();

      // Should execute for 1, 2, 3 but not for the duplicate 2 and 1
      expect(sideEffect).toHaveBeenCalledTimes(3);
    });
  });

  describe('#03 => Observable behavior', () => {
    test('#00 => should not affect the original observable stream', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);
      const values = [1, 2, 3];
      const result: number[] = [];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2, 3]);
    });

    test('#01 => should pass through values unchanged', () => {
      const sideEffect = vi.fn();
      const predicate = () => true;
      const values = ['a', 'b', 'c'];
      const result: string[] = [];

      of(...values)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe(value => result.push(value));

      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('#02 => should work with async observables', async () => {
      const sideEffect = vi.fn();
      const predicate = (value: number) => value % 2 === 0;

      return new Promise<void>(resolve => {
        of(1, 2, 3, 4)
          .pipe(delay(10), tapWhile(predicate, sideEffect))
          .subscribe({
            complete: () => {
              expect(sideEffect).toHaveBeenCalledTimes(2);
              resolve();
            },
          });
      });
    });
  });

  describe('#03 => Error handling', () => {
    test('#00 => should propagate errors from the source observable', () => {
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

    test('#01 => should handle errors in predicate function', () => {
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

    test('#02 => should handle errors in side effect function', () => {
      const sideEffect = vi.fn().mockImplementation(() => {
        throw new Error('Side effect error');
      });
      const predicate = vi.fn().mockReturnValue(true);
      const errorHandler = vi.fn();

      of(1, 2, 3).pipe(tapWhile(predicate, sideEffect)).subscribe({
        error: errorHandler,
      });

      expect(sideEffect).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledTimes(1);
    });
  });

  describe('#04 => Edge cases', () => {
    test('#00 => should handle empty observable', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn();

      EMPTY.pipe(tapWhile(predicate, sideEffect)).subscribe();

      expect(predicate).not.toHaveBeenCalled();
      expect(sideEffect).not.toHaveBeenCalled();
    });

    test('#01 => should handle single value observable', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);

      of(42).pipe(tapWhile(predicate, sideEffect)).subscribe();

      expect(predicate).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(42, 0, [42]);
      expect(sideEffect).toHaveBeenCalledTimes(1);
    });

    test('#02 => should work with different data types', () => {
      const sideEffect = vi.fn();
      const predicate = (obj: { id: number }) => obj.id > 1;
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];

      of(...objects)
        .pipe(tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(2);
    });

    test('#03 => should handle null and undefined values', () => {
      const sideEffect = vi.fn();
      const values = [null, undefined, 0, '', false];

      of(...values)
        .pipe(tapWhile(value => value !== null, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(4);
    });
  });

  describe('#05 => Combination with other operators', () => {
    test('#00 => should work correctly when combined with take operator', () => {
      const sideEffect = vi.fn();
      const predicate = vi.fn().mockReturnValue(true);

      of(1, 2, 3, 4, 5)
        .pipe(take(3), tapWhile(predicate, sideEffect))
        .subscribe();

      expect(sideEffect).toHaveBeenCalledTimes(3);
    });
  });
});
