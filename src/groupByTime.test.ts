import { interval, map, Subject, take } from 'rxjs';
import { groupByTime } from './groupByTime';

describe('groupByTime', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('#01 => should group emissions by time windows', async () => {
    const subject = new Subject<number>();
    const results: number[][] = [];

    const subscription = subject
      .pipe(groupByTime(1000))
      .subscribe(group => results.push(group));

    // Emit some values
    subject.next(1);
    subject.next(2);
    vi.advanceTimersByTime(500);
    subject.next(3);

    // Advance to trigger first window
    vi.advanceTimersByTime(500);

    // Emit more values for second window
    subject.next(4);
    subject.next(5);

    // Advance to trigger second window
    vi.advanceTimersByTime(1000);

    subject.complete();
    subscription.unsubscribe();

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual([1, 2, 3]);
    expect(results[1]).toEqual([4, 5]);
  });

  it('#02 => should respect maxBufferSize when provided', async () => {
    const subject = new Subject<number>();
    const results: number[][] = [];

    const subscription = subject
      .pipe(
        groupByTime(1000, 2), // Max 2 items per group
      )
      .subscribe(group => results.push(group));

    // Emit 3 values quickly
    subject.next(1);
    subject.next(2);
    subject.next(3); // This should trigger immediate emission due to buffer size

    vi.advanceTimersByTime(500);
    subject.next(4);
    subject.next(5); // This should trigger another emission

    subject.complete();
    subscription.unsubscribe();

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]).toEqual([1, 2]);
    expect(results[1]).toEqual([3, 4]);
    expect(results[2]).toEqual([5]);
  });

  it('#03 => should handle empty windows', async () => {
    const subject = new Subject<number>();
    const results: number[][] = [];

    const subscription = subject
      .pipe(groupByTime(1000))
      .subscribe(group => results.push(group));

    // Don't emit anything, just advance time
    vi.advanceTimersByTime(2000);

    subject.complete();
    subscription.unsubscribe();

    // Should not emit empty groups
    expect(results).toHaveLength(0);
  });

  it('#04 => should emit remaining buffer on completion', async () => {
    const subject = new Subject<number>();
    const results: number[][] = [];

    const subscription = subject
      .pipe(
        groupByTime(1000, 5), // Use maxBufferSize implementation
      )
      .subscribe(group => results.push(group));

    subject.next(1);
    subject.next(2);

    // Complete before timer triggers
    vi.advanceTimersByTime(500);
    subject.complete();
    subscription.unsubscribe();

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual([1, 2]);
  });

  it('#05 => with interval', () => {
    const LENGTH = 14;
    const TICK = 100;
    const results: number[][] = [];
    interval(TICK)
      .pipe(
        take(LENGTH),
        map(v => v + 1),
        groupByTime(700),
      )
      .subscribe(group => results.push(group));

    vi.advanceTimersByTime(TICK * (LENGTH + 1));

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(results[1]).toEqual([8, 9, 10, 11, 12, 13, 14]);
  });

  it('#06 => should propagate errors from source observable', () => {
    const subject = new Subject<number>();
    const results: number[][] = [];
    let error: any = null;

    const subscription = subject.pipe(groupByTime(1000)).subscribe({
      next: group => results.push(group),
      error: err => (error = err),
    });

    // Emit some values
    subject.next(1);
    subject.next(2);

    vi.advanceTimersByTime(1000);

    // Emit error
    const testError = new Error('Test error');
    subject.error(testError);

    subscription.unsubscribe();

    // Should propagate the error
    expect(error).toBe(testError);
    expect(error.message).toBe('Test error');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual([1, 2]);
  });

  it('#07 => should propagate errors with maxBufferSize', ({
    annotate,
  }) => {
    const subject = new Subject<number>();
    const results: number[][] = [];
    let error: any = null;
    const testError = new Error('Test error with buffer');

    const subscription = subject.pipe(groupByTime(1000, 5)).subscribe({
      next: group => results.push(group),
      error: err => (error = err),
    });

    // Emit some values
    annotate('Emitting values 1 and 2', 'important');
    subject.next(1);
    subject.next(2);

    expect(error).toBe(null);

    vi.advanceTimersByTime(1000);

    // Emit error
    subject.error(testError);

    subscription.unsubscribe();

    // Should propagate the error
    expect(error).toBe(testError);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual([1, 2]);
  });
});
