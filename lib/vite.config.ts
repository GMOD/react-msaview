import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import replace from '@rollup/plugin-replace'

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import postcss from 'rollup-plugin-postcss'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactMSAView',
      fileName: 'react-msaview',
    },
    rollupOptions: {
      // Upstream issue: https://github.com/rollup/rollup/issues/4699
      onwarn: (warning, defaultHandler) => {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          /"use (client|server)"/.test(warning.message)
        ) {
          return
        }

        defaultHandler(warning)
      },
      input: 'src/index.ts',
      output: {
        inlineDynamicImports: true,
        dir: 'bundle',
        format: 'umd',
        name: 'ReactMSAView',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
      plugins: [
        postcss({
          plugins: [],
        }),
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          preventAssignment: true,
        }),
        nodeResolve({ browser: true }),
        commonjs(),
        nodePolyfills(),
        terser(),
      ],
      external: ['react', 'react-dom', 'canvas'],
    },
  },
})
