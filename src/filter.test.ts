import { EMPTY, of, throwError } from 'rxjs';
import { delay, take } from 'rxjs/operators';
import { filter } from './filter';

describe('filter', () => {
  describe('#01 => Complex predicate logic', () => {
    test('#01 => should handle predicate using sum of accumulated values', () => {
      const values = [3, 4, 2, 5, 1];
      const result: number[] = [];

      of(...values)
        .pipe(
          filter((_value: number, _index: number, all: number[]) => {
            const sum = all.reduce((acc, val) => acc + val, 0);
            return sum <= 10;
          }),
        )
        .subscribe(value => result.push(value));

      expect(result).toEqual([3, 4, 2]);
    });

    test('#02 => should handle predicate using value comparison with accumulated array', () => {
      const predicate = (value: number, _index: number, all: number[]) => {
        const duplicateCount = all.filter(v => v === value).length;
        return duplicateCount === 1; // Keep only first occurrence
      };
      const values = [1, 2, 1, 3, 2, 1];
      const result: number[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2, 3]);
    });

    test('#03 => should handle predicate with complex index-based logic', () => {
      const predicate = (value: number, index: number, all: number[]) => {
        if (index === 0) return true;
        const previous = all[index - 1];
        return value > previous; // Keep only ascending values
      };
      const values = [1, 3, 2, 5, 8, 4];
      const result: number[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 3, 5, 8]);
    });

    test('#04 => should handle predicate checking for specific patterns in accumulated array', () => {
      const predicate = (
        _value: number,
        _index: number,
        all: number[],
      ) => {
        // Keep only when we have at least 2 even numbers
        const evenCount = all.filter(v => v % 2 === 0).length;
        return evenCount >= 2;
      };
      const values = [1, 2, 3, 4, 5, 6, 7, 8];
      const result: number[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([4, 5, 6, 7, 8]);
    });
  });

  describe('#02 => Observable behavior', () => {
    test('#01 => should complete normally after filtering', () => {
      const predicate = (value: number) => value > 2;
      const values = [1, 2, 3, 4];
      const completeSpy = vi.fn();

      of(...values)
        .pipe(filter(predicate))
        .subscribe({
          complete: completeSpy,
        });

      expect(completeSpy).toHaveBeenCalled();
    });

    test('#02 => should work with async observables', async () => {
      const predicate = (value: number) => value > 2;
      const result: number[] = [];

      return new Promise<void>(resolve => {
        of(1, 2, 3, 4)
          .pipe(delay(10), filter(predicate))
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
            all.length >= 3,
        );
      const result: number[] = [];

      return new Promise<void>(resolve => {
        of(1, 2, 3, 4)
          .pipe(delay(10), filter(predicate))
          .subscribe({
            next: value => result.push(value),
            complete: () => {
              expect(result).toEqual([3, 4]);
              resolve();
            },
          });
      });
    });

    test('#04 => should call predicate for each value', () => {
      const predicate = vi.fn().mockReturnValue(true);
      const values = [1, 2, 3, 4, 5];
      const result: number[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2, 3, 4, 5]);
      expect(predicate).toHaveBeenCalledTimes(5);
    });
  });

  describe('#03 => Error handling', () => {
    test('#01 => should propagate errors from the source observable', () => {
      const predicate = vi.fn().mockReturnValue(true);
      const error = new Error('Test error');
      const errorHandler = vi.fn();

      throwError(() => error)
        .pipe(filter(predicate))
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

      of(1, 2, 3).pipe(filter(predicate)).subscribe({
        error: errorHandler,
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(predicate).toHaveBeenCalledTimes(1);
    });

    test('#03 => should handle errors that occur after some values are filtered', () => {
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
        .pipe(filter(predicate))
        .subscribe({
          next: value => result.push(value),
          error: errorHandler,
        });

      expect(result).toEqual([1]);
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('#04 => Edge cases', () => {
    test('#01 => should handle empty observable', () => {
      const predicate = vi.fn();
      const result: any[] = [];
      const completeSpy = vi.fn();

      EMPTY.pipe(filter(predicate)).subscribe({
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
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(predicate).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(42, 0, [42]);
      expect(result).toEqual([42]);
    });

    test('#03 => should handle single value observable that fails predicate', () => {
      const predicate = vi.fn().mockReturnValue(false);
      const result: number[] = [];

      of(42)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(predicate).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(42, 0, [42]);
      expect(result).toEqual([]);
    });

    test('#04 => should work with different data types', () => {
      const predicate = (
        obj: { id: number },
        _index: number,
        all: { id: number }[],
      ) => {
        return all.length >= 2 && obj.id > 2;
      };
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const result: { id: number }[] = [];

      of(...objects)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([{ id: 3 }, { id: 4 }]);
    });

    test('#05 => should handle null and undefined values', () => {
      const predicate = (value: any) => value != null;
      const values = [null, undefined, 1, 2, null];
      const result: any[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2]);
    });

    test('#06 => should handle zero values correctly', () => {
      const predicate = (value: number) => value !== 0;
      const values = [0, 0, 1, 2, 0];
      const result: number[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2]);
    });

    test('#07 => should handle boolean values', () => {
      const predicate = (value: boolean) => value === true;
      const values = [true, false, false, true, false];
      const result: boolean[] = [];

      of(...values)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([true, true]);
    });
  });

  describe('#05 => Combination with other operators', () => {
    test('#01 => should work correctly when combined with take operator before filter', () => {
      const predicate = (value: number) => value > 2;
      const result: number[] = [];

      of(1, 2, 3, 4, 5)
        .pipe(take(4), filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([3, 4]);
    });

    test('#02 => should work correctly when combined with take operator after filter', () => {
      const predicate = (value: number) => value > 2;
      const result: number[] = [];

      of(1, 2, 3, 4, 5, 6)
        .pipe(filter(predicate), take(2))
        .subscribe(value => result.push(value));

      expect(result).toEqual([3, 4]);
    });

    test('#03 => should work when take limits before filter', () => {
      const predicate = (value: number) => value > 10; // Would filter all
      const result: number[] = [];

      of(1, 2, 3, 4, 5)
        .pipe(take(2), filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([]);
    });

    test('#04 => should work when take limits after filter', () => {
      const predicate = (value: number) => value < 10; // Would keep all
      const result: number[] = [];

      of(1, 2, 3, 4, 5)
        .pipe(take(2), filter(predicate))
        .subscribe(value => result.push(value));

      expect(result).toEqual([1, 2]);
    });

    test('#05 => should work when all values are filtered out', () => {
      const predicate = (value: number) => value > 10; // Filter all
      const result: number[] = [];

      of(1, 2, 3)
        .pipe(filter(predicate), take(5))
        .subscribe(value => result.push(value));

      expect(result).toEqual([]);
    });
  });

  describe('#06 => Memory and performance', () => {
    test('#01 => should accumulate values in array correctly', () => {
      const capturedArrays: number[][] = [];
      const predicate = (
        _value: number,
        _index: number,
        all: number[],
      ) => {
        capturedArrays.push([...all]); // Capture snapshot of array
        return true;
      };
      const values = [1, 2, 3, 4];

      of(...values)
        .pipe(filter(predicate))
        .subscribe();

      expect(capturedArrays).toEqual([
        [1],
        [1, 2],
        [1, 2, 3],
        [1, 2, 3, 4],
      ]);
    });

    test('#02 => should handle large sequences efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const predicate = (_value: number, index: number) => index >= 500;
      const result: number[] = [];

      of(...largeArray)
        .pipe(filter(predicate))
        .subscribe(value => result.push(value));

      expect(result.length).toBe(500);
      expect(result[0]).toBe(500);
      expect(result[499]).toBe(999);
    });

    test('#03 => should continue accumulating throughout the stream', () => {
      const capturedArrays: number[][] = [];
      const predicate = vi
        .fn()
        .mockImplementation(
          (_value: number, _index: number, all: number[]) => {
            capturedArrays.push([...all]);
            return all.length % 2 === 0; // Filter every other based on accumulated length
          },
        );
      const values = [1, 2, 3, 4, 5];

      of(...values)
        .pipe(filter(predicate))
        .subscribe();

      // Should capture arrays for all calls
      expect(capturedArrays).toEqual([
        [1],
        [1, 2],
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3, 4, 5],
      ]);
      expect(predicate).toHaveBeenCalledTimes(5);
    });
  });
});

describe('#02 => changed', () => {
  it('should filter changed values by property key', async () => {
    const source$ = of(
      { id: 1, name: 'John' },
      { id: 1, name: 'Jane' },
      { id: 2, name: 'Jane' },
      { id: 2, name: 'Bob' },
    );

    const results: any[] = [];
    source$
      .pipe(filter.changed('id'))
      .subscribe(value => results.push(value));

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(1);
    expect(results[1].id).toBe(2);
  });

  it('should filter changed values with custom comparison function', async () => {
    const source$ = of(
      { name: 'John', age: 25 },
      { name: 'John', age: 26 },
      { name: 'Jane', age: 26 },
      { name: 'Jane', age: 27 },
    );

    const results: any[] = [];
    source$
      .pipe(filter.changed((prev, curr) => prev.name !== curr.name))
      .subscribe(value => results.push(value));

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('John');
    expect(results[1].name).toBe('Jane');
  });

  it('should filter changed values with key selector function', async () => {
    const source$ = of(
      { user: { id: 1 }, data: 'a' },
      { user: { id: 1 }, data: 'b' },
      { user: { id: 2 }, data: 'b' },
      { user: { id: 2 }, data: 'c' },
    );

    const results: any[] = [];
    source$
      .pipe(filter.changed((obj: any) => obj.user.id))
      .subscribe(value => results.push(value));

    expect(results).toHaveLength(2);
    expect(results[0].user.id).toBe(1);
    expect(results[1].user.id).toBe(2);
  });
});
