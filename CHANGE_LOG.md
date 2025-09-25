# Changelog

All notable changes to this project will be documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<br/>

<details>
<summary>

## **[0.0.1] - 2025/09/25** => _00:40_

</summary>

- ✨ Initial release of @bemedev/rx-add-ons
- 🎯 Add `tapWhile` operator for conditional side effects
- 🎮 Add `createPausable` function for pausable observables with state
  control
- 🧪 Comprehensive test coverage with 71 tests across all functionality
- 📚 Complete documentation with usage examples and API reference
- 🔧 Full TypeScript support with proper type definitions
- 📦 Lightweight and tree-shakable package
- ⚡ Support for hot and cold observables
- 🛡️ Robust error handling and edge case coverage
- 🎨 Follows RxJS conventions and patterns
- <u>Test coverage **_100%_**</u>

### Added

#### tapWhile Operator

- Execute side effects conditionally based on predicate functions
- Transparent pass-through of values without modification
- Error propagation from source, predicate, and side effect functions
- Support for all data types including primitives, objects, null, and
  undefined
- Integration with other RxJS operators

#### createPausable Function

- Create pausable and resumable observables with full state control
- Support for start, stop, pause, and resume operations
- Command interface for programmatic control
- Support for both function and object observers
- Proper state transition validation and invalid transition handling
- Works with both hot and cold observables
- Memory leak prevention for large streams
- Multiple start calls handling (restart functionality)

#### Development Infrastructure

- Complete test suite with numbered test organization
- Build system with Rollup configuration
- TypeScript configuration with strict typing
- ESLint configuration for code quality
- Size limit monitoring
- Continuous integration setup

</details>

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
