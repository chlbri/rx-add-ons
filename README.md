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

- **tapWhile**: Execute side effects conditionally based on a predicate
- **createPausable**: Create pausable and resumable observables with state
  control
- Full TypeScript support with proper type definitions
- Lightweight and tree-shakable
- Comprehensive test coverage

<br/>

## Usage

### tapWhile Operator

Execute side effects only when a predicate condition is met:

```typescript
import { of } from 'rxjs';
import { tapWhile } from '@bemedev/rx-add-ons';

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
```

### createPausable Function

Create observables that can be paused, resumed, started, and stopped:

```typescript
import { interval } from 'rxjs';
import { createPausable } from '@bemedev/rx-add-ons';

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
```

You can also use with observer objects:

```typescript
import { createPausable } from '@bemedev/rx-add-ons';
import { interval } from 'rxjs';

const controller = createPausable(interval(1000), {
  next: value => console.log('Next:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!'),
});

controller.start();
```

<br/>

## API Reference

### tapWhile(predicate, sideEffect)

An RxJS operator that executes a side effect only when the predicate
returns true.

**Parameters:**

- `predicate: (value: T) => boolean` - Function that determines whether to
  execute the side effect
- `sideEffect: (value: T) => void` - Function to execute when predicate
  returns true

**Returns:** `(source: Observable<T>) => Observable<T>`

### createPausable(source$, observer?)

Creates a pausable observable controller.

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

<br/>

## CHANGE_LOG

<details>

<summary>
View changelog
</summary>

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
