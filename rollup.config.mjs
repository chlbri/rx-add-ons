import { PLUGIN_BUILDERS } from '@bemedev/rollup-config';
import { glob } from 'glob';
import { defineConfig } from 'rollup';

const files = glob.sync('src/**/*.ts', {
  ignore: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.example.ts',
    '**/__tests__/**',
  ],
});

const sourcemap = true;

export default defineConfig({
  input: files,
  output: [
    {
      dir: 'lib',
      format: 'es',
      sourcemap,
      entryFileNames: '[name].js',
    },
    {
      dir: 'lib',
      format: 'cjs',
      sourcemap,
      entryFileNames: '[name].cjs',
    },
  ],
  plugins: [
    PLUGIN_BUILDERS.alias(),
    PLUGIN_BUILDERS.typescript({
      tsconfigOverride: {
        exclude: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/*.example.ts',
          '**/__tests__/**',
        ],
        compilerOptions: { declarationMap: true },
      },
    }),
    PLUGIN_BUILDERS.externals({
      // exclude peerDependencies and dependencies
      optDeps: false,
      builtinsPrefix: 'strip',
    }),
    PLUGIN_BUILDERS.tsPaths({}),
    PLUGIN_BUILDERS.clean({
      ignoresJS: ['**/*.example.ts', 'src/types.ts'],
      dir: 'lib',
      sourcemap,
    }),
  ],
});
