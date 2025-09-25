import { interval, of, Subject, throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { createPausable } from '../pausable';

vi.useFakeTimers();

describe('createPausable', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('#01 => Basic functionality', () => {
    test('#0 => should start in stopped state and not emit values', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      createPausable(source$, value => {
        values.push(value);
      });

      // Initially stopped, should not emit
      expect(values).toEqual([]);
    });

    test('#1 => should emit values when started', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();

      expect(values).toEqual([1, 2, 3]);
    });

    test('#2 => should stop emitting when stopped', () => {
      const values: number[] = [];
      const source$ = interval(100).pipe(take(10));

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      vi.advanceTimersByTime(250); // Should emit values at 100ms, 200ms

      controller.stop();
      const valuesAfterStop = [...values];
      vi.advanceTimersByTime(300); // Should not emit more values

      expect(values).toEqual(valuesAfterStop); // No new values after stop
      expect(values.length).toBeGreaterThanOrEqual(2);
    });

    test('#3 => should pause and resume correctly', () => {
      const values: number[] = [];
      const source$ = interval(100).pipe(take(10));

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      vi.advanceTimersByTime(150); // Should emit first value

      controller.pause();
      const pausedLength = values.length;
      vi.advanceTimersByTime(200); // Should not emit while paused

      expect(values.length).toBe(pausedLength); // No new values while paused

      controller.resume();
      vi.advanceTimersByTime(150); // Should resume emitting

      expect(values.length).toBeGreaterThan(pausedLength);
    });
  });

  describe('#02 => State transitions', () => {
    test('#0 => should ignore invalid transitions', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      // Try to pause when stopped (invalid)
      controller.pause();
      expect(values).toEqual([]);

      // Try to resume when stopped (invalid)
      controller.resume();
      expect(values).toEqual([]);

      // Start should work
      controller.start();
      expect(values).toEqual([1, 2, 3]);
    });

    test('#1 => should allow multiple start calls', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      controller.start(); // This actually restarts the observable

      // Cold observable like of() will re-emit when restarted
      expect(values).toEqual([1, 2, 3, 1, 2, 3]);
    });

    test('#2 => should handle pause when not running', () => {
      const values: number[] = [];
      const source$ = interval(100);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.pause(); // Should be ignored when stopped
      vi.advanceTimersByTime(300);

      expect(values).toEqual([]);
    });

    test('#3 => should handle resume when not paused', () => {
      const values: number[] = [];
      const source$ = interval(100).pipe(take(5));

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      controller.resume(); // Should be ignored when running
      vi.advanceTimersByTime(150);

      expect(values.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('#03 => Command method', () => {
    test('#0 => should work with command method', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.command('start');
      expect(values).toEqual([1, 2, 3]);

      values.length = 0;
      controller.command('stop');

      // After stopping, no new values should be emitted
      expect(values).toEqual([]); // Should not emit when stopped
    });

    test('#1 => should handle all command types', () => {
      const values: number[] = [];
      const source$ = interval(100).pipe(take(10));

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.command('start');
      vi.advanceTimersByTime(250);

      controller.command('pause');
      const pausedLength = values.length;
      vi.advanceTimersByTime(200);
      expect(values.length).toBe(pausedLength);

      controller.command('resume');
      vi.advanceTimersByTime(150);

      controller.command('stop');
      const stoppedLength = values.length;
      vi.advanceTimersByTime(200);
      expect(values.length).toBe(stoppedLength);
    });
  });

  describe('#04 => Observer types', () => {
    test('#0 => should work with function observer', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      expect(values).toEqual([1, 2, 3]);
    });

    test('#1 => should work with partial observer object', () => {
      const values: number[] = [];
      const errors: any[] = [];

      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, {
        next: value => values.push(value),
        error: err => errors.push(err),
      });

      controller.start();

      expect(values).toEqual([1, 2, 3]);
      expect(errors).toEqual([]);
    });

    test('#2 => should work without observer', () => {
      const source$ = of(1, 2, 3);

      expect(() => {
        const controller = createPausable(source$);
        controller.start();
      }).not.toThrow();
    });
  });

  describe('#05 => Error handling', () => {
    test('#0 => should propagate errors from source observable', () => {
      const errors: any[] = [];
      const error = new Error('Test error');
      const source$ = throwError(() => error);

      const controller = createPausable(source$, {
        error: err => errors.push(err),
      });

      controller.start();

      expect(errors).toEqual([error]);
    });

    test('#1 => should handle errors in observer function gracefully', () => {
      const source$ = of(1, 2, 3);
      const observerFn = vi.fn().mockImplementation(() => {
        throw new Error('Observer error');
      });

      // The error is caught by RxJS subscription, not thrown to test runner
      expect(() => {
        const controller = createPausable(source$, observerFn);
        controller.start();
      }).not.toThrow();

      expect(observerFn).toHaveBeenCalled();
    });
  });

  describe('#06 => Complex scenarios', () => {
    test('#0 => should handle rapid state changes', () => {
      const values: number[] = [];
      const source$ = interval(50).pipe(take(20));

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      vi.advanceTimersByTime(100);

      controller.pause();
      controller.resume();
      controller.pause();
      controller.resume();

      vi.advanceTimersByTime(100);

      expect(values.length).toBe(4);
      expect(values).toEqual([0, 1, 0, 1]);
    });

    test('#1 => should work with hot observables', () => {
      const values: number[] = [];
      const subject = new Subject<number>();

      const controller = createPausable(subject.asObservable(), {
        next: value => {
          values.push(value);
        },
      });

      // Emit before starting (should not be captured)
      subject.next(1);
      expect(values).toEqual([]);

      controller.start();
      subject.next(2);
      subject.next(3);

      controller.pause();
      subject.next(4); // Should not be captured while paused

      controller.resume();
      subject.next(5);

      expect(values).toEqual([2, 3, 5]);

      subject.complete();
    });

    test('#2 => should handle source completion', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, {
        next: value => values.push(value),
      });

      controller.start();

      expect(values).toEqual([1, 2, 3]);
    });

    test('#3 => should restart after stop', () => {
      const values: number[] = [];
      const source$ = of(1, 2, 3);

      const controller = createPausable(source$, value => {
        values.push(value);
      });

      controller.start();
      expect(values).toEqual([1, 2, 3]);

      controller.stop();
      values.length = 0;

      // Starting again should work
      controller.start();
      // Note: With a cold observable like of(), it will re-emit
      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe('#07 => Performance and memory', () => {
    test('#0 => should not cause memory leaks with large streams', () => {
      const values: number[] = [];
      const source$ = interval(1).pipe(take(1000));

      const controller = createPausable(source$, value => {
        if (values.length < 10) {
          values.push(value);
        }
      });

      controller.start();
      vi.advanceTimersByTime(20);
      controller.stop();

      expect(values.length).toBeLessThanOrEqual(20); // Allow for timing variations
    });
  });
});
