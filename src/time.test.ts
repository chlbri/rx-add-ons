import {
  lastValueFrom,
  NEVER,
  Observable,
  of,
  Subject,
  timer,
} from 'rxjs';
import { delay, toArray } from 'rxjs/operators';
import {
  tickWithFallback,
  timeoutWithFallback,
  tick,
  timeout,
} from './timeout';

describe('#01 => timeoutWithFallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('#01 => should emit from source when it emits before timeout', async () => {
    const source$ = of('a', 'b', 'c');
    const fallback$ = of('timeout');

    const promise = lastValueFrom(
      source$.pipe(timeoutWithFallback(1000, fallback$), toArray()),
    );

    vi.advanceTimersByTime(500);
    const results = await promise;

    expect(results).toEqual(['a', 'b', 'c']);
  });

  it('#02 => should switch to fallback when source times out', async () => {
    const source$ = NEVER;
    const fallback$ = of('fallback');

    const promise = lastValueFrom(
      source$.pipe(timeout(1000, fallback$), toArray()),
    );

    vi.advanceTimersByTime(1000);
    const results = await promise;

    expect(results).toEqual(['fallback']);
  });

  it('#03 => should work with delayed source that emits after timeout', async () => {
    const source$ = timer(500).pipe(delay(500));
    const fallback$ = of(999);

    const promise = lastValueFrom(
      source$.pipe(timeoutWithFallback(1000, fallback$), toArray()),
    );

    vi.advanceTimersByTime(1000);
    const results = await promise;

    expect(results).toEqual([999]);
  });

  it('#04 => should handle source that emits and then times out', async () => {
    const subject = new Subject<string>();
    const fallback$ = of('fallback');

    const promise = lastValueFrom(
      subject.pipe(timeoutWithFallback(1000, fallback$), toArray()),
    );

    // Emit immediately
    subject.next('first');
    vi.advanceTimersByTime(500);

    // Don't timeout since we already emitted
    vi.advanceTimersByTime(600);
    subject.next('second');
    subject.complete();

    const results = await promise;
    expect(results).toEqual(['first', 'second']);
  });

  it('#05 => should handle fallback that emits multiple values', async () => {
    const source$ = NEVER;
    const fallback$ = of('a', 'b', 'c');

    const promise = lastValueFrom(
      source$.pipe(timeoutWithFallback(1000, fallback$), toArray()),
    );

    vi.advanceTimersByTime(1000);
    const results = await promise;

    expect(results).toEqual(['a', 'b', 'c']);
  });
});

describe('#02 => tickWithFallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('#01 => should reset timeout on each emission', () => {
    const subject = new Subject<string>();
    const fallback$ = of('timeout');
    const results: string[] = [];
    let completed = false;

    const subscription = subject
      .pipe(tickWithFallback(1000, fallback$))
      .subscribe({
        next: value => results.push(value),
        complete: () => (completed = true),
      });

    // Initial state
    expect(results).toHaveLength(0);
    expect(completed).toBe(false);

    // Emit first value
    subject.next('first');
    expect(results).toEqual(['first']);

    // Advance 800ms (not timeout yet)
    vi.advanceTimersByTime(800);
    expect(results).toEqual(['first']);
    expect(completed).toBe(false);

    // Emit second value (resets timeout)
    subject.next('second');
    expect(results).toEqual(['first', 'second']);

    // Advance another 800ms (timeout should reset)
    vi.advanceTimersByTime(800);
    expect(results).toEqual(['first', 'second']);
    expect(completed).toBe(false);

    // Advance 200ms more (total 1000ms from last emission)
    vi.advanceTimersByTime(200);
    expect(results).toEqual(['first', 'second', 'timeout']);
    expect(completed).toBe(true);

    // Teardown
    subscription.unsubscribe();
    subject.complete();
  });

  it('#02 => should timeout immediately when no emissions', () => {
    const subject = new Subject<number>();
    const fallback$ = of(999);
    const results: number[] = [];
    let completed = false;

    const subscription = subject
      .pipe(tickWithFallback(500, fallback$))
      .subscribe({
        next: value => results.push(value),
        complete: () => (completed = true),
      });

    // Initial state
    expect(results).toHaveLength(0);
    expect(completed).toBe(false);

    // Advance 500ms without emissions
    vi.advanceTimersByTime(500);

    // Should timeout and use fallback
    expect(results).toEqual([999]);
    expect(completed).toBe(true);

    // Teardown
    subscription.unsubscribe();
  });

  it('#03 => should handle source completion before timeout', () => {
    const subject = new Subject<string>();
    const fallback$ = of('fallback');
    const results: string[] = [];
    let completed = false;

    const subscription = subject
      .pipe(tickWithFallback(1000, fallback$))
      .subscribe({
        next: value => results.push(value),
        complete: () => (completed = true),
      });

    // Emit value
    subject.next('value');
    expect(results).toEqual(['value']);

    // Complete source before timeout
    vi.advanceTimersByTime(500);
    subject.complete();

    // Should complete normally
    expect(results).toEqual(['value']);
    expect(completed).toBe(true);

    // Teardown
    subscription.unsubscribe();
  });

  it('#04 => should handle source error before timeout', () => {
    const subject = new Subject<string>();
    const fallback$ = of('fallback');
    const results: string[] = [];
    let error: any = null;
    const testError = new Error('Source error');

    const subscription = subject
      .pipe(tickWithFallback(1000, fallback$))
      .subscribe({
        next: value => results.push(value),
        error: err => (error = err),
      });

    // Emit value
    subject.next('value');
    expect(results).toEqual(['value']);

    // Emit error before timeout
    vi.advanceTimersByTime(500);
    subject.error(testError);

    // Should propagate error
    expect(error).toBe(testError);
    expect(results).toEqual(['value']);

    // Teardown
    subscription.unsubscribe();
  });

  it('#05 => should handle fallback with multiple values', () => {
    const source$ = NEVER;
    const fallback$ = of('a', 'b', 'c');
    const results: string[] = [];
    let completed = false;

    const subscription = source$.pipe(tick(500, fallback$)).subscribe({
      next: value => results.push(value),
      complete: () => (completed = true),
    });

    // Initial state
    expect(results).toHaveLength(0);

    // Advance to timeout
    vi.advanceTimersByTime(500);

    // Should receive all fallback values
    expect(results).toEqual(['a', 'b', 'c']);
    expect(completed).toBe(true);

    // Teardown
    subscription.unsubscribe();
  });

  it('#06 => should handle fallback error', () => {
    const source$ = NEVER;
    const fallbackError = new Error('Fallback error');
    const fallback$ = new Observable<string>(subscriber => {
      subscriber.error(fallbackError);
    });
    let error: any = null;

    const subscription = source$
      .pipe(tickWithFallback(500, fallback$))
      .subscribe({
        error: err => (error = err),
      });

    // Initial state
    expect(error).toBe(null);

    // Advance to timeout
    vi.advanceTimersByTime(500);

    // Should propagate fallback error
    expect(error).toBe(fallbackError);

    // Teardown
    subscription.unsubscribe();
  });
});
