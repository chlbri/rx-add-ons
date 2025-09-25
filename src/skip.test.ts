import { EMPTY, of, throwError } from 'rxjs';
import { delay, take } from 'rxjs/operators';
import { skipWhile } from './skip';

describe('skipWhile', () => {
  describe('#01 => Complex predicate logic', () => {
    test('#01 => should handle predicate using sum of accumulated values', () => {
      const values = [3, 4, 2, 5, 1];
      const result: number[] = [];

      of(...values)
        .pipe(
          skipWhile((_value, _index, all) => {
            const sum = all.reduce((acc, val) => acc + val, 0);
            return sum <= 10;
          }),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([5, 1]);
    });

    test('#02 => should handle predicate using value comparison with accumulated array', () => {
      const values = [1, 2, 1, 3, 2, 1];
      const result: number[] = [];

      of(...values)
        .pipe(
          skipWhile((value, _index, all) => {
            const duplicateCount = all.filter(v => v === value).length;
            return duplicateCount === 1; // Skip while it's the first occurrence
          }),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 3, 2, 1]);
    });

    test('#03 => should handle predicate with complex index-based logic', () => {
      const values = [1, 3, 5, 2, 8];
      const result: number[] = [];

      of(...values)
        .pipe(
          skipWhile((value, index, all) => {
            if (index === 0) return true;
            const previous = all[index - 1];
            return value > previous; // Skip while ascending
          }),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([2, 8]);
    });

    test('#04 => should handle predicate checking for specific patterns in accumulated array', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8];
      const result: number[] = [];

      of(...values)
        .pipe(
          skipWhile((_value, _index, all) => {
            // Skip until we have at least 3 even numbers
            const evenCount = all.filter(v => v % 2 === 0).length;
            return evenCount < 3;
          }),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([6, 7, 8]);
    });
  });

  describe('#02 => Observable behavior', () => {
    test('#01 => should complete normally after skipping', () => {
      const values = [1, 2, 3, 4];
      const completeSpy = vi.fn();

      of(...values)
        .pipe(skipWhile(value => value < 3))
        .subscribe({
          complete: completeSpy,
        });

      expect(completeSpy).toHaveBeenCalled();
    });

    test('#02 => should work with async observables', async () => {
      const result: number[] = [];

      return new Promise<void>(resolve => {
        of(1, 2, 3, 4)
          .pipe(
            delay(10),
            skipWhile(value => value < 3),
          )
          .subscribe({
            next: value => result.push(value),
            complete: () => {
              expect(result).toEqual([3, 4]);
              resolve();
            },
          });
      });
    });

    test('#03 => should maintain proper accumulated state across async emissions', async () => {
      const predicate = vi
        .fn()
        .mockImplementation(
          (_value: number, _index: number, all: number[]) =>
            all.length < 3,
        );
      const result: number[] = [];

      return new Promise<void>(resolve => {
        of(1, 2, 3, 4)
          .pipe(delay(10), skipWhile(predicate))
          .subscribe({
            next: value => result.push(value),
            complete: () => {
              expect(result).toEqual([3, 4]);
              resolve();
            },
          });
      });
    });

    test('#04 => should not call predicate after first false result', () => {
      const predicate = vi
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const values = [1, 2, 3, 4, 5];
      const result: number[] = [];

      of(...values)
        .pipe(skipWhile(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([2, 3, 4, 5]);
      expect(predicate).toHaveBeenCalledTimes(2);
    });
  });

  describe('#03 => Error handling', () => {
    test('#01 => should propagate errors from the source observable', () => {
      const predicate = vi.fn().mockReturnValue(true);
      const error = new Error('Test error');
      const errorHandler = vi.fn();

      throwError(() => error)
        .pipe(skipWhile(predicate))
        .subscribe({
          error: errorHandler,
        });

      expect(errorHandler).toHaveBeenCalledWith(error);
      expect(predicate).not.toHaveBeenCalled();
    });

    test('#02 => should handle errors in predicate function', () => {
      const predicate = vi.fn().mockImplementation(() => {
        throw new Error('Predicate error');
      });
      const errorHandler = vi.fn();

      of(1, 2, 3).pipe(skipWhile(predicate)).subscribe({
        error: errorHandler,
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(predicate).toHaveBeenCalledTimes(1);
    });

    test('#03 => should handle errors that occur after some values are skipped', () => {
      let callCount = 0;
      const predicate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Predicate error on second call');
        }
        return true;
      });
      const errorHandler = vi.fn();
      const result: number[] = [];

      of(1, 2, 3, 4)
        .pipe(skipWhile(predicate))
        .subscribe({
          next: value => result.push(value),
          error: errorHandler,
        });

      expect(result).toEqual([]);
      expect(errorHandler).toHaveBeenCalled();
    });

    test('#04 => should handle errors after predicate returns false', () => {
      const predicate = vi
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const errorHandler = vi.fn();
      const result: number[] = [];

      throwError(() => new Error('Source error'))
        .pipe(skipWhile(predicate))
        .subscribe({
          next: value => result.push(value),
          error: errorHandler,
        });

      expect(errorHandler).toHaveBeenCalled();
      expect(predicate).not.toHaveBeenCalled();
    });
  });

  describe('#04 => Edge cases', () => {
    test('#01 => should handle empty observable', () => {
      const predicate = vi.fn();
      const result: any[] = [];
      const completeSpy = vi.fn();

      EMPTY.pipe(skipWhile(predicate)).subscribe({
        next: value => result.push(value),
        complete: completeSpy,
      });

      expect(predicate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(completeSpy).toHaveBeenCalled();
    });

    test('#02 => should handle single value observable that passes predicate', () => {
      const predicate = vi.fn().mockReturnValue(true);
      const result: number[] = [];

      of(42)
        .pipe(skipWhile(predicate))
        .subscribe(value => result.push(value));

      expect(predicate).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(42, 0, [42]);
      expect(result).toEqual([]);
    });

    test('#03 => should handle single value observable that fails predicate', () => {
      const predicate = vi.fn().mockReturnValue(false);
      const result: number[] = [];

      of(42)
        .pipe(skipWhile(predicate))
        .subscribe(value => result.push(value));

      expect(predicate).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(42, 0, [42]);
      expect(result).toEqual([42]);
    });

    test('#04 => should work with different data types', () => {
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const result: { id: number }[] = [];

      of(...objects)
        .pipe(
          skipWhile((obj, _index, all) => all.length < 3 && obj.id < 3),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([{ id: 3 }, { id: 4 }]);
    });

    test('#05 => should handle null and undefined values', () => {
      const values = [null, undefined, 1, 2, null];
      const result: any[] = [];

      of(...values)
        .pipe(skipWhile(value => value == null))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2, null]);
    });

    test('#06 => should handle zero values correctly', () => {
      const values = [0, 0, 1, 2, 0];
      const result: number[] = [];

      of(...values)
        .pipe(skipWhile(value => value === 0))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2, 0]);
    });

    test('#07 => should handle boolean values', () => {
      const values = [true, true, false, true, false];
      const result: boolean[] = [];

      of(...values)
        .pipe(skipWhile(value => value === true))
        .subscribe(value => result.push(value));

      expect(result).toEqual([false, true, false]);
    });
  });

  describe('#05 => Combination with other operators', () => {
    test('#01 => should work correctly when combined with take operator before skipWhile', () => {
      const result: number[] = [];

      of(1, 2, 3, 4, 5)
        .pipe(
          take(4),
          skipWhile(value => value < 3),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([3, 4]);
    });

    test('#02 => should work correctly when combined with take operator after skipWhile', () => {
      const result: number[] = [];

      of(1, 2, 3, 4, 5, 6)
        .pipe(
          skipWhile(value => value < 3),
          take(2),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([3, 4]);
    });

    test('#03 => should work when take not limits before predicate becomes false', () => {
      const result: number[] = [];

      of(1, 2, 3, 4, 5)
        .pipe(
          take(2),
          skipWhile(value => value < 10),
        ) // Would skip nothing
        .subscribe(value => result.push(value));

      expect(result).toEqual([]);
    });

    test('#04 => should work when take limits before predicate becomes false', () => {
      const result: number[] = [];

      of(1, 2, 3, 4, 5)
        .pipe(
          take(2),
          skipWhile(value => value > 10),
        ) // Would skip nothing
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2]);
    });

    test('#05 => should work when all values are skipped before take', () => {
      const result: number[] = [];

      of(1, 2, 3)
        .pipe(
          skipWhile(value => value < 10),
          take(5),
        ) // Skip all
        .subscribe(value => result.push(value));

      expect(result).toEqual([]);
    });
  });

  describe('#06 => Memory and performance', () => {
    test('#01 => should accumulate values in array correctly', () => {
      const capturedArrays: number[][] = [];
      const values = [1, 2, 3, 4];

      of(...values)
        .pipe(
          skipWhile((_value, _index, all) => {
            capturedArrays.push([...all]); // Capture snapshot of array
            return all.length < 3;
          }),
        )
        .subscribe();

      expect(capturedArrays).toEqual([[1], [1, 2], [1, 2, 3]]);
    });

    test('#02 => should handle large sequences efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const result: number[] = [];

      of(...largeArray)
        .pipe(skipWhile((_value, index) => index < 500))
        .subscribe(value => result.push(value));

      expect(result.length).toBe(500);
      expect(result[0]).toBe(500);
      expect(result[499]).toBe(999);
    });

    test('#03 => should stop accumulating after predicate becomes false', () => {
      const capturedArrays: number[][] = [];
      const predicate = vi
        .fn()
        .mockImplementation(
          (_value: number, _index: number, all: number[]) => {
            capturedArrays.push([...all]);
            return all.length < 2;
          },
        );
      const values = [1, 2, 3, 4, 5];

      of(...values)
        .pipe(skipWhile(predicate))
        .subscribe();

      // Should only capture arrays for the first 2 calls
      expect(capturedArrays).toEqual([[1], [1, 2]]);
      expect(predicate).toHaveBeenCalledTimes(2);
    });
  });
});
