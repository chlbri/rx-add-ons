# @bemedev/rx-add-ons

A TypeScript library providing additional RxJS operators for enhanced
reactive programming.

<br/>

## Installation

```bash
npm install @bemedev/rx-add-ons
# or
yarn add @bemedev/rx-add-ons
# or
pnpm add @bemedev/rx-add-ons
```

<br/>

## Features

- **Enhanced tap operators**: `tapWhile` with access to emission index and
  accumulated values array
- **Enhanced filter operators**: `filter` with predicate context (value,
  index, all previous values)
- **Enhanced skip operators**: `skipWhile` with accumulated values tracking
- **Advanced timeout operators**: `timeoutWithFallback` and
  `tickWithFallback` for graceful timeout handling without errors
- **Time-based grouping**: `groupByTime` for windowed data collection with
  optional buffer size limits
- **Pausable observables**: `createPausable` for complete flow control
  (start, stop, pause, resume)
- Full TypeScript support with comprehensive type definitions
- Lightweight and tree-shakable with internal RxJS imports
- Enhanced operators provide access to emission index and accumulated
  values array
- Comprehensive test coverage

<br/>

## Documentation

### `createPausable`(source$, observer?)

Creates a pausable observable controller that provides complete flow
control over an observable stream.

**Parameters:**

- `source$: Observable<T>` - The source observable to control
- `observer?: Partial<Observer<T>> | ((value: T) => void)` - Optional
  observer or next callback

**Returns:** Object with control methods:

- `start(): void` - Start or restart the observable
- `stop(): void` - Stop the observable completely
- `pause(): void` - Pause emission (only when running)
- `resume(): void` - Resume emission (only when paused)
- `command(action): void` - Execute a command ('start' | 'stop' | 'pause' |
  'resume')

**Usage Examples:**

```typescript
import { interval } from 'rxjs';
import { createPausable } from '@bemedev/rx-add-ons';

// Basic usage with callback function
const source$ = interval(1000);
const controller = createPausable(source$, value => {
  console.log('Received:', value);
});

// Control the observable
controller.start(); // Start emitting values
controller.pause(); // Pause emission
controller.resume(); // Resume emission
controller.stop(); // Stop completely

// Or use the command method
controller.command('start');
controller.command('pause');
controller.command('resume');
controller.command('stop');

// Usage with observer objects
const controller2 = createPausable(interval(1000), {
  next: value => console.log('Next:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!'),
});

controller2.start();
```

<br/>

### `filter`(predicate)

Enhanced filter operator with access to emission index and accumulated
values array.

**Parameters:**

- `predicate: (value: T, index: number, all: T[]) => boolean` - Function
  that determines whether to emit the value
  - `value: T` - The current emitted value
  - `index: number` - The zero-based index of the current emission
  - `all: T[]` - Array of all values emitted so far (including current)

**Returns:** `(source: Observable<T>) => Observable<T>`

**Usage Examples:**

```typescript
import { of } from 'rxjs';
import { filter } from '@bemedev/rx-add-ons';

// Enhanced filter with index and accumulated values
of(1, 2, 3, 4, 5, 6)
  .pipe(
    filter((value, index, all) => {
      // Filter even values only after index 2, and when we have at least 4 values
      return index >= 2 && value % 2 === 0 && all.length >= 4;
    }),
  )
  .subscribe(console.log);
// Output: 4, 6

// Filter based on accumulated values sum
of(1, 2, 3, 4, 5)
  .pipe(
    filter((value, index, all) => {
      const sum = all.reduce((acc, val) => acc + val, 0);
      return sum <= 10; // Only emit while sum is <= 10
    }),
  )
  .subscribe(console.log);
// Output: 1, 2, 3, 4
```

<br/>

### `groupByTime`(windowSize, maxBufferSize?)

Group emissions by time windows with optional buffer size limits.

**Parameters:**

- `windowSize: number` - Time window size in milliseconds
- `maxBufferSize?: number` - Optional maximum buffer size

**Returns:** `(source: Observable<T>) => Observable<T[]>`

**Usage Examples:**

```typescript
import { interval } from 'rxjs';
import { groupByTime } from '@bemedev/rx-add-ons';

// Group emissions every 1000ms
interval(200).pipe(groupByTime(1000)).subscribe(console.log);
// Output: [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], ...

// Group with maximum buffer size
interval(100).pipe(groupByTime(1000, 3)).subscribe(console.log);
// Output: [0, 1, 2], [3, 4, 5], [6, 7, 8], ...
```

<br/>

### `skipWhile`(predicate)

Enhanced `skipWhile` operator that skips emitted values as long as the
predicate returns true. Provides access to emission context.

**Parameters:**

- `predicate: (value: T, index: number, all: T[]) => boolean` - Function
  that determines whether to continue skipping
  - `value: T` - The current emitted value
  - `index: number` - The zero-based index of the current emission
  - `all: T[]` - Array of all values emitted so far (including current)

**Returns:** `(source: Observable<T>) => Observable<T>`

**Usage Examples:**

```typescript
import { of } from 'rxjs';
import { skipWhile } from '@bemedev/rx-add-ons';

// Skip while condition with index and accumulated values
of(1, 2, 3, 4, 5, 6)
  .pipe(
    skipWhile((value, index, all) => {
      // Skip while value is less than 4 and we're still at early indices
      return value < 4 && index < 3 && all.length < 5;
    }),
  )
  .subscribe(console.log);
// Output: 4, 5, 6

// Skip while sum of accumulated values is less than 10
of(1, 2, 3, 4, 5)
  .pipe(
    skipWhile((value, _index, all) => {
      const sum = all.reduce((acc, val) => acc + val, 0);
      return sum < 10;
    }),
  )
  .subscribe(console.log);
// Output: 4, 5
```

<br/>

### `tapWhile`(predicate, sideEffect)

Enhanced RxJS operator that executes a side effect only when the predicate
returns true. The predicate and side effect functions receive additional
context about the emission.

**Parameters:**

- `predicate: (value: T, index: number, all: T[]) => boolean` - Function
  that determines whether to execute the side effect
  - `value: T` - The current emitted value
  - `index: number` - The zero-based index of the current emission
  - `all: T[]` - Array of all values emitted so far (including current)
- `sideEffect: (value: T, index: number, all: T[]) => void` - Function to
  execute when predicate returns true
  - Same parameters as predicate function

**Returns:** `(source: Observable<T>) => Observable<T>`

**Usage Examples:**

```typescript
import { of } from 'rxjs';
import { tapWhile } from '@bemedev/rx-add-ons';

// Basic conditional side effect
of(1, 2, 3, 4, 5)
  .pipe(
    tapWhile(
      value => value > 3, // predicate
      value => console.log('Value is greater than 3:', value), // side effect
    ),
  )
  .subscribe();
// Output:
// Value is greater than 3: 4
// Value is greater than 3: 5

// Enhanced tapWhile with index and accumulated values
of('a', 'b', 'c', 'd')
  .pipe(
    tapWhile(
      (value, index, all) => index < 2 && all.length <= 3,
      (value, index, all) =>
        console.log(`${value} at index ${index}, total: ${all.length}`),
    ),
  )
  .subscribe();
// Output:
// a at index 0, total: 1
// b at index 1, total: 2
```

<br/>

### `tickWithFallback`(timeout, fallback), alias `tick`

Switch to fallback Observable on timeout, with timeout reset on each
emission. Unlike `timeoutWithFallback`, this operator resets the timeout
counter each time the source emits a value.

**Parameters:**

- `timeout: number` - Timeout duration in milliseconds (resets on each
  emission)
- `fallback: Observable<T>` - Observable to switch to on timeout

**Returns:** `(source: Observable<T>) => Observable<T>`

**Usage Examples:**

```typescript
import { interval, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { tickWithFallback } from '@bemedev/rx-add-ons';

// Reset timeout on each emission
interval(2000)
  .pipe(take(3), tickWithFallback(3000, of('timeout')))
  .subscribe(console.log);
// Output: 0, 1, 2 (timeout resets on each emission)

// If source stops emitting, fallback kicks in
interval(5000) // Emits every 5 seconds
  .pipe(
    take(1),
    tickWithFallback(3000, of('timeout')), // 3 second timeout
  )
  .subscribe(console.log);
// Output: 'timeout' (because source takes 5s but timeout is 3s)
```

<br/>

### `timeoutWithFallback`(timeout, fallback), alias `timeout`

Switch to fallback Observable on timeout without throwing errors.

**Parameters:**

- `timeout: number` - Timeout duration in milliseconds
- `fallback: Observable<T>` - Observable to switch to on timeout

**Returns:** `(source: Observable<T>) => Observable<T>`

**Usage Examples:**

```typescript
import { timer, of } from 'rxjs';
import { timeoutWithFallback } from '@bemedev/rx-add-ons';

// Switch to fallback after 5 seconds
timer(10000) // Emits after 10 seconds
  .pipe(timeoutWithFallback(5000, of('timeout')))
  .subscribe(console.log);
// Output: 'timeout' (after 5 seconds)

// Source emits before timeout
timer(3000) // Emits after 3 seconds
  .pipe(timeoutWithFallback(5000, of('timeout')))
  .subscribe(console.log);
// Output: 0 (after 3 seconds)
```

<br/>

## CHANGE_LOG

<details>

<summary>
View changelog
</summary>

### Version [0.0.2] --> 25 septembre 2025

- ✨ Ajout de 5 opérateurs RxJS personnalisés
- 🎯 Ajout de l'opérateur `tapWhile` - exécution conditionnelle d'effets de
  bord avec accès au contexte
- 🔍 Ajout de l'opérateur `filter` - filtrage avancé avec accès à l'index
  et aux valeurs accumulées
- ⏭️ Ajout de l'opérateur `skipWhile` - saut conditionnel avec logique
  contextuelle
- ⏰ Ajout de l'opérateur `timeoutWithFallback` - timeout avec basculement
  sans erreur
- ⏰ Ajout de l'opérateur `tickWithFallback` - timeout qui se remet à zéro
  à chaque émission
- 📊 Ajout de l'opérateur `groupByTime` - groupement par fenêtres
  temporelles
- 🎮 Ajout de la fonction `createPausable` - contrôle complet du flux
  (start, stop, pause, resume)
- 🧪 Tests complets pour tous les opérateurs
- 📚 Documentation complète avec exemples d'utilisation

### Version [0.0.1] --> 25 septembre 2025

- ✨ Première version de la bibliothèque
- 🎯 Ajout de l'opérateur `tapWhile`
- 🎮 Ajout de la fonction `createPausable`
- 🧪 Tests complets avec couverture de code
- 📚 Documentation complète avec exemples

</details>

<br/>

## Contributing

Contributions are welcome! Please read our contribution guide for details.

<br/>

## License

MIT

<br/>

## Auteur

chlbri (bri_lvi@icloud.com)

[My github](https://github.com/chlbri?tab=repositories)

[<svg width="98" height="96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/></svg>](https://github.com/chlbri?tab=repositories)

<br/>

## Liens

- [Documentation](https://github.com/chlbri/rx-add-ons)
