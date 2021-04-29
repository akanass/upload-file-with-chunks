import { RollupOptions } from 'rollup';

// rollup plugins
import * as del from 'rollup-plugin-delete';
import * as typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import * as styles from 'rollup-plugin-styles';
import { cleanComments, metadata } from './rollup.plugin';

// rebuild config array to switch plugins values from config by plugins functions
const config: RollupOptions[] = [
  {
    input: ['./src_client/ts/global.ts', './src_client/ts/upload.ts'],
    output: {
      dir: './public/js',
      format: 'esm',
      entryFileNames: '[name]-[hash].min.mjs',
      chunkFileNames: '[name]-[hash].min.mjs',
      preferConst: true,
    },
    plugins: [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      del({ targets: ['./public/js/*.mjs'] }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      typescript({ tsconfig: './tsconfig.browser.json' }),
      nodeResolve({ mainFields: ['es2015', 'module', 'main'] }),
      terser(),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      cleanComments(),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      metadata(),
    ],
  },
  {
    input: './src_client/scss/style.scss',
    output: {
      dir: 'public/css',
      assetFileNames: '[name]-[hash][extname]',
    },
    plugins: [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      del({ targets: ['./public/css/*.css'] }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      styles({
        mode: 'extract',
        sass: {
          impl: 'sass',
          fibers: false,
          sync: true,
          includePaths: ['node_modules'],
        },
        minimize: true,
      }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      del({
        targets: ['./public/css/*.js'],
        hook: 'writeBundle',
      }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      metadata(),
    ],
  },
];

export default config;
