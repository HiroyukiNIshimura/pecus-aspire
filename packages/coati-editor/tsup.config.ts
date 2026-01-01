import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    nodes: 'src/nodes/index.ts',
    'nodes-headless': 'src/nodes/headless.ts',
    transformers: 'src/transformers/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    /^@lexical\//,
    'lexical',
    'katex',
    'date-fns',
    'react-day-picker',
    /^@floating-ui\//,
    'use-debounce',
    'lodash-es',
    /^prettier/,
    'yjs',
    /^y-/,
    'classnames',
  ],
  // CSSファイルを別途出力
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.css': 'copy',
      '.svg': 'dataurl',
      '.png': 'dataurl',
    };
  },
});
